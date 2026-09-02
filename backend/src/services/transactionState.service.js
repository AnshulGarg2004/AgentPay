import Transaction from "../models/Transaction.model.js";
import { ALLOWED_TRANSITIONS, canTransition } from "../stateMachine/transitions.js";
import { logAudit } from "./audit.service.js";

/**
 * Returns allowed next states for a given current transaction state.
 * Used by frontend to gray out impossible actions.
 */
export function getValidNextStates(currentState) {
  return ALLOWED_TRANSITIONS[currentState] || [];
}

/**
 * Safely transitions a transaction to a new state after validating against the state machine.
 * Throws a clear error if the transition is illegal.
 */
export async function transitionTo(transactionIdOrDoc, newState, meta = {}) {
  let transaction;

  if (typeof transactionIdOrDoc === "object" && transactionIdOrDoc !== null && transactionIdOrDoc.state) {
    transaction = transactionIdOrDoc;
  } else {
    transaction = await Transaction.findById(transactionIdOrDoc);
  }

  if (!transaction) {
    throw new Error(`Transaction not found for ID: ${transactionIdOrDoc}`);
  }

  const currentState = transaction.state;

  // Allow idempotent transition to the exact same state without throwing
  if (currentState === newState) {
    return transaction;
  }

  if (!canTransition(currentState, newState)) {
    const allowed = getValidNextStates(currentState);
    throw new Error(
      `Invalid state transition: Cannot transition from '${currentState}' to '${newState}'. Allowed next states are: [${allowed.join(", ")}]`
    );
  }

  // Update state
  transaction.state = newState;
  await transaction.save();

  try {
    const { io, reason, actor, ...cleanMeta } = meta;
    const logReason = reason || `State transitioned from ${currentState} to ${newState}`;
    const logActor = actor || "SYSTEM";

    await logAudit({
      transactionId: transaction._id,
      action: `TRANSITION_${newState}`,
      reason: logReason,
      actor: logActor,
      result: newState,
      metadata: { previousState: currentState, newState, ...cleanMeta },
      io,
    });

    if (io) {
      io.emit("transaction.state_changed", {
        transactionId: transaction._id,
        state: newState,
        previousState: currentState,
      });
    }
  } catch (auditErr) {
    console.warn("Audit/Socket emission warning during state transition:", auditErr.message);
  }

  return transaction;
}

export const transactionStateService = {
  transitionTo,
  getValidNextStates,
};

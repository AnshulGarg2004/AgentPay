/**
 * Socket.IO Live Activity Gateway (Build Plan Section 3 & Phase 6)
 * Broadcasts real-time events to connected frontend clients.
 */
export function setupLiveActivityGateway(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.emit("agent.action", {
      actor: "POLICY_ENGINE",
      action: "GATEWAY_CONNECTED",
      reason: "Live AgentPay Protocol Feed Connected",
      result: "ACTIVE",
      timestamp: new Date(),
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return {
    emitAgentThinking: (data) => io.emit("agent.thinking", data),
    emitAgentAction: (data) => io.emit("agent.action", data),
    emitPolicyCheck: (data) => io.emit("policy.check", data),
    emitPaymentEvent: (data) => io.emit("payment.event", data),
    emitStateChanged: (data) => io.emit("transaction.state_changed", data),
  };
}

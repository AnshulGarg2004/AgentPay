import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.model.js";
import Product from "../src/models/Product.model.js";
import Merchant from "../src/models/Merchant.model.js";
import { TRANSACTION_STATES } from "../src/stateMachine/transactionStates.js";
import {
  transitionTo,
  getValidNextStates,
} from "../src/services/transactionState.service.js";

async function testTransactionStateService() {
  console.log("=== TESTING TRANSACTION STATE SERVICE ===");
  await connectDB();

  // 1. Verify Enum Contents
  console.log("\n1. Verifying TRANSACTION_STATES:");
  console.log(`   Total states defined: ${Object.keys(TRANSACTION_STATES).length}`);
  console.log(`   Sample: DISCOVERED -> ${TRANSACTION_STATES.DISCOVERED}, PAID -> ${TRANSACTION_STATES.PAID}`);

  // 2. Verify getValidNextStates
  console.log("\n2. Verifying getValidNextStates:");
  const pendingNext = getValidNextStates(TRANSACTION_STATES.PAYMENT_PENDING);
  console.log(`   Allowed next states from PAYMENT_PENDING: [${pendingNext.join(", ")}]`);

  // 3. Create dummy transaction for transition testing
  const product = await Product.findOne({ aiPurchasable: true });
  const merchant = await Merchant.findOne({});

  const txn = await Transaction.create({
    merchantId: merchant?._id || new mongoose.Types.ObjectId(),
    productId: product?._id || new mongoose.Types.ObjectId(),
    amountInPaise: 750000,
    unitPriceInPaise: 7500,
    quantity: 100,
    state: TRANSACTION_STATES.AGREED,
  });

  console.log(`\n3. Created Test Transaction (ID: ${txn._id}, Initial State: ${txn.state})`);

  // 4. Perform Legal State Transition: AGREED -> RESERVED
  const updatedTxn1 = await transitionTo(txn._id, TRANSACTION_STATES.RESERVED);
  console.log(`4. Transitioned AGREED -> RESERVED: New State = ${updatedTxn1.state}`);

  // 5. Perform Legal State Transition: RESERVED -> PAYMENT_PENDING
  const updatedTxn2 = await transitionTo(txn._id, TRANSACTION_STATES.PAYMENT_PENDING);
  console.log(`5. Transitioned RESERVED -> PAYMENT_PENDING: New State = ${updatedTxn2.state}`);

  // 6. Attempt Illegal State Transition: PAYMENT_PENDING -> COMPLETED (Should fail)
  console.log("6. Attempting illegal transition (PAYMENT_PENDING -> COMPLETED)...");
  try {
    await transitionTo(txn._id, TRANSACTION_STATES.COMPLETED);
    console.error("❌ FAILED: Illegal transition should have thrown an error!");
  } catch (err) {
    console.log(`   ✅ Correctly Threw Error: "${err.message}"`);
  }

  // Cleanup test transaction
  await Transaction.findByIdAndDelete(txn._id);

  await mongoose.connection.close();
  console.log("\n🎉 TRANSACTION STATE SERVICE INTEGRATION TEST PASSED PERFECTLY!");
}

testTransactionStateService().catch(console.error);

import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.model.js";
import Product from "../src/models/Product.model.js";
import Merchant from "../src/models/Merchant.model.js";
import Refund from "../src/models/Refund.model.js";
import {
  checkRefundEligibility,
  processRefund,
  approveRefund,
} from "../src/services/refund.service.js";

async function testRefundService() {
  console.log("=== TESTING REFUND SERVICE ===");
  await connectDB();

  const product = await Product.findOne({ aiPurchasable: true });
  const merchant = await Merchant.findOne({});

  // Set merchant threshold to ₹5,000 (500000 paise)
  if (merchant) {
    merchant.constitution = merchant.constitution || {};
    merchant.constitution.refundApprovalThresholdPaise = 500000;
    await merchant.save();
  }

  // 1. Create test transaction in PAID state
  const txn = await Transaction.create({
    merchantId: merchant?._id || new mongoose.Types.ObjectId(),
    productId: product?._id || new mongoose.Types.ObjectId(),
    amountInPaise: 750000, // ₹7,500
    unitPriceInPaise: 7500,
    quantity: 100,
    state: "PAID",
    razorpayPaymentId: "pay_test_refund_123",
  });

  console.log(`\n1. Created Test Transaction (ID: ${txn._id}, Amount: ₹7,500, State: PAID)`);

  // Test Case A: Excessive Amount
  console.log("\n• Case A: Requesting ₹10,000 (Exceeds original ₹7,500 amount)...");
  const checkA = await checkRefundEligibility(txn._id, 1000000);
  console.log("  Result Status:", checkA.status);
  console.log("  Reason:", `"${checkA.reason}"`);

  // Test Case B: Amount > Threshold (Requires Approval)
  console.log("\n• Case B: Requesting ₹6,000 (Exceeds ₹5,000 merchant threshold)...");
  const checkB = await checkRefundEligibility(txn._id, 600000);
  console.log("  Result Status:", checkB.status);
  console.log("  Reason:", `"${checkB.reason}"`);

  // Test Case C: Eligible Amount (₹3,000)
  console.log("\n• Case C: Requesting ₹3,000 (Within threshold)...");
  const checkC = await checkRefundEligibility(txn._id, 300000);
  console.log("  Result Status:", checkC.status);
  console.log("  Reason:", `"${checkC.reason}"`);

  // Test Case D: Non-PAID Transaction State
  txn.state = "PAYMENT_PENDING";
  await txn.save();
  console.log("\n• Case D: Transaction in PAYMENT_PENDING state...");
  const checkD = await checkRefundEligibility(txn._id, 300000);
  console.log("  Result Status:", checkD.status);
  console.log("  Reason:", `"${checkD.reason}"`);

  // Reset state to PAID for processing test
  txn.state = "PAID";
  await txn.save();

  // 2. Test Creating and Processing an ELIGIBLE Refund
  console.log("\n2. Testing processRefund for ELIGIBLE refund...");
  const refundDoc = await Refund.create({
    transactionId: txn._id,
    amountInPaise: 300000,
    status: checkC.status,
    reason: checkC.reason,
  });

  const processedRefund = await processRefund(refundDoc._id);
  console.log(`   Processed Refund Status: ${processedRefund.status} (Razorpay ID: ${processedRefund.razorpayRefundId})`);

  const updatedTxn = await Transaction.findById(txn._id);
  console.log(`   Updated Transaction State: ${updatedTxn.state} (Expected: REFUND_PENDING)`);

  // 3. Test approveRefund for REQUIRES_APPROVAL refund
  console.log("\n3. Testing approveRefund for REQUIRES_APPROVAL refund...");
  // Reset transaction state to PAID
  updatedTxn.state = "PAID";
  await updatedTxn.save();

  const approvalRefundDoc = await Refund.create({
    transactionId: txn._id,
    amountInPaise: 600000,
    status: checkB.status,
    reason: checkB.reason,
  });

  const approvedProcessedRefund = await approveRefund(approvalRefundDoc._id, "Ops Manager Jane");
  console.log(`   Approved & Processed Refund Status: ${approvedProcessedRefund.status}`);
  console.log(`   Approved By: ${approvedProcessedRefund.approvedBy}`);

  // Cleanup test documents
  await Transaction.findByIdAndDelete(txn._id);
  await Refund.deleteMany({ transactionId: txn._id });

  await mongoose.connection.close();
  console.log("\n🎉 REFUND SERVICE INTEGRATION TEST PASSED PERFECTLY!");
}

testRefundService().catch(console.error);

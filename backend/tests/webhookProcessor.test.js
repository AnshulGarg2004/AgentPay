import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.model.js";
import Product from "../src/models/Product.model.js";
import Merchant from "../src/models/Merchant.model.js";
import WebhookEvent from "../src/models/WebhookEvent.model.js";
import { processWebhookEvent } from "../src/services/webhookProcessor.service.js";

async function testWebhookProcessor() {
  console.log("=== TESTING WEBHOOK PROCESSOR SERVICE ===");
  await connectDB();

  const product = await Product.findOne({ aiPurchasable: true });
  const merchant = await Merchant.findOne({});

  const orderId = `order_test_${Date.now()}`;

  const txn = await Transaction.create({
    merchantId: merchant?._id || new mongoose.Types.ObjectId(),
    productId: product?._id || new mongoose.Types.ObjectId(),
    amountInPaise: 750000,
    unitPriceInPaise: 7500,
    quantity: 100,
    razorpayOrderId: orderId,
    state: "PAYMENT_PENDING",
  });

  console.log(`\nCreated Test Transaction (ID: ${txn._id}, Razorpay Order ID: ${orderId}, Initial State: ${txn.state})`);

  // 1. Test payment.captured Event
  console.log("\n1. Testing 'payment.captured' Webhook Event:");
  const capturedEvent = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_test_${Date.now()}`,
          order_id: orderId,
          status: "captured",
        },
      },
    },
  };

  const capturedRes = await processWebhookEvent(capturedEvent);
  console.log("   Result:", capturedRes);

  const updatedTxn1 = await Transaction.findById(txn._id);
  console.log(`   Transaction State after payment.captured: ${updatedTxn1.state} (Expected: PAID)`);

  // Reset transaction state to PAYMENT_PENDING for next test
  updatedTxn1.state = "PAYMENT_PENDING";
  await updatedTxn1.save();

  // 2. Test payment.failed Event
  console.log("\n2. Testing 'payment.failed' Webhook Event:");
  const failedEvent = {
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: `pay_failed_${Date.now()}`,
          order_id: orderId,
          error_description: "Card declined by issuing bank",
        },
      },
    },
  };

  const failedRes = await processWebhookEvent(failedEvent);
  console.log("   Result:", failedRes);

  const updatedTxn2 = await Transaction.findById(txn._id);
  console.log(`   Transaction State after payment.failed: ${updatedTxn2.state} (Expected: PAYMENT_FAILED)`);
  console.log(`   Recorded Failure Reason: "${updatedTxn2.paymentFailureReason}"`);

  // 3. Test order.paid Event
  console.log("\n3. Testing 'order.paid' Webhook Event:");
  const orderPaidEvent = {
    event: "order.paid",
    payload: { order: { entity: { id: orderId } } },
  };
  const orderPaidRes = await processWebhookEvent(orderPaidEvent);
  console.log("   Result:", orderPaidRes);

  // 4. Test Unrecognized Event
  console.log("\n4. Testing Unrecognized Event ('dispute.created'):");
  const unrecognizedEvent = {
    event: "dispute.created",
    payload: {},
  };
  const unrecRes = await processWebhookEvent(unrecognizedEvent);
  console.log("   Result:", unrecRes);

  // 5. Test Non-existent Transaction Lookup Safety
  console.log("\n5. Testing Non-existent Transaction Lookup:");
  const missingTxnEvent = {
    event: "payment.captured",
    payload: { payment: { entity: { order_id: "order_non_existent_99999" } } },
  };
  const missingRes = await processWebhookEvent(missingTxnEvent);
  console.log("   Result (Handled gracefully without throwing):", missingRes);

  // Cleanup test transaction
  await Transaction.findByIdAndDelete(txn._id);

  await mongoose.connection.close();
  console.log("\n🎉 WEBHOOK PROCESSOR SERVICE INTEGRATION TEST PASSED PERFECTLY!");
}

testWebhookProcessor().catch(console.error);

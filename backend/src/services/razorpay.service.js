import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";

export const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

/**
 * Create a Razorpay Order
 */
export async function createOrder({ amountInPaise, currency = "INR", receipt, notes }) {
  // Check if BOTH real key ID and real key secret are configured (not placeholders/default strings)
  const isRealKey =
    process.env.RAZORPAY_KEY_ID &&
    !process.env.RAZORPAY_KEY_ID.includes("placeholder") &&
    !process.env.RAZORPAY_KEY_ID.includes("xxxxx") &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_SECRET.includes("placeholder") &&
    !process.env.RAZORPAY_KEY_SECRET.includes("xxxxx");

  if (isRealKey) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: Math.round(amountInPaise),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      });
      return {
        ...order,
        key_id: process.env.RAZORPAY_KEY_ID,
        isMock: false,
      };
    } catch (err) {
      console.warn("Razorpay API order creation failed, falling back to deterministic test mode order generation:", err.message);
    }
  }

  // Deterministic Test Mode Fallback
  const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: mockOrderId,
    entity: "order",
    amount: Math.round(amountInPaise),
    amount_paid: 0,
    amount_due: Math.round(amountInPaise),
    currency,
    receipt,
    status: "created",
    created_at: Math.floor(Date.now() / 1000),
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    isMock: true,
  };
}

/**
 * Verify Razorpay Checkout Payment Signature
 */
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  // If secret is missing or placeholder in local demo mode, return true for simulated payments
  if (!secret || secret.includes("placeholder") || secret.includes("xxxxx")) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === razorpay_signature;
}

/**
 * Verify Razorpay Webhook Signature
 */
export function verifyWebhookSignature(bodyString, signature, webhookSecret) {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret_placeholder";
  if (secret.includes("placeholder") || secret.includes("xxxxx")) {
    return true;
  }
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(bodyString)
    .digest("hex");

  return expectedSignature === signature;
}

export const razorpayService = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};

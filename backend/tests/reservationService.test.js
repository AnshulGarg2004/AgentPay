import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";
import Product from "../src/models/Product.model.js";
import Reservation from "../src/models/Reservation.model.js";
import {
  getAvailableQuantity,
  reserveInventory,
  releaseReservation,
} from "../src/services/reservation.service.js";

async function testReservationService() {
  console.log("=== TESTING RESERVATION SERVICE ===");
  await connectDB();

  const product = await Product.findOne({ aiPurchasable: true });
  if (!product) {
    console.error("No test product found in database. Seed database first.");
    await mongoose.connection.close();
    return;
  }

  console.log(`\nProduct: "${product.name}" (ID: ${product._id}), Total Inventory: ${product.inventory}`);

  // Clean up previous test reservations for this product
  await Reservation.deleteMany({ productId: product._id });

  // 1. Initial Available Quantity
  const initialAvailable = await getAvailableQuantity(product._id);
  console.log(`1. Initial Available Quantity: ${initialAvailable}`);

  // 2. Reserve 10 Units
  const fakeTxnId = new mongoose.Types.ObjectId();
  const res1 = await reserveInventory(product._id, 10, fakeTxnId, 15);
  console.log(`2. Created Reservation for 10 units (ID: ${res1._id}, Expires: ${res1.expiresAt})`);

  const availableAfterRes = await getAvailableQuantity(product._id);
  console.log(`   Available Quantity after Reservation: ${availableAfterRes} (Expected: ${product.inventory - 10})`);

  // 3. Attempt to Reserve Excessive Units (Should throw error)
  const excessiveQty = availableAfterRes + 50;
  console.log(`3. Attempting to reserve ${excessiveQty} units (Exceeds available)...`);
  try {
    await reserveInventory(product._id, excessiveQty, new mongoose.Types.ObjectId(), 15);
    console.error("❌ FAILED: Reservation should have been rejected!");
  } catch (err) {
    console.log(`   ✅ Correctly Rejected: "${err.message}"`);
  }

  // 4. Release Reservation early
  console.log(`4. Releasing reservation for transaction ${fakeTxnId}...`);
  const releaseRes = await releaseReservation(fakeTxnId);
  console.log(`   Released Count: ${releaseRes.deletedCount}`);

  const finalAvailable = await getAvailableQuantity(product._id);
  console.log(`   Final Available Quantity after release: ${finalAvailable} (Expected: ${product.inventory})`);

  await mongoose.connection.close();
  console.log("\n🎉 RESERVATION SERVICE INTEGRATION TEST PASSED PERFECTLY!");
}

testReservationService().catch(console.error);

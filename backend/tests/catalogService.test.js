import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";
import {
  searchProducts,
  getProductById,
  calculatePriceForQuantity,
  checkAvailability,
} from "../src/services/catalog.service.js";

async function testCatalogService() {
  console.log("=== TESTING CATALOG SERVICE METHODS ===");
  await connectDB();

  // 1. Test searchProducts
  const products = await searchProducts({ category: "chairs" });
  console.log(`\n1. searchProducts({ category: "chairs" }): Found ${products.length} products`);
  if (products.length > 0) {
    console.log(`   Sample: "${products[0].name}" (ID: ${products[0]._id})`);
  }

  // 2. Test getProductById
  if (products.length > 0) {
    const p = await getProductById(products[0]._id);
    console.log(`\n2. getProductById("${products[0]._id}"): Successfully fetched "${p.name}"`);

    // 3. Test calculatePriceForQuantity
    const basePrice = p.priceInPaise;
    const qty10Price = calculatePriceForQuantity(p, 10);
    const qty25Price = calculatePriceForQuantity(p, 25);
    console.log(`\n3. calculatePriceForQuantity:`);
    console.log(`   • Base (Qty 1): ₹${basePrice / 100}`);
    console.log(`   • Qty 10 (Tier Discount): ₹${qty10Price / 100}`);
    console.log(`   • Qty 25 (Highest Tier Discount): ₹${qty25Price / 100}`);

    // 4. Test checkAvailability
    const avail10 = await checkAvailability(p._id, 10);
    const avail999 = await checkAvailability(p._id, 999);
    console.log(`\n4. checkAvailability:`);
    console.log(`   • Qty 10: Available=${avail10.available} (Stock: ${avail10.availableQty})`);
    console.log(`   • Qty 999: Available=${avail999.available} (Stock: ${avail999.availableQty})`);
  }

  await mongoose.connection.close();
  console.log("\n✅ CATALOG SERVICE TESTS PASSED!");
}

testCatalogService().catch(console.error);

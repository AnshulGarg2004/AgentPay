import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Merchant from "../models/Merchant.model.js";
import Product from "../models/Product.model.js";
import BuyerAgent from "../models/BuyerAgent.model.js";

async function seed() {
  console.log("🌱 Starting AgentPay seed process...");
  await connectDB();

  try {
    // Clear existing Phase 1 collections
    await Merchant.deleteMany({});
    await Product.deleteMany({});
    await BuyerAgent.deleteMany({});
    console.log("🧹 Cleared existing Merchant, Product, and BuyerAgent collections.");

    // 1. Seed Merchant
    const merchant = await Merchant.create({
      name: "TechCraft Office Solutions",
      verified: true,
      constitution: {
        maxDiscountPct: 15,
        minMarginPaise: 50000, // ₹500
        maxAiTransactionPaise: 50000000, // ₹5,00,000
        refundApprovalThresholdPaise: 5000000, // ₹50,000
        priceChangeReapprovalPct: 5,
        reservationMinutes: 15,
        internationalEnabled: false,
      },
    });
    console.log(`✅ Created Merchant: ${merchant.name} (ID: ${merchant._id})`);

    // 2. Seed ~10 Realistic B2B Products (Prices stored in paise)
    const productsData = [
      {
        merchantId: merchant._id,
        name: "Ergonomic Mesh Task Chair",
        priceInPaise: 750000, // ₹7,500
        minPriceInPaise: 650000, // ₹6,500
        inventory: 150,
        attributes: {
          category: "chairs",
          color: ["black", "charcoal"],
          material: "breathable mesh",
          lumbarSupport: true,
          adjustableArmrests: true,
        },
        bulkDiscounts: [
          { minQty: 10, discountPct: 5 },
          { minQty: 25, discountPct: 10 },
        ],
        deliveryMinDays: 2,
        deliveryMaxDays: 5,
        warranty: "3 years manufacturer warranty",
        returnPolicyDays: 14,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Executive Leather High-Back Chair",
        priceInPaise: 1850000, // ₹18,500
        minPriceInPaise: 1600000, // ₹16,000
        inventory: 45,
        attributes: {
          category: "chairs",
          color: ["brown", "black"],
          material: "top-grain leather",
          tiltLock: true,
        },
        bulkDiscounts: [
          { minQty: 5, discountPct: 5 },
          { minQty: 15, discountPct: 10 },
        ],
        deliveryMinDays: 3,
        deliveryMaxDays: 7,
        warranty: "5 years premium warranty",
        returnPolicyDays: 14,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "UltraWide 34\" Curved Productivity Monitor",
        priceInPaise: 3499900, // ₹34,999
        minPriceInPaise: 3100000, // ₹31,000
        inventory: 60,
        attributes: {
          category: "monitors",
          screenSize: "34 inch",
          resolution: "3440 x 1440 WQHD",
          refreshRate: "100Hz",
          usbC: true,
        },
        bulkDiscounts: [
          { minQty: 5, discountPct: 4 },
          { minQty: 10, discountPct: 8 },
        ],
        deliveryMinDays: 2,
        deliveryMaxDays: 4,
        warranty: "3 years onsite replacement",
        returnPolicyDays: 7,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "4K UHD 27\" IPS Monitor with USB-C Hub",
        priceInPaise: 2450000, // ₹24,500
        minPriceInPaise: 2200000, // ₹22,000
        inventory: 90,
        attributes: {
          category: "monitors",
          screenSize: "27 inch",
          resolution: "3840 x 2160 4K",
          hdr: true,
          powerDeliveryWatts: 65,
        },
        bulkDiscounts: [{ minQty: 10, discountPct: 6 }],
        deliveryMinDays: 2,
        deliveryMaxDays: 4,
        warranty: "3 years standard",
        returnPolicyDays: 7,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Business Pro Laptop Core i7 16GB 512GB SSD",
        priceInPaise: 7200000, // ₹72,000
        minPriceInPaise: 6500000, // ₹65,000
        inventory: 35,
        attributes: {
          category: "laptops",
          processor: "Intel Core i7 13th Gen",
          ram: "16GB DDR5",
          storage: "512GB NVMe SSD",
          os: "Windows 11 Pro",
        },
        bulkDiscounts: [
          { minQty: 5, discountPct: 5 },
          { minQty: 15, discountPct: 8 },
        ],
        deliveryMinDays: 3,
        deliveryMaxDays: 6,
        warranty: "3 years ADP (Accidental Damage Protection)",
        returnPolicyDays: 7,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Enterprise Workstation Laptop i9 32GB 1TB",
        priceInPaise: 13500000, // ₹1,35,000
        minPriceInPaise: 12000000, // ₹1,20,000
        inventory: 20,
        attributes: {
          category: "laptops",
          processor: "Intel Core i9 14th Gen",
          ram: "32GB DDR5",
          storage: "1TB Gen4 SSD",
          gpu: "NVIDIA RTX 4060",
        },
        bulkDiscounts: [{ minQty: 3, discountPct: 5 }],
        deliveryMinDays: 3,
        deliveryMaxDays: 7,
        warranty: "3 years premier support",
        returnPolicyDays: 7,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Wireless Ergonomic Mechanical Keyboard",
        priceInPaise: 450000, // ₹4,500
        minPriceInPaise: 380000, // ₹3,800
        inventory: 200,
        attributes: {
          category: "keyboards",
          connectivity: "Bluetooth / 2.4GHz Wireless",
          switchType: "Quiet Tactile Brown",
          batteryLifeDays: 90,
        },
        bulkDiscounts: [{ minQty: 20, discountPct: 8 }],
        deliveryMinDays: 1,
        deliveryMaxDays: 3,
        warranty: "1 year replacement",
        returnPolicyDays: 14,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Silent Slim Wireless Keyboard & Mouse Combo",
        priceInPaise: 220000, // ₹2,200
        minPriceInPaise: 180000, // ₹1,800
        inventory: 300,
        attributes: {
          category: "keyboards",
          connectivity: "2.4GHz Nano USB Receiver",
          silentKeys: true,
          color: "graphite",
        },
        bulkDiscounts: [{ minQty: 30, discountPct: 10 }],
        deliveryMinDays: 1,
        deliveryMaxDays: 3,
        warranty: "1 year standard",
        returnPolicyDays: 14,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Thunderbolt 4 Universal Docking Station",
        priceInPaise: 1499900, // ₹14,999
        minPriceInPaise: 1250000, // ₹12,500
        inventory: 80,
        attributes: {
          category: "docking stations",
          ports: "4x Thunderbolt 4, 2x HDMI 2.1, 4x USB-A, 2.5G Ethernet",
          powerDeliveryWatts: 96,
        },
        bulkDiscounts: [{ minQty: 10, discountPct: 7 }],
        deliveryMinDays: 2,
        deliveryMaxDays: 4,
        warranty: "2 years replacement",
        returnPolicyDays: 7,
        aiPurchasable: true,
      },
      {
        merchantId: merchant._id,
        name: "Dual Monitor Spring Arm Desk Mount",
        priceInPaise: 360000, // ₹3,600
        minPriceInPaise: 300000, // ₹3,000
        inventory: 120,
        attributes: {
          category: "accessories",
          maxWeightPerArmKg: 9,
          vesaPattern: "75x75 / 100x100",
          cableManagement: true,
        },
        bulkDiscounts: [{ minQty: 15, discountPct: 10 }],
        deliveryMinDays: 1,
        deliveryMaxDays: 3,
        warranty: "3 years warranty",
        returnPolicyDays: 14,
        aiPurchasable: true,
      },
    ];

    const products = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${products.length} B2B products.`);

    // 3. Seed Buyer Agent
    const buyerAgent = await BuyerAgent.create({
      ownerOrg: "Apex Global Technologies",
      constitution: {
        maxTransactionPaise: 100000000, // ₹10,00,000
        dailySpendLimitPaise: 500000000, // ₹50,00,000
        humanApprovalThresholdPaise: 25000000, // ₹2,50,000
        allowedCategories: ["chairs", "monitors", "laptops", "keyboards", "docking stations", "accessories"],
        blockedCategories: ["weapons", "gambling", "crypto"],
        verifiedMerchantsOnly: true,
      },
    });
    console.log(`✅ Created Buyer Agent: ${buyerAgent.ownerOrg} (ID: ${buyerAgent._id})`);

    console.log("\n🎉 Seed complete! Summary:");
    console.log(`- Merchant ID: ${merchant._id}`);
    console.log(`- Buyer Agent ID: ${buyerAgent._id}`);
    console.log(`- Total Products: ${products.length}`);
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();

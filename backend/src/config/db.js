import mongoose from "mongoose";

export async function connectDB() {
  const connStr = process.env.MONGODB_URI || "mongodb://localhost:27017/agentpay";
  try {
    // Set a short server selection timeout for local dev so app doesn't hang if mongod isn't started yet
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 3000 });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("⚠️ Continuing backend server startup in offline/disconnected DB mode...");
  }
}
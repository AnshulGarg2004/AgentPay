import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
  });

  app.set("io", io); // access via req.app.get("io") in controllers

  server.listen(PORT, () => {
    console.log(`🚀 AgentPay backend running on http://localhost:${PORT}`);
  });

  // Connect DB in background without blocking server listen
  connectDB().catch((err) => console.error("DB init error:", err.message));
}

start();
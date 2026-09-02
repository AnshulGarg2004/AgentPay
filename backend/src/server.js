import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { setupLiveActivityGateway } from "./sockets/liveActivity.gateway.js";

const PORT = process.env.PORT || 4000;

async function start() {
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  setupLiveActivityGateway(io);
  app.set("io", io); // access via req.app.get("io") in controllers

  // Handle server errors cleanly BEFORE calling listen
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ [AgentPay Server] Port ${PORT} is currently occupied by another process.`);
      console.error(`💡 Solution: Run 'taskkill /F /IM node.exe' (Windows) or 'npx kill-port ${PORT}' to free port ${PORT}.\n`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 AgentPay backend running on http://localhost:${PORT}`);
  });

  // Connect DB in background without blocking server listen
  connectDB().catch((err) => console.error("DB init error:", err.message));
}

start();
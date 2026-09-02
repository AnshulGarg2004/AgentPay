# AgentPay — Setup Guide (Start Here)

Follow this top to bottom in your terminal. It scaffolds both `frontend/` and `backend/`, wires up Tailwind, Mongoose, Socket.IO, Razorpay, and Groq, and gets you to a running "Hello AgentPay" on both servers. After this, hand `AgentPay_Build_Plan.md` to your AI coding assistant to build out the actual features phase by phase.

---

## 0. Prerequisites

- **Node.js 18+** (`node -v` to check)
- **MongoDB** — either:
  - a local install (`mongod` running on `localhost:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (easier, no local install)
- **Razorpay Test Mode keys** — from the [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys (Test Mode)
- **Groq API key** — from [console.groq.com](https://console.groq.com/keys)

---

## 1. Create the monorepo

```bash
mkdir agentpay && cd agentpay
git init
mkdir frontend backend
```

---

## 2. Backend setup

```bash
cd backend
npm init -y
```

Install dependencies:
```bash
npm install express mongoose cors dotenv socket.io razorpay groq-sdk jsonwebtoken
npm install -D nodemon
```

Set `backend/package.json` scripts:
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seed.js"
  }
}
```
> Using `"type": "module"` so you can write clean `import/export` JavaScript throughout the backend.

Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/agentpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
GROQ_API_KEY=xxxxx
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=change_this_to_something_random
PORT=4000
```
(Swap `MONGODB_URI` for your Atlas connection string if not running Mongo locally.)

Create the base folders:
```bash
mkdir -p src/config src/models src/routes src/controllers src/services/ai \
         src/policies src/stateMachine src/middleware src/sockets src/utils src/seed
```

**`backend/src/config/db.js`**
```js
import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
```

**`backend/src/config/groq.js`**
```js
import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
```

**`backend/src/config/razorpay.js`**
```js
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

**`backend/src/app.js`**
```js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AgentPay backend" });
});

export default app;
```

**`backend/src/server.js`**
```js
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
  });

  app.set("io", io); // access via req.app.get("io") in controllers

  server.listen(PORT, () => {
    console.log(`🚀 AgentPay backend running on http://localhost:${PORT}`);
  });
}

start();
```

**Quick Groq sanity check** — `backend/src/scripts/testGroq.js`:
```js
import "dotenv/config";
import { groq, GROQ_MODEL } from "../config/groq.js";

const res = await groq.chat.completions.create({
  model: GROQ_MODEL,
  messages: [{ role: "user", content: "Reply with just: AgentPay AI online" }],
});
console.log(res.choices[0].message.content);
```
Run it: `node src/scripts/testGroq.js` — confirms your Groq key and model work before you build the agents.

Start the backend:
```bash
npm run dev
```
Visit `http://localhost:4000/api/health` — should return `{"status":"ok", ...}`.

---

## 3. Frontend setup

```bash
cd ../frontend
npm create vite@latest . -- --template react
```
(Choose the plain **React** template — JavaScript, not TypeScript.)

```bash
npm install
npm install axios socket.io-client @tanstack/react-query zustand recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**`frontend/tailwind.config.js`** — replace `content` and add the design tokens from `AgentPay_Build_Plan.md` Section 4:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef2ff", 100: "#e0e7ff", 500: "#3b5ee8", 600: "#2f4fd1", 700: "#2540ab" },
        success: { light: "#dcfce7", DEFAULT: "#16a34a", dark: "#14532d" },
        warning: { light: "#fef9c3", DEFAULT: "#ca8a04", dark: "#713f12" },
        danger:  { light: "#fee2e2", DEFAULT: "#dc2626", dark: "#7f1d1d" },
        ink: { 900: "#0f1729", 700: "#334155", 400: "#94a3b8" },
        surface: { DEFAULT: "#ffffff", alt: "#f8fafc", border: "#e2e8f0" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 41, 0.04), 0 4px 12px rgba(15, 23, 41, 0.04)",
        cardHover: "0 8px 24px rgba(15, 23, 41, 0.08)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
    },
  },
  plugins: [],
};
```

**`frontend/src/index.css`** — replace the default Vite CSS entirely:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { @apply font-sans text-ink-700; }
  h1, h2, h3 { @apply text-ink-900 font-semibold; }
}
```

**`frontend/index.html`** — add the Inter font in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

Create `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

**`frontend/src/lib/api.js`**
```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
```

Sanity-check `frontend/src/App.jsx`:
```jsx
export default function App() {
  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
        <h1 className="text-2xl mb-2">AgentPay</h1>
        <p className="text-ink-400">Frontend is wired up. Tailwind is live.</p>
      </div>
    </div>
  );
}
```

Run it:
```bash
npm run dev
```
Visit the printed localhost URL — you should see a styled card, confirming Tailwind is active.

---

## 4. Groq notes for the AI agent services

Groq's API is OpenAI-compatible and supports tool/function calling, which the plan's `services/ai/tools.js` relies on. When you get to Phase 2 of the build plan:

- Use `groq.chat.completions.create({ model, messages, tools, tool_choice: "auto" })` — same shape as OpenAI's function-calling API.
- Good model choices on Groq for this project: `llama-3.3-70b-versatile` (strong reasoning/negotiation quality) or `llama-3.1-8b-instant` (fast, cheap, fine for simple intent parsing).
- Groq is fast but rate-limited on free tier — cache/log LLM responses in `AuditLog` so repeated demo runs don't burn quota.
- Keep the hard rule from the plan: Groq/the LLM only ever *proposes* an action; `policyEngine.service.js` (plain JS, no LLM) is what authorizes money movement.

---

## 5. Folder structure reference

Once both `npm run dev` commands work, follow `AgentPay_Build_Plan.md`:
- **Section 3** for the full file/folder layout to create as you go
- **Section 5** for the Mongoose schemas
- **Section 10** for the phase-by-phase build order (don't skip ahead)

---

## 6. Running the whole thing

Two terminals:
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Once Phase 0 scaffolding above is done, hand the build plan + this setup guide to your AI coding assistant and say: *"Follow AgentPay_Build_Plan.md Section 10, Phase 1 onward — the backend and frontend are already scaffolded and running."*
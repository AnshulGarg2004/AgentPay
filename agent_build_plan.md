# AgentPay — Complete Build Plan
### The Trust & Transaction Layer for AI-Native Commerce
**Track 01 — AI Growth & Agentic Commerce | Razorpay Hackathon**

> Hand this entire document to your AI coding assistant (Claude Code, Cursor, etc.) as the project brief. It contains the folder structure, tech stack, data models, API contracts, design system, and a phased build order.

---

## 1. Scope Decision (MVP first)

Build **P0 only** for a working, demo-able product. P1/P2 are stretch goals — do NOT start them until every P0 item works end-to-end.

**P0 (must work for demo):**
AI Buyer Agent · AI Merchant Agent · AI-readable catalog · Product discovery · Negotiation · Merchant policy engine · Buyer spending policy · Quote generation + expiry · Razorpay order/payment (test mode) · Webhook verification · Transaction state machine · Audit trail · Human approval gateway · Payment-timeout recovery (idempotency) · Live dashboard

**Vertical for the demo:** B2B office/electronics procurement (laptops, monitors, keyboards, chairs, docking stations) — gives natural bulk pricing, negotiation, and approval scenarios.

**Explicitly NOT building:** blockchain, custom ML model, microservices, own payment gateway, multi-category marketplace, voice interface.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + **JavaScript** (`.jsx`, no TypeScript) |
| Styling | **Tailwind CSS v3** (strict — no CSS modules, no styled-components) |
| Charts | Recharts (dashboard analytics) |
| State/data | React Query (TanStack Query) + Zustand for lightweight UI state |
| Backend | Node.js + Express (**plain JavaScript**, no TypeScript) |
| Database | **MongoDB + Mongoose** (single database, no Postgres/Prisma) |
| Locks / TTL / idempotency | Handled **inside MongoDB** — no Redis, no Docker (see Section 9) |
| Payments | Razorpay Node SDK (Test Mode) |
| AI | **Groq** (Llama 3.3 70B / other Groq-hosted models) via `groq-sdk`, using OpenAI-style tool/function calling |
| Realtime | WebSocket (Socket.IO) for the "Live Agent Activity" feed |
| Auth | Simple JWT (agent identity, not full IAM) |
| Local dev | Run Node directly + a local MongoDB install or a free MongoDB Atlas cluster — **no Docker required** |

---

## 3. Monorepo Folder Structure

```
agentpay/
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/                        # React + Vite + Tailwind (JavaScript)
│   ├── package.json
│   ├── jsconfig.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                # Tailwind directives + design tokens
│       │
│       ├── assets/
│       │   └── logo.svg
│       │
│       ├── lib/
│       │   ├── api.js               # axios/fetch client, base URL, interceptors
│       │   ├── socket.js            # Socket.IO client
│       │   └── format.js            # currency (₹), date, number formatters
│       │
│       ├── hooks/
│       │   ├── useTransactions.js
│       │   ├── useLiveActivity.js
│       │   ├── useMerchantAnalytics.js
│       │   └── useApproval.js
│       │
│       ├── store/
│       │   └── uiStore.js           # zustand: sidebar state, active tab, modals
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Topbar.jsx
│       │   │   └── PageShell.jsx
│       │   ├── common/
│       │   │   ├── Badge.jsx        # status pills (PAID, PENDING, FAILED…)
│       │   │   ├── Card.jsx
│       │   │   ├── StatCard.jsx     # dashboard KPI tile
│       │   │   ├── Button.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Spinner.jsx
│       │   │   └── EmptyState.jsx
│       │   ├── chat/
│       │   │   ├── BuyerChatWindow.jsx   # natural-language buyer input
│       │   │   ├── ChatBubble.jsx
│       │   │   └── IntentPreview.jsx     # shows parsed JSON intent
│       │   ├── negotiation/
│       │   │   ├── NegotiationThread.jsx
│       │   │   └── OfferBubble.jsx
│       │   ├── quote/
│       │   │   ├── QuoteCard.jsx
│       │   │   └── QuoteExpiryTimer.jsx
│       │   ├── approval/
│       │   │   ├── ApprovalQueue.jsx
│       │   │   └── ApprovalModal.jsx
│       │   ├── transaction/
│       │   │   ├── TransactionTable.jsx
│       │   │   ├── TransactionDetail.jsx
│       │   │   ├── StateTimeline.jsx     # visual state-machine progress
│       │   │   └── AuditTrail.jsx
│       │   ├── activity/
│       │   │   └── LiveActivityFeed.jsx  # websocket-driven scene 6/7 feed
│       │   └── charts/
│       │       ├── RevenueChart.jsx
│       │       └── ConversionChart.jsx
│       │
│       └── pages/
│           ├── LandingPage.jsx           # public pitch/hero page
│           ├── merchant/
│           │   ├── MerchantOnboarding.jsx    # Scene 1: upload catalog/policies
│           │   ├── MerchantDashboard.jsx     # Sec 25
│           │   └── MerchantAnalytics.jsx     # Sec 33/34
│           ├── buyer/
│           │   ├── BuyerConsole.jsx          # Scene 2-4: chat + negotiate
│           │   └── BuyerDashboard.jsx        # Sec 27
│           └── transactions/
│               ├── TransactionExplorer.jsx   # Sec 28
│               └── TransactionDetailPage.jsx
│
└── backend/                          # Node + Express (JavaScript) + MongoDB
    ├── package.json
    ├── .env.example
    └── src/
        ├── server.js                 # app bootstrap, socket.io attach
        ├── app.js                    # express app + middleware
        ├── config/
        │   ├── env.js
        │   ├── db.js                 # mongoose connection
        │   └── razorpay.js
        │
        ├── models/                   # Mongoose schemas
        │   ├── Merchant.model.js
        │   ├── Product.model.js
        │   ├── BuyerAgent.model.js
        │   ├── Quote.model.js
        │   ├── Reservation.model.js
        │   ├── Transaction.model.js
        │   ├── AuditLog.model.js
        │   ├── WebhookEvent.model.js
        │   ├── IdempotencyKey.model.js
        │   └── Refund.model.js
        │
        ├── routes/
        │   ├── merchant.routes.js
        │   ├── buyer.routes.js
        │   ├── product.routes.js
        │   ├── negotiation.routes.js
        │   ├── quote.routes.js
        │   ├── order.routes.js
        │   ├── payment.routes.js
        │   ├── webhook.routes.js
        │   ├── approval.routes.js
        │   ├── transaction.routes.js
        │   └── analytics.routes.js
        │
        ├── controllers/              # thin — call services only
        │   ├── merchant.controller.js
        │   ├── buyer.controller.js
        │   ├── negotiation.controller.js
        │   ├── quote.controller.js
        │   ├── payment.controller.js
        │   ├── webhook.controller.js
        │   └── approval.controller.js
        │
        ├── services/                 # business logic — NO direct LLM->DB access
        │   ├── ai/
        │   │   ├── buyerIntentAgent.js       # NL -> structured intent
        │   │   ├── merchantAgent.js          # catalog match + response gen
        │   │   ├── negotiationAgent.js       # counter-offer generation
        │   │   └── tools.js                  # tool/function definitions for Claude
        │   ├── catalog.service.js
        │   ├── negotiation.service.js
        │   ├── quote.service.js
        │   ├── reservation.service.js        # Mongo-based inventory locks + TTL
        │   ├── policyEngine.service.js        # ⭐ deterministic, no LLM
        │   ├── riskScore.service.js           # ⭐ deterministic
        │   ├── razorpay.service.js
        │   ├── idempotency.service.js         # ⭐ Mongo unique-key based
        │   ├── transactionState.service.js    # ⭐ state machine
        │   ├── webhookProcessor.service.js
        │   ├── refund.service.js
        │   └── audit.service.js
        │
        ├── policies/
        │   ├── merchantConstitution.schema.js
        │   └── buyerConstitution.schema.js
        │
        ├── stateMachine/
        │   ├── transactionStates.js   # constants + allowed transitions
        │   └── transitions.js
        │
        ├── middleware/
        │   ├── auth.middleware.js      # agent identity / JWT
        │   ├── errorHandler.js
        │   └── requestLogger.js
        │
        ├── sockets/
        │   └── liveActivity.gateway.js # emits events -> LiveActivityFeed.jsx
        │
        ├── utils/
        │   ├── logger.js
        │   └── currency.js
        │
        └── seed/
            └── seed.js                # seed demo merchant + products + policies
```

---

## 4. Design System — Tailwind Setup (Razorpay-grade polish)

Use Tailwind CSS **v3** only, no other CSS framework. This gives the "fintech-serious" look judges expect.

**`frontend/tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#3b5ee8",   // primary action blue (Razorpay-adjacent, not identical)
          600: "#2f4fd1",
          700: "#2540ab",
        },
        success: { light: "#dcfce7", DEFAULT: "#16a34a", dark: "#14532d" },
        warning: { light: "#fef9c3", DEFAULT: "#ca8a04", dark: "#713f12" },
        danger:  { light: "#fee2e2", DEFAULT: "#dc2626", dark: "#7f1d1d" },
        ink: {
          900: "#0f1729",   // headings
          700: "#334155",   // body text
          400: "#94a3b8",   // muted
        },
        surface: {
          DEFAULT: "#ffffff",
          alt: "#f8fafc",
          border: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 41, 0.04), 0 4px 12px rgba(15, 23, 41, 0.04)",
        cardHover: "0 8px 24px rgba(15, 23, 41, 0.08)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      keyframes: {
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        slideIn: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        slideIn: "slideIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
```

**Status badge color map** (use consistently across `Badge.jsx`):
- `DISCOVERED / QUOTED / NEGOTIATING` → slate/gray
- `AGREED / RESERVED / PAYMENT_PENDING` → `warning`
- `PAID / COMPLETED` → `success`
- `PAYMENT_FAILED / QUOTE_EXPIRED / POLICY_REJECTED / DISPUTED` → `danger`
- `HUMAN_APPROVAL_REQUIRED` → `brand` (blue, actionable)

**Layout conventions:**
- App shell: fixed left `Sidebar` (dark `ink-900` bg) + top `Topbar` (white, `shadow-card`) + content in `surface-alt` background.
- Cards: `bg-white rounded-2xl shadow-card border border-surface-border p-6`.
- KPI tiles (`StatCard`): big number in `text-3xl font-semibold text-ink-900`, label in `text-sm text-ink-400 uppercase tracking-wide`.
- Live Activity feed: terminal-style dark card (`bg-ink-900 text-white font-mono text-sm`) with colored status dots (`animate-pulseDot`) — this is your demo's visual centerpiece (Section 26/37).
- Use Inter font via Google Fonts link in `index.html`.
- Every page transition/list item uses `animate-slideIn` for a polished, non-jarring feel.

**`frontend/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { @apply font-sans text-ink-700; }
  h1,h2,h3 { @apply text-ink-900 font-semibold; }
}
```

---

## 5. Database Schema (MongoDB via Mongoose — core collections)

```js
// models/Merchant.model.js
const MerchantSchema = new Schema({
  name: String,
  verified: { type: Boolean, default: false },
  constitution: {
    maxDiscountPct: Number,
    minMarginPaise: Number,
    maxAiTransactionPaise: Number,
    refundApprovalThresholdPaise: Number,
    priceChangeReapprovalPct: Number,
    reservationMinutes: Number,
    internationalEnabled: { type: Boolean, default: false },
  },
}, { timestamps: true });

// models/Product.model.js
const ProductSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", index: true },
  name: String,
  priceInPaise: Number,        // store money as integer paise, never float
  inventory: Number,
  attributes: Schema.Types.Mixed,      // { color: [...], material: "mesh" }
  minPriceInPaise: Number,
  bulkDiscounts: [{ minQty: Number, discountPct: Number }],
  deliveryMinDays: Number,
  deliveryMaxDays: Number,
  warranty: String,
  returnPolicyDays: { type: Number, default: 7 },
  aiPurchasable: { type: Boolean, default: true },
}, { timestamps: true });

// models/BuyerAgent.model.js
const BuyerAgentSchema = new Schema({
  ownerOrg: String,
  constitution: {
    maxTransactionPaise: Number,
    dailySpendLimitPaise: Number,
    humanApprovalThresholdPaise: Number,
    allowedCategories: [String],
    blockedCategories: [String],
    verifiedMerchantsOnly: { type: Boolean, default: true },
  },
}, { timestamps: true });

// models/Quote.model.js
const QuoteSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  buyerId: { type: Schema.Types.ObjectId, ref: "BuyerAgent" },
  unitPriceInPaise: Number,
  quantity: Number,
  subtotalInPaise: Number,
  deliveryDays: Number,
  terms: Schema.Types.Mixed,
  status: { type: String, enum: ["ACTIVE", "EXPIRED", "ACCEPTED"], default: "ACTIVE" },
  expiresAt: Date,             // checked in app code before use
}, { timestamps: true });

// models/Reservation.model.js  — replaces Redis TTL locks
const ReservationSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // Mongo TTL index auto-deletes
}, { timestamps: true });

// models/Transaction.model.js
const TransactionSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: "BuyerAgent" },
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant" },
  quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
  amountInPaise: Number,
  state: { type: String, default: "DISCOVERED" },   // see stateMachine
  riskScore: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
  approvalRequired: { type: Boolean, default: false },
  approvedBy: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  idempotencyKey: { type: String, unique: true },
}, { timestamps: true });

// models/AuditLog.model.js
const AuditLogSchema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", index: true },
  action: String,
  reason: String,
  actor: { type: String, enum: ["BUYER_AGENT", "MERCHANT_AGENT", "POLICY_ENGINE", "HUMAN"] },
  result: String,
  timestamp: { type: Date, default: Date.now },
});

// models/WebhookEvent.model.js  — dedupe via unique eventId
const WebhookEventSchema = new Schema({
  eventId: { type: String, unique: true },   // Razorpay event id
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  type: String,
  payload: Schema.Types.Mixed,
  processedAt: Date,
}, { timestamps: true });

// models/IdempotencyKey.model.js  — replaces Redis idempotency store
const IdempotencyKeySchema = new Schema({
  key: { type: String, unique: true },
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" },
  response: Schema.Types.Mixed,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // TTL cleanup
}, { timestamps: true });

// models/Refund.model.js
const RefundSchema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  amountInPaise: Number,
  status: { type: String, enum: ["ELIGIBLE", "REQUIRES_APPROVAL", "PROCESSED", "REJECTED"] },
  reason: String,
}, { timestamps: true });
```

> **Money handling:** store every amount as an integer in paise (₹1 = 100 paise) to avoid floating-point errors — same discipline as the original Prisma version, just in Mongoose now.

---

## 6. Transaction State Machine

```
DISCOVERED → QUOTED → NEGOTIATING → AGREED → RESERVED →
PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_VERIFICATION → PAID →
FULFILLMENT → COMPLETED

Side states (reachable from multiple points):
PAYMENT_FAILED, QUOTE_EXPIRED, INVENTORY_CHANGED,
POLICY_REJECTED, HUMAN_APPROVAL_REQUIRED, REFUND_PENDING, DISPUTED
```

Implement `transitions.js` as an explicit allow-list object (`{ FROM: [ALLOWED_TO...] }`) — reject any transition not in the map. This file is the single source of truth; both backend enforcement and the frontend `StateTimeline.jsx` visual should read from equivalent constants (duplicate intentionally on the frontend, with a comment linking back to this file).

---

## 7. API Contract (backend routes)

```
POST   /api/merchants                       create + onboard merchant (catalog + policies upload)
GET    /api/merchants/:id/analytics

POST   /api/buyers                          create buyer agent + constitution
POST   /api/buyers/:id/intent                NL text -> structured intent (AI)

GET    /api/products/search                 discovery, filtered by intent

POST   /api/negotiations                    start negotiation thread
POST   /api/negotiations/:id/offer           buyer/merchant counter-offer

POST   /api/quotes                          generate quote from agreed terms
GET    /api/quotes/:id                      check status (handles expiry)

POST   /api/reservations                    reserve inventory (Mongo TTL doc)

POST   /api/orders                          create internal order + Razorpay order
POST   /api/payments/initiate               idempotent payment kick-off
GET    /api/payments/:txnId/status          poll/reconcile status

POST   /api/webhooks/razorpay                signature-verified event intake

POST   /api/approvals/:txnId/approve
POST   /api/approvals/:txnId/reject
GET    /api/approvals/pending

GET    /api/transactions
GET    /api/transactions/:id
GET    /api/transactions/:id/audit-trail

POST   /api/refunds
POST   /api/refunds/:id/approve

WS     /socket.io                            live activity feed events:
                                              agent.thinking | agent.action |
                                              policy.check | payment.event |
                                              transaction.state_changed
```

---

## 8. Policy Engine — Non-negotiable Rule

**The LLM never touches money directly.** Every AI-proposed action (`purchase`, `discount`, `refund`) is a plain object passed through `policyEngine.service.js`, which is pure deterministic JavaScript (no LLM call) checking:

```js
// input shape
// { action: "purchase" | "discount" | "refund", amountInPaise, buyerConstitution, merchantConstitution }

// output shape
// { authorized: boolean, requiresHumanApproval: boolean, reasons: string[] }
```

This function is the one piece of code you should unit-test most heavily — it's also your best answer when judges ask "what stops the AI from doing something dangerous?"

---

## 9. Idempotency & Reservations — Without Redis or Docker

Since there's no Redis/Docker, MongoDB does both jobs using its **TTL indexes** (auto-expiring documents) and **unique index constraints** (atomic dedupe):

- **Idempotency:** `IdempotencyKey` collection has a unique index on `key`. Before initiating a payment, `idempotency.service.js` tries to insert `{ key, status: "IN_PROGRESS" }`. If the insert throws a duplicate-key error, another/earlier attempt already owns this operation — return its stored result instead of retrying Razorpay. `expiresAt` with an `expireAfterSeconds: 0` TTL index auto-cleans stale keys.
- **Inventory reservation:** `Reservation` collection with a TTL index on `expiresAt` — when a buyer reserves stock, insert a reservation doc; Mongo automatically deletes it when it expires (mirrors the old Redis-TTL lock behavior). Available inventory = `product.inventory − sum(active reservations for that product)`, computed on read.
- **Webhook dedupe:** unique index on `WebhookEvent.eventId` — a duplicate webhook delivery fails the insert and is safely ignored.
- **Concurrency safety:** use MongoDB's atomic `findOneAndUpdate` with conditions (e.g. `{ inventory: { $gte: qty } }`) for stock decrements instead of application-level locking — this avoids needing Redis distributed locks entirely.

This keeps local dev to **just `node` + a MongoDB connection string** (local `mongod` or a free MongoDB Atlas cluster) — nothing to containerize.

---

## 10. Build Order (phased, for your AI assistant to follow)

**Phase 0 — Scaffolding**
1. Init monorepo, `frontend/` (Vite+React+JS+Tailwind) and `backend/` (Express+JS+Mongoose).
2. `.env` files for both. Connect backend to MongoDB (local `mongod` or Atlas connection string) — no containers needed.
3. Mongoose models + seed script (1 demo merchant, ~10 products, 1 buyer agent with constitution).

**Phase 1 — Core data + catalog**
4. Merchant/product/buyer CRUD + AI-readable catalog endpoints.
5. Frontend: Merchant onboarding page, product list.

**Phase 2 — AI agents (read-only first)**
6. Buyer intent parser (NL → JSON) using Groq tool calling.
7. Merchant agent product matching.
8. Frontend: Buyer chat console with intent preview.

**Phase 3 — Negotiation + Quotes**
9. Negotiation service + agent, quote generation with expiry (Mongo `expiresAt` field, checked on read).
10. Frontend: negotiation thread, quote card with countdown timer.

**Phase 4 — Policy Engine + Approval**
11. Deterministic policy engine, risk score, human approval gateway.
12. Frontend: approval queue + modal.

**Phase 5 — Payments (Razorpay test mode)**
13. Order creation, payment initiation, idempotency service (Mongo unique-key pattern), webhook route + signature verification + processor.
14. Transaction state machine wired to all of the above.
15. Frontend: payment flow UI + live state timeline.

**Phase 6 — Observability**
16. Audit logging on every service action. WebSocket live activity gateway.
17. Frontend: Live Activity Feed, Transaction Explorer, Audit Trail view.

**Phase 7 — Dashboards & polish**
18. Merchant dashboard, buyer dashboard, analytics charts.
19. Full Tailwind pass for visual polish — this is what judges see first.

**Phase 8 — Stretch (P1)**
20. Refund agent, dispute stub, revenue intelligence insights, upselling.

Do not proceed to the next phase until the current one runs end-to-end locally.

---

## 11. Environment Variables

**backend/.env.example**
```
MONGODB_URI=mongodb://localhost:27017/agentpay
# or a free Atlas cluster: mongodb+srv://<user>:<pass>@cluster.mongodb.net/agentpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
GROQ_API_KEY=xxxxx
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=xxxxx
PORT=4000
```

**frontend/.env.example**
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 12. Demo Script Mapping (what the UI must support)

| Scene | Screen needed |
|---|---|
| 1. Merchant onboarding | `MerchantOnboarding.jsx` — CSV/JSON upload |
| 2. Buyer intent | `BuyerConsole.jsx` chat + `IntentPreview.jsx` |
| 3. Search/match | product results in console |
| 4. Negotiation | `NegotiationThread.jsx` |
| 5. Policy + human approval | `ApprovalModal.jsx` |
| 6. Razorpay + timeout recovery | payment flow + `LiveActivityFeed.jsx` |
| 7. Audit trail | `AuditTrail.jsx` / `TransactionDetail.jsx` |

Rehearse exactly this path once the MVP is done — don't demo anything outside it live.

---

## 13. One-liners for judge Q&A (keep handy)

- **vs ChatGPT Shopping:** "We're merchant-side infrastructure for agent-to-agent transactions, not a shopping recommender."
- **vs a payment gateway:** "A gateway moves money after a decision is made. AgentPay governs discovery, negotiation, policy, and recovery — before, during, and after payment."
- **What's actually AI vs deterministic:** AI = intent parsing, matching, negotiation language, explanations. Deterministic = money, policy, limits, state transitions, idempotency, audit.
- **Why no Redis/Docker:** MongoDB's TTL indexes and unique-index constraints cover idempotency, reservation expiry, and webhook dedupe natively — one fewer moving part to explain or debug live during judging.
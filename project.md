# AgentPay
### The Trust & Transaction Layer for AI-Native Commerce

**Track 01 — AI Growth & Agentic Commerce | Razorpay Hackathon**

> This is the master project doc. Give it to your AI coding assistant first — it explains *what* AgentPay is and *why*, then points to the other three docs for *how* to build it.

---

## 1. The One-Line Pitch

AgentPay makes merchants safely transactable by autonomous AI buyers — through machine-readable commerce, agent negotiation, financial guardrails, Razorpay payments, and autonomous transaction recovery.

---

## 2. The Problem

Merchant infrastructure today is built for humans clicking through `Website → Product → Cart → Checkout → Payment`. But AI agents don't want to browse — they want to say:

> "Find me 20 business laptops under ₹18 lakh, with 3-year warranty, delivery within 7 days, and buy them if the total price is acceptable."

For that to work reliably, five things have to exist that don't today:

1. **Machine-readable capability** — a website saying "free shipping above ₹999" is useless to an AI; it needs structured data.
2. **Permission boundaries** — no AI agent should be able to decide to spend ₹4 lakh instead of ₹40,000.
3. **Real negotiation** — merchants have margins, bulk discounts, and inventory constraints an AI has to work within, not around.
4. **Stateful payments** — an API timeout doesn't mean a payment failed; blind retries cause duplicate charges.
5. **Mutual trust** — two autonomous agents need to establish identity, spending authority, agreed price, and who's accountable if something goes wrong.

---

## 3. The Solution

AgentPay is a **Commerce Trust Layer** that sits between AI buyer agents, AI merchant agents, and Razorpay:

```
AI BUYER → AgentPay Commerce Layer → [Discovery | Negotiation | Policies] → Transaction Engine → Razorpay → Webhooks → Verification → Audit Ledger
```

The core architectural bet: **the LLM proposes, it never decides.** Every AI-suggested action (a discount, a purchase, a refund) passes through a deterministic policy engine — plain code, fully testable, with zero LLM involvement — before any money moves.

| AI handles | Deterministic code handles |
|---|---|
| Natural-language intent parsing | Money |
| Product matching | Permissions & spending limits |
| Negotiation language | Policy enforcement |
| Response generation | Payment execution |
| Recovery/exception explanation | State transitions & idempotency |
| Dispute summarization | Audit logging |

---

## 4. What It Does, End to End

**Discover → Understand → Compare → Negotiate → Quote → Reserve → Purchase → Pay → Track → Refund/Resolve**

- A **buyer agent** turns natural language ("50 ergonomic chairs, black, under ₹7,500 each") into structured intent and searches AI-readable merchant catalogs.
- A **merchant agent** represents a merchant's products, pricing, margins, and policies, and can negotiate within them.
- Negotiated terms become an **immutable, time-limited quote** — if it expires, the buyer must re-negotiate, not assume the old price still holds.
- Every merchant has a **Merchant Constitution** (max discount, min margin, max AI transaction size, refund approval thresholds) and every buyer has a **Buyer Constitution** (spending limits, allowed categories, approval thresholds) — both are hard rules the LLM cannot override.
- Transactions above a threshold go through a **Human Approval Gateway** with graduated autonomy tiers (auto-approve small, confirm mid-size, require human sign-off above that).
- Payment runs through **Razorpay Test Mode**, with an explicit **transaction state machine** (`DISCOVERED → QUOTED → NEGOTIATING → AGREED → RESERVED → PAYMENT_PENDING → ... → COMPLETED`) and failure states handled explicitly, not swallowed.
- **Idempotency** is a first-class concern: a payment timeout triggers a state check and a wait for the webhook — never a blind retry, so duplicate payments are structurally impossible.
- Every action anywhere in the system writes to a **full audit trail** with a plain-English reason, visible in the UI — not hidden chain-of-thought, a real decision log.

---

## 5. Why This Vertical

The demo uses **B2B office/electronics procurement** (laptops, monitors, keyboards, chairs, docking stations) because it naturally produces bulk pricing, negotiation, delivery terms, and large-enough transactions to exercise the approval gateway — a ₹299 T-shirt purchase wouldn't demonstrate any of that.

---

## 6. What Makes This Different

**vs. ChatGPT Shopping / AI shopping assistants:**
"We're not building an AI that recommends products to a human. We're building the merchant-side infrastructure that lets autonomous AI agents safely transact with merchants directly — discovery, negotiation, policy, payment, and recovery, end to end."

**vs. a normal payment gateway:**
"A payment gateway moves money after a purchase decision has already been made by a human. AgentPay governs the entire machine-to-machine commercial interaction — before, during, and after payment."

---

## 7. Scope for This Build

**Building (P0 — MVP):** AI buyer/merchant agents, AI-readable catalog, discovery, negotiation, both constitutions/policy engine, quote generation + expiry, Razorpay order/payment, webhook verification, transaction state machine, audit trail, human approval gateway, payment-timeout recovery, live dashboard.

**Stretch, only if time remains (P1):** inventory reservation, refund agent, AI upselling, revenue analytics, agent identity, risk scoring.

**Explicitly not building:** blockchain, custom ML models, microservices, a custom payment gateway, a multi-category marketplace, voice interfaces. The judges care about working depth on the core loop, not feature count.

---

## 8. Tech Stack Summary

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + JavaScript + **Tailwind CSS** |
| Backend | Node.js + Express (JavaScript) |
| Database | MongoDB + Mongoose |
| AI | Groq (Llama 3.3 70B) via `groq-sdk`, tool/function calling |
| Payments | Razorpay Node SDK (Test Mode) |
| Realtime | Socket.IO (Live Activity Feed) |
| Idempotency / reservations / dedupe | MongoDB TTL + unique indexes — no Redis, no Docker |

Full detail in `AgentPay_Build_Plan.md`.

---

## 9. The Demo Story (5 minutes, one arc — not a feature tour)

| Scene | What happens |
|---|---|
| 1. Merchant onboarding | Merchant uploads catalog + policies → becomes "AI-Ready" |
| 2. Buyer intent | Type: "50 office chairs, black, ergonomic, under ₹4 lakh, delivery within 10 days" |
| 3. Search & match | Merchant agent finds a match that's over budget |
| 4. Negotiation | Buyer counters, merchant checks its minimum, counter-offers a bundled term (price + delivery + payment terms) that works for both sides |
| 5. Policy & approval | Transaction exceeds the human-approval threshold → approval requested → approved |
| 6. Payment + recovery (**the hero moment**) | Razorpay order created, payment initiated, a timeout is simulated — system does **not** retry, checks state, webhook arrives, payment confirmed captured, duplicate prevented |
| 7. Audit trail | Full "why did the agent do this" log shown: policy checks passed, price negotiated, approval obtained, payment verified, retry prevented |

Rehearse exactly this path. Don't demo anything outside it live.

---

## 10. Where Everything Else Lives

This project has four docs — read them in this order:

1. **`project.md`** *(this file)* — what AgentPay is, why it matters, the demo story
2. **`AgentPay_Build_Plan.md`** — folder structure, tech stack, database schema, API contract, phased build order
3. **`AgentPay_Setup_Guide.md`** — exact terminal commands to scaffold and run both servers
4. **`design.md`** — colors, typography, component specs, and page-by-page UI layout (Tailwind only)

Give an AI coding assistant all four and say: *"Read project.md for context, then follow AgentPay_Build_Plan.md Section 10 phase by phase, using design.md for every UI component."*

---

## 11. Judge Q&A Cheat Sheet

- **"Isn't this just a chatbot with extra steps?"** — No: the chatbot only produces a *proposal*. A separate, deterministic policy engine (no LLM) is the only thing authorized to approve money movement, and it's fully unit-testable independent of the AI.
- **"What stops the AI from doing something dangerous?"** — The Merchant Constitution and Buyer Constitution are hard-coded rule sets the LLM cannot override, enforced by plain JavaScript, with a human-approval gateway above a threshold.
- **"What happens if a payment call times out?"** — It never retries blindly. It checks local transaction state, then Razorpay's order status, then waits on the webhook — dedup'd by a unique event ID — before deciding anything happened.
- **"Why no Redis/Docker?"** — MongoDB's TTL indexes and unique-index constraints natively cover idempotency, reservation expiry, and webhook dedupe — one fewer moving part to explain or debug live during judging.
# EscrowAI — Design.md
### Visual & UX Design Specification

> Give this to your AI coding assistant alongside `EscrowAI_Build_Plan.md`. This file is the single source of truth for how every screen and component should look — colors, type, spacing, component anatomy, and page-by-page layout. Strictly Tailwind CSS; no inline styles, no other CSS frameworks.

---

## 1. Design Principles

1. **Fintech-serious, not toy-demo.** This is infrastructure that moves real money — the UI should read like a payments dashboard (Stripe/Razorpay-grade), not a chatbot playground.
2. **State is always visible.** Every transaction, quote, and approval shows its exact status at a glance — color-coded badges, never ambiguous text.
3. **Show the machine thinking.** The Live Activity Feed and Audit Trail are the emotional core of the demo — they make invisible AI decisions visible and trustworthy.
4. **Calm, generous whitespace.** Dense financial data needs air around it. Prefer fewer things per screen, laid out clearly, over cramming.
5. **One accent color, used sparingly.** Brand blue is reserved for primary actions and key status — never used decoratively.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `brand-50` | `#eef2ff` | subtle blue backgrounds (selected rows, info banners) |
| `brand-100` | `#e0e7ff` | hover states on light surfaces |
| `brand-500` | `#3b5ee8` | primary buttons, links, active nav item |
| `brand-600` | `#2f4fd1` | primary button hover |
| `brand-700` | `#2540ab` | primary button active/pressed |
| `success` | `#16a34a` | PAID, COMPLETED, approved states |
| `success-light` | `#dcfce7` | success badge background |
| `warning` | `#ca8a04` | PENDING, RESERVED, in-progress states |
| `warning-light` | `#fef9c3` | warning badge background |
| `danger` | `#dc2626` | FAILED, EXPIRED, REJECTED, DISPUTED states |
| `danger-light` | `#fee2e2` | danger badge background |
| `ink-900` | `#0f1729` | headings, primary text, sidebar background |
| `ink-700` | `#334155` | body text |
| `ink-400` | `#94a3b8` | muted/secondary text, placeholders |
| `surface` | `#ffffff` | card backgrounds |
| `surface-alt` | `#f8fafc` | page background |
| `surface-border` | `#e2e8f0` | card borders, dividers |

Never introduce new colors outside this palette without a clear reason (e.g. a chart needing a categorical series — pull from Tailwind's `slate`/`indigo`/`teal` scales at matching lightness, don't invent hex values).

### 2.2 Typography

- **Font:** Inter (UI text), JetBrains Mono (IDs, JSON payloads, code, transaction hashes, the Live Activity Feed).
- **Scale:**
  | Use | Classes |
  |---|---|
  | Page title | `text-2xl font-semibold text-ink-900` |
  | Section heading | `text-lg font-semibold text-ink-900` |
  | Card title | `text-base font-medium text-ink-900` |
  | Body | `text-sm text-ink-700` |
  | Muted / label | `text-xs text-ink-400 uppercase tracking-wide` |
  | KPI number | `text-3xl font-semibold text-ink-900` |
  | Monospace (IDs, JSON, feed) | `font-mono text-sm` |

### 2.3 Spacing & Radius

- Page padding: `px-8 py-6`
- Card padding: `p-6` (compact cards `p-4`)
- Gap between cards in a grid: `gap-6`
- Card corners: `rounded-2xl`
- Buttons/inputs/badges: `rounded-lg`
- Card border: `border border-surface-border`
- Card shadow: `shadow-card`, hover elevates to `shadow-cardHover`

### 2.4 Motion

- Page/list item entrance: `animate-slideIn` (fade + 4px rise, 200ms ease-out)
- Live status dots: `animate-pulseDot` (1.4s opacity pulse) — used for "in progress" indicators
- Transitions on interactive elements: `transition-colors duration-150`
- Modals: fade + scale-up backdrop (`transition-opacity`, `scale-95 → scale-100`)
- Never animate more than what's needed to draw attention to a state change — no bouncing, no excessive easing.

---

## 3. Core Components

### 3.1 Badge (status pill)
Rounded-full, small, bold text, colored per state:
```
DISCOVERED / QUOTED / NEGOTIATING   → bg-slate-100 text-slate-600
AGREED / RESERVED / PAYMENT_PENDING → bg-warning-light text-warning-dark
PAID / COMPLETED                    → bg-success-light text-success-dark
PAYMENT_FAILED / QUOTE_EXPIRED /
POLICY_REJECTED / DISPUTED          → bg-danger-light text-danger-dark
HUMAN_APPROVAL_REQUIRED             → bg-brand-50 text-brand-700
```
Classes: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium`

### 3.2 Card
`bg-white rounded-2xl shadow-card border border-surface-border p-6`
Optional hover (for clickable cards, e.g. transaction rows-as-cards): add `hover:shadow-cardHover transition-shadow cursor-pointer`

### 3.3 StatCard (KPI tile)
Layout: label on top (muted, uppercase), big number below, optional trend delta (green/red small text with ↑/↓) bottom-right.
```
[ AI TRANSACTIONS        ]
[ 428              ↑ 12% ]
```

### 3.4 Button
- Primary: `bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg`
- Secondary: `bg-white border border-surface-border text-ink-700 hover:bg-surface-alt px-4 py-2 rounded-lg`
- Danger: `bg-danger hover:bg-danger-dark text-white px-4 py-2 rounded-lg`
- Ghost/text: `text-brand-600 hover:text-brand-700 font-medium`
- Disabled: `opacity-50 cursor-not-allowed`

### 3.5 Modal
Centered, `max-w-lg`, backdrop `bg-ink-900/40 backdrop-blur-sm`, panel `bg-white rounded-2xl shadow-cardHover p-6`. Always includes a clear title, close (×) top-right, and primary/secondary action buttons bottom-right.

### 3.6 Table (Transaction/Approval lists)
- Header row: `bg-surface-alt text-xs uppercase text-ink-400 font-medium` sticky if long.
- Rows: `border-b border-surface-border hover:bg-surface-alt/60 transition-colors`
- Amounts: right-aligned, `font-mono`, formatted as `₹X,XX,XXX` (Indian digit grouping).
- Status column always uses the Badge component — never plain colored text.

### 3.7 Live Activity Feed (the demo centerpiece)
Terminal-style card: `bg-ink-900 text-white font-mono text-sm rounded-2xl p-6 overflow-y-auto`
Each line: timestamp (dim gray) + colored status dot (`animate-pulseDot` while in-progress, solid once resolved) + actor label + message.
```
🟢 13:40:04  MERCHANT_AGENT   Generated quote Q82391
🟡 13:40:11  BUYER_AGENT      Negotiating — requested 12% discount
🟢 13:40:15  POLICY_ENGINE    Approved: within 10% discount limit
🔴 13:40:31  RAZORPAY         ⚠ Payment response timeout — not retrying
🟢 13:40:39  WEBHOOK          Payment captured — duplicate prevented
```
Dot colors: 🟢 success, 🟡 warning/in-progress, 🔴 danger/attention, 🔵 (`brand`) human-approval-needed.

### 3.8 State Timeline (transaction detail)
Horizontal (desktop) or vertical (mobile) stepper showing the state machine from `DISCOVERED → COMPLETED`, with completed steps in `success`, current step in `brand` with a pulsing ring, future steps in `ink-400`/gray, and failure branches shown as a red side-branch off the step where they occurred (not inline in the happy path).

### 3.9 Quote Card
Prominent card with a **countdown timer** (`QuoteExpiryTimer`) top-right in `font-mono`, turning `warning` under 2 minutes and `danger` under 30 seconds remaining. Price, quantity, delivery terms laid out as a clean label/value list, not prose.

### 3.10 Chat Interface (Buyer Console)
- Buyer messages: right-aligned, `bg-brand-500 text-white rounded-2xl rounded-br-sm px-4 py-2`
- Agent/system messages: left-aligned, `bg-surface-alt text-ink-700 rounded-2xl rounded-bl-sm px-4 py-2`
- Parsed intent preview: a collapsible monospace JSON block below the relevant message, `bg-ink-900 text-success text-xs rounded-lg p-3` (terminal-style JSON), collapsed by default with a "View parsed intent" toggle.

---

## 4. Layout Shell

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (w-64, bg-ink-900, text-white)  │  Topbar     │
│  - Logo                                  │  (h-16,     │
│  - Nav: Dashboard, Buyer Console,        │  bg-white,  │
│    Merchant, Transactions, Approvals,    │  shadow-card)│
│    Analytics                             │             │
│  - Active item: bg-white/10, brand-500   │  breadcrumb │
│    left border accent                    │  + user     │
├───────────────────────────────────────────────────────┤
│                                                         │
│   Content area — bg-surface-alt, px-8 py-6             │
│                                                         │
└─────────────────────────────────────────────────────┘
```
Sidebar is fixed/persistent on desktop; collapses to a hamburger-triggered drawer under `md` breakpoint.

---

## 5. Page-by-Page Design

### 5.1 Landing Page (public)
Hero section, dark `ink-900` background, big headline (`text-4xl md:text-5xl font-semibold text-white`), one-line pitch, two CTAs ("Try Buyer Console" primary, "Merchant Onboarding" secondary). Below: 3-column feature grid (Discovery, Policy Engine, Payments) using icon + short copy cards on white. Keep it to one scroll's worth of content — this isn't the demo, it's the framing before it.

### 5.2 Merchant Onboarding
Step-based (use `step_card`-style stepper, 3 steps): 1) Merchant info + constitution form (max discount %, max AI transaction ₹, approval thresholds — as labeled number inputs, not free text), 2) Catalog upload (drag-and-drop CSV/JSON card, `border-dashed border-2 border-surface-border rounded-2xl`), 3) Review & confirm (summary card). Progress indicator at top.

### 5.3 Buyer Console
Two-column layout: left ~60% chat interface (Section 3.10), right ~40% a live "Matching Products" panel that populates as the agent searches, then transitions into the `NegotiationThread` once a product is selected, then a `QuoteCard` once terms are agreed. This right panel is essentially a live status sidebar that evolves through the scene.

### 5.4 Merchant Dashboard
Top row: 4 `StatCard`s (Revenue, AI Transactions, Conversion, Avg Order Value). Below, two columns: left = `ApprovalQueue` (list of pending approvals needing action, each row clickable → `ApprovalModal`), right = `RevenueChart` (line chart, brand-500 stroke, subtle area fill `brand-50`). Bottom: recent transactions table.

### 5.5 Buyer Dashboard
`StatCard` row (Budget remaining, Today's purchases, Pending approvals). Below: recent transactions as a card list (not table) — each card shows product, amount, badge, and date, `hover:shadow-cardHover`.

### 5.6 Transaction Explorer
Full-width table (Section 3.6) with filters top-right (status dropdown, date range, search by ID) styled as small pill buttons. Row click → `TransactionDetailPage`.

### 5.7 Transaction Detail
Header: Transaction ID (`font-mono text-ink-400`), amount (large), current status badge. Below: `StateTimeline` (Section 3.8) full-width. Then two columns: left = key-value summary (buyer, merchant, quote ref, risk score, Razorpay order/payment IDs), right = `AuditTrail` — a vertical timeline of audit log entries, each with timestamp, actor badge, action, and reason, styled like a changelog (thin vertical connecting line, dot per entry, dot color = actor: buyer=brand, merchant=slate, policy=warning, human=success).

### 5.8 Approval Queue / Modal
Queue: list of cards, each showing amount (large, bold), buyer/merchant names, reason it needs approval (e.g. "Exceeds ₹2,50,000 auto-approval threshold"), and Approve/Reject buttons inline. Modal (on click for more detail): full transaction summary + the same buttons, used when the person wants context before deciding.

### 5.9 Analytics
Two charts side by side (`RevenueChart` line, `ConversionChart` bar or funnel), followed by a "Revenue Intelligence" insights list — plain cards with a lightbulb-style icon and one-sentence insight text (e.g. "AI buyers abandon 31% more often when delivery exceeds 7 days"), matching Section 34 of the build plan.

---

## 6. Responsive Behavior

- Breakpoint strategy: design for desktop first (this is a hackathon dashboard, judges will view it on a laptop/projector), but ensure the layout doesn't break under `md` (768px) — sidebar collapses, KPI grids go to 2-column then 1-column, tables become horizontally scrollable (`overflow-x-auto`) rather than reflowing into cards.
- Minimum supported width for the demo: 1280px (don't spend time on mobile polish — not worth hackathon hours here).

---

## 7. Iconography

Use **lucide-react** for all icons (consistent stroke width, matches the clean fintech aesthetic). Standard size `w-4 h-4` inline with text, `w-5 h-5` in buttons/nav, `w-6 h-6` for empty-state illustrations. Never mix icon sets.

---

## 8. What to Avoid

- No gradients except the landing page hero background (subtle `ink-900` → `brand-700` diagonal, used once).
- No drop shadows heavier than `shadow-cardHover` — keep it flat and modern, not skeuomorphic.
- No more than one primary-colored button visible per view at a time — everything else is secondary/ghost.
- No raw JSON dumped in the main UI outside the intentional "parsed intent" and audit-trail technical views — those are the only places rawness is a feature, not a bug.
- No lorem ipsum in the final demo build — seed data should look like real B2B procurement (real-sounding company names, realistic ₹ prices).
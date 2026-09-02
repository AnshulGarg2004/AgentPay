import { useState, useEffect } from "react";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { api } from "../../lib/api.js";
import { formatRupee, formatNumber } from "../../lib/format.js";

const DEFAULT_SAMPLE_CATALOG = [
  {
    name: "Ergonomic Mesh Task Chair",
    price: 7500,
    minPrice: 6500,
    inventory: 100,
    category: "chairs",
    warranty: "3 years manufacturer warranty",
    deliveryMinDays: 2,
    deliveryMaxDays: 5,
  },
  {
    name: "UltraWide 34\" Curved Productivity Monitor",
    price: 34999,
    minPrice: 31000,
    inventory: 40,
    category: "monitors",
    warranty: "3 years onsite replacement",
    deliveryMinDays: 2,
    deliveryMaxDays: 4,
  },
  {
    name: "Business Pro Laptop i7 16GB 512GB",
    price: 72000,
    minPrice: 65000,
    inventory: 25,
    category: "laptops",
    warranty: "3 years ADP protection",
    deliveryMinDays: 3,
    deliveryMaxDays: 6,
  },
  {
    name: "Wireless Mechanical Keyboard",
    price: 4500,
    minPrice: 3800,
    inventory: 150,
    category: "keyboards",
    warranty: "1 year replacement",
    deliveryMinDays: 1,
    deliveryMaxDays: 3,
  },
];

export default function MerchantOnboarding() {
  const [step, setStep] = useState(1);

  // Form State
  const [merchantName, setMerchantName] = useState("TechCraft Office Solutions");
  const [maxDiscountPct, setMaxDiscountPct] = useState(15);
  const [minMarginRupees, setMinMarginRupees] = useState(500);
  const [maxAiTxRupees, setMaxAiTxRupees] = useState(500000);
  const [refundThresholdRupees, setRefundThresholdRupees] = useState(50000);
  const [reapprovalPct, setReapprovalPct] = useState(5);
  const [reservationMinutes, setReservationMinutes] = useState(15);

  // Catalog state
  const [catalogItems, setCatalogItems] = useState(DEFAULT_SAMPLE_CATALOG);
  const [jsonInput, setJsonInput] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Submitting / Active Merchant state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMerchant, setCreatedMerchant] = useState(null);
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [existingMerchants, setExistingMerchants] = useState([]);

  // Fetch existing merchants & products on mount
  useEffect(() => {
    fetchMerchants();
  }, []);

  async function fetchMerchants() {
    try {
      const res = await api.get("/merchants");
      setExistingMerchants(res.data || []);
      if (res.data && res.data.length > 0) {
        loadMerchantProducts(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching merchants:", err);
    }
  }

  async function loadMerchantProducts(merchantId) {
    try {
      const res = await api.get(`/merchants/${merchantId}/products`);
      setMerchantProducts(res.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const items = Array.isArray(parsed) ? parsed : parsed.products || [];
        if (items.length === 0) {
          setUploadError("Uploaded JSON contains no product array.");
          return;
        }
        setCatalogItems(items);
        setUploadError("");
      } catch (err) {
        setUploadError("Invalid JSON file format: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handlePasteJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : parsed.products || [];
      if (items.length === 0) {
        setUploadError("Pasted JSON contains no product array.");
        return;
      }
      setCatalogItems(items);
      setUploadError("");
      setJsonInput("");
    } catch (err) {
      setUploadError("Invalid JSON format: " + err.message);
    }
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    try {
      // 1. Create Merchant
      const merchantPayload = {
        name: merchantName,
        verified: true,
        constitution: {
          maxDiscountPct: Number(maxDiscountPct),
          minMarginPaise: Math.round(Number(minMarginRupees) * 100),
          maxAiTransactionPaise: Math.round(Number(maxAiTxRupees) * 100),
          refundApprovalThresholdPaise: Math.round(Number(refundThresholdRupees) * 100),
          priceChangeReapprovalPct: Number(reapprovalPct),
          reservationMinutes: Number(reservationMinutes),
          internationalEnabled: false,
        },
      };

      const merchantRes = await api.post("/merchants", merchantPayload);
      const newMerchant = merchantRes.data;

      // 2. Upload Catalog
      const productsPayload = catalogItems.map((item) => ({
        name: item.name,
        priceInPaise: item.priceInPaise || Math.round(Number(item.price || 0) * 100),
        minPriceInPaise: item.minPriceInPaise || Math.round(Number(item.minPrice || item.price || 0) * 100),
        inventory: Number(item.inventory || 0),
        attributes: {
          category: item.category || "general",
          ...item.attributes,
        },
        deliveryMinDays: item.deliveryMinDays || 2,
        deliveryMaxDays: item.deliveryMaxDays || 5,
        warranty: item.warranty || "1 year standard",
      }));

      await api.post(`/merchants/${newMerchant._id}/products`, productsPayload);

      setCreatedMerchant(newMerchant);
      await fetchMerchants();
      await loadMerchantProducts(newMerchant._id);
      setStep(4); // Success step
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      alert("Failed to complete onboarding: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slideIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Merchant Onboarding</h1>
        <p className="text-sm text-ink-400 mt-1">
          Configure your merchant constitution rules & upload AI-readable catalog products.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-4">
        <div className="grid grid-cols-3 gap-4">
          {[
            { num: 1, title: "1. Constitution & Limits" },
            { num: 2, title: "2. Catalog Upload" },
            { num: 3, title: "3. Review & Deploy" },
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-brand-50 border border-brand-500/20 text-brand-700 font-semibold"
                    : isDone
                    ? "text-success font-medium"
                    : "text-ink-400"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : isDone
                      ? "bg-success text-white"
                      : "bg-surface-border text-ink-400"
                  }`}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <span className="text-sm">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: CONSTITUTION & LIMITS */}
      {step === 1 && (
        <Card className="space-y-6">
          <h2 className="text-lg font-semibold text-ink-900 border-b border-surface-border pb-3">
            Step 1: Merchant Information & Autonomous Policy Constitution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Merchant Business Name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                placeholder="e.g. TechCraft Office Solutions"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Max AI Discount Allowed (%)
              </label>
              <input
                type="number"
                value={maxDiscountPct}
                onChange={(e) => setMaxDiscountPct(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <p className="text-xs text-ink-400 mt-1">AI agent cannot offer discounts beyond this percentage.</p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Minimum Profit Margin (₹)
              </label>
              <input
                type="number"
                value={minMarginRupees}
                onChange={(e) => setMinMarginRupees(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <p className="text-xs text-ink-400 mt-1">Hard floor margin retained on negotiated quotes.</p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Max Autonomous Transaction Limit (₹)
              </label>
              <input
                type="number"
                value={maxAiTxRupees}
                onChange={(e) => setMaxAiTxRupees(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <p className="text-xs text-ink-400 mt-1">Transactions above this require human merchant sign-off.</p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Refund Human Approval Threshold (₹)
              </label>
              <input
                type="number"
                value={refundThresholdRupees}
                onChange={(e) => setRefundThresholdRupees(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700 mb-1">
                Inventory Reservation Time (Minutes)
              </label>
              <input
                type="number"
                value={reservationMinutes}
                onChange={(e) => setReservationMinutes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-surface-border">
            <Button variant="primary" onClick={() => setStep(2)}>
              Next: Upload Catalog →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: CATALOG UPLOAD */}
      {step === 2 && (
        <Card className="space-y-6">
          <h2 className="text-lg font-semibold text-ink-900 border-b border-surface-border pb-3">
            Step 2: AI-Readable Product Catalog Upload
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload Box */}
            <div className="border-dashed border-2 border-surface-border rounded-2xl p-6 text-center flex flex-col items-center justify-center bg-surface-alt/50">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center font-bold text-xl mb-3">
                📦
              </div>
              <p className="text-sm font-medium text-ink-900 mb-1">Upload Product Catalog (JSON)</p>
              <p className="text-xs text-ink-400 mb-4">Drag and drop or choose file from your computer</p>
              <label className="cursor-pointer">
                <span className="px-4 py-2 bg-white border border-surface-border rounded-lg text-xs font-medium text-ink-700 shadow-sm hover:bg-surface-alt inline-block">
                  Choose JSON File
                </span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Manual JSON Paste */}
            <div className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-ink-700">
                Or Paste JSON Catalog Data
              </label>
              <textarea
                rows={5}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"name": "Office Desk", "price": 12000, "minPrice": 10500, "inventory": 30, "category": "furniture"}]'
                className="w-full p-3 rounded-lg border border-surface-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={handlePasteJson}>
                  Parse JSON Text
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCatalogItems(DEFAULT_SAMPLE_CATALOG)}>
                  Reset to Sample B2B Catalog
                </Button>
              </div>
            </div>
          </div>

          {uploadError && <div className="p-3 bg-danger-light text-danger-dark text-xs rounded-lg">{uploadError}</div>}

          {/* Catalog Preview List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-ink-900">
                Catalog Preview ({catalogItems.length} items ready)
              </h3>
              <Badge status="VERIFIED">Structured for AI Discovery</Badge>
            </div>

            <div className="overflow-x-auto border border-surface-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt text-ink-400 uppercase font-medium border-b border-surface-border">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Base Price (₹)</th>
                    <th className="p-3 text-right">Floor Price (₹)</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3">Warranty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-sans text-ink-700">
                  {catalogItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-alt/50">
                      <td className="p-3 font-medium text-ink-900">{item.name}</td>
                      <td className="p-3 uppercase text-[10px] tracking-wide text-ink-400 font-mono">
                        {item.category || item.attributes?.category || "B2B"}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-ink-900">
                        {formatRupee(item.priceInPaise || item.price * 100)}
                      </td>
                      <td className="p-3 text-right font-mono text-ink-400">
                        {formatRupee(item.minPriceInPaise || (item.minPrice || item.price) * 100)}
                      </td>
                      <td className="p-3 text-right font-mono">{formatNumber(item.inventory)} units</td>
                      <td className="p-3 text-ink-400">{item.warranty || "1 year standard"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-surface-border">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Next: Review & Confirm →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: REVIEW & DEPLOY */}
      {step === 3 && (
        <Card className="space-y-6">
          <h2 className="text-lg font-semibold text-ink-900 border-b border-surface-border pb-3">
            Step 3: Review Constitution & Activate AI Merchant Agent
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-alt p-5 rounded-xl border border-surface-border space-y-3">
              <h3 className="text-sm font-semibold text-ink-900">Merchant Identity</h3>
              <div className="text-2xl font-bold text-ink-900">{merchantName}</div>
              <div className="flex items-center space-x-2">
                <Badge status="VERIFIED">AI-Transactable Merchant</Badge>
              </div>
            </div>

            <div className="bg-surface-alt p-5 rounded-xl border border-surface-border space-y-3">
              <h3 className="text-sm font-semibold text-ink-900">Constitution Policy Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-400 block">Max Discount:</span>
                  <span className="font-semibold text-ink-900">{maxDiscountPct}%</span>
                </div>
                <div>
                  <span className="text-ink-400 block">Min Margin:</span>
                  <span className="font-semibold text-ink-900">{formatRupee(minMarginRupees * 100)}</span>
                </div>
                <div>
                  <span className="text-ink-400 block">Max AI Tx Limit:</span>
                  <span className="font-semibold text-ink-900">{formatRupee(maxAiTxRupees * 100)}</span>
                </div>
                <div>
                  <span className="text-ink-400 block">Refund Threshold:</span>
                  <span className="font-semibold text-ink-900">{formatRupee(refundThresholdRupees * 100)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-alt p-4 rounded-xl border border-surface-border flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-ink-900 block">Catalog Inventory Ready:</span>
              <span className="text-ink-400">{catalogItems.length} products to be imported into AgentPay discovery node</span>
            </div>
            <Badge status="AGREED">{catalogItems.length} SKUs Ready</Badge>
          </div>

          <div className="flex justify-between pt-4 border-t border-surface-border">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button variant="primary" size="lg" disabled={isSubmitting} onClick={handleFinalSubmit}>
              {isSubmitting ? "Deploying Merchant Node..." : "🚀 Complete Onboarding & Activate"}
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <Card className="text-center py-10 space-y-4">
          <div className="w-16 h-16 bg-success-light text-success-dark rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-ink-900">Merchant Agent Activated!</h2>
          <p className="text-sm text-ink-400 max-w-md mx-auto">
            <strong className="text-ink-900">{createdMerchant?.name}</strong> is now registered as an AI-transactable merchant with hard constitution policy locks enabled.
          </p>
          <div className="pt-4">
            <Button variant="primary" onClick={() => setStep(1)}>
              + Onboard Another Merchant
            </Button>
          </div>
        </Card>
      )}

      {/* LIVE PRODUCT CATALOG LIST (READ-ONLY VIEW OF ONBOARDED PRODUCTS) */}
      <div className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Onboarded Merchant Catalog Products</h2>
            <p className="text-xs text-ink-400">Live products stored in AgentPay MongoDB discovery engine.</p>
          </div>
          <Badge status="COMPLETED">{merchantProducts.length} Products Active</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchantProducts.map((p) => (
            <Card key={p._id} hoverable className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                    {p.attributes?.category || "B2B"}
                  </span>
                  <Badge status={p.inventory > 0 ? "PAID" : "FAILED"}>
                    {p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-ink-900 leading-snug">{p.name}</h3>
                <p className="text-xs text-ink-400 mt-1">{p.warranty || "Standard B2B terms"}</p>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-ink-400 block uppercase tracking-wide">Base Price</span>
                  <span className="text-lg font-semibold font-mono text-ink-900">{formatRupee(p.priceInPaise)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink-400 block uppercase tracking-wide">Floor Price</span>
                  <span className="text-xs font-mono font-medium text-ink-700">{formatRupee(p.minPriceInPaise)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

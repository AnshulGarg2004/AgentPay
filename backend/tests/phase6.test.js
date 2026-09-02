async function testPhase6() {
  console.log("=== STARTING PHASE 6 END-TO-END AUDIT TRAIL TEST ===");
  const pRes = await fetch("http://127.0.0.1:4000/api/products/search");
  const products = await pRes.json();
  const product = products[0];

  const bRes = await fetch("http://127.0.0.1:4000/api/buyers");
  const buyers = await bRes.json();
  const buyer = buyers[0];

  // 1. Negotiation
  const negRes = await fetch("http://127.0.0.1:4000/api/negotiations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product._id,
      buyerId: buyer._id,
      quantity: 1,
      targetPriceInPaise: 200000,
      requestedDeliveryDays: 3,
      notes: "Testing Phase 6 live audit logging",
    }),
  });
  const neg = await negRes.json();
  console.log("Negotiation Status:", neg.status);

  // 2. Generate Quote
  const qRes = await fetch("http://127.0.0.1:4000/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product._id,
      merchantId: product.merchantId?._id || product.merchantId,
      buyerId: buyer._id,
      unitPriceInPaise: 200000,
      quantity: 1,
      deliveryDays: 3,
      expiresInMinutes: 15,
    }),
  });
  const quote = await qRes.json();
  console.log("Quote Generated:", quote._id);

  // 3. Accept Quote -> Triggers Policy Engine & Audit Log
  const accRes = await fetch(`http://127.0.0.1:4000/api/quotes/${quote._id}/accept`, { method: "POST" });
  const accData = await accRes.json();
  const txnId = accData.transaction._id;
  console.log("Accepted Txn ID:", txnId, "State:", accData.transaction.state);

  // 4. Create Order
  const ordRes = await fetch("http://127.0.0.1:4000/api/payments/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId: txnId }),
  });
  const ordData = await ordRes.json();
  console.log("Order Created:", ordData.order.id);

  // 5. Initiate Payment
  const payRes = await fetch("http://127.0.0.1:4000/api/payments/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId: txnId, idempotencyKey: `idemp_p6_${Date.now()}` }),
  });
  const payData = await payRes.json();
  console.log("Payment Initiated Status:", payData.status);

  // 6. Deliver Webhook -> PAID
  const wbRes = await fetch("http://127.0.0.1:4000/api/webhooks/simulate-captured", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId: txnId }),
  });
  const wbData = await wbRes.json();
  console.log("Webhook Delivered Final State:", wbData.transaction.state);

  // 7. FETCH PERSISTED AUDIT TRAIL
  const auditRes = await fetch(`http://127.0.0.1:4000/api/approvals/audit/${txnId}`);
  const auditLogs = await auditRes.json();
  console.log(`\n=== PERSISTED AUDIT TRAIL FOR TXN #${txnId} (${auditLogs.length} ENTRIES) ===`);
  auditLogs.forEach((log, idx) => {
    console.log(`[${idx + 1}] Actor: ${log.actor.padEnd(15)} | Action: ${log.action.padEnd(28)} | Result: ${log.result}`);
    console.log(`    Reason: "${log.reason}"`);
  });
}

testPhase6().catch(console.error);

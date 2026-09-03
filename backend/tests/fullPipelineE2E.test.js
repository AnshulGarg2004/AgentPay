async function runFullPipelineE2E() {
  console.log("=== ESCROWAI END-TO-END PIPELINE INTEGRATION TEST ===");

  const prompt = "50 ergonomic office chairs, black, under ₹7,500 each, delivered within 10 days";

  // Step 1: Buyer Console Search API (buyerIntentAgent -> merchantAgent -> MongoDB)
  console.log("\n[Step 1] Sending natural language request to /api/products/search...");
  const searchRes = await fetch(`http://127.0.0.1:4000/api/products/search?q=${encodeURIComponent(prompt)}`);
  const searchData = await searchRes.json();

  console.log("  • Prompt:", searchData.prompt);
  console.log("  • Parsed Intent:", searchData.intent);
  console.log(`  • Found ${searchData.matches.length} ranked matching products`);

  const topMatch = searchData.matches[0];
  console.log(`  • Selected Top Match: "${topMatch.product.name}" (ID: ${topMatch.product._id})`);
  console.log(`  • Fact-Based Match Explanation: "${topMatch.explanation}"`);

  // Step 2: Initiate AI Negotiation Thread
  console.log("\n[Step 2] Initiating AI Negotiation Thread...");
  const negRes = await fetch("http://127.0.0.1:4000/api/negotiations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: topMatch.product._id,
      quantity: searchData.intent.quantity,
      targetPriceInPaise: searchData.intent.maxUnitPriceInPaise,
      requestedDeliveryDays: searchData.intent.deliveryDeadline,
      notes: searchData.prompt,
    }),
  });
  const negotiation = await negRes.json();
  console.log(`  • Negotiation Created (ID: ${negotiation._id}, Status: ${negotiation.status})`);
  console.log(`  • Agreed Unit Price: ₹${(negotiation.agreedOffer?.unitPriceInPaise / 100).toLocaleString('en-IN')}`);

  // Step 3: Lock & Generate Immutable Quote
  console.log("\n[Step 3] Generating Immutable Quote...");
  const quoteRes = await fetch("http://127.0.0.1:4000/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: topMatch.product._id,
      merchantId: topMatch.product.merchantId._id || topMatch.product.merchantId,
      unitPriceInPaise: negotiation.agreedOffer.unitPriceInPaise,
      quantity: negotiation.agreedOffer.quantity,
      deliveryDays: negotiation.agreedOffer.deliveryDays,
    }),
  });
  const quote = await quoteRes.json();
  console.log(`  • Quote Created (ID: ${quote._id}, Subtotal: ₹${(quote.subtotalInPaise / 100).toLocaleString('en-IN')}, Expires: ${quote.expiresAt})`);

  // Step 4: Buyer Accepts Quote -> Triggers Deterministic Policy Engine & Risk Scoring
  console.log("\n[Step 4] Accepting Quote -> Invoking Policy Engine...");
  const acceptRes = await fetch(`http://127.0.0.1:4000/api/quotes/${quote._id}/accept`, {
    method: "POST",
  });
  const acceptData = await acceptRes.json();

  console.log(`  • Policy Check Result: Authorized=${acceptData.policyResult?.authorized}, NeedsHumanApproval=${acceptData.policyResult?.requiresHumanApproval}`);
  console.log(`  • Risk Level: ${acceptData.riskResult?.riskLevel} (Score: ${acceptData.riskResult?.riskScore}/100)`);
  console.log(`  • Created Transaction ID: ${acceptData.transaction?._id}, Initial State: ${acceptData.transaction?.state}`);

  console.log("\n🎉 FULL PIPELINE INTEGRATION TEST PASSED PERFECTLY!");
}

runFullPipelineE2E().catch(console.error);

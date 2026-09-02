async function testBuyerConsoleApi() {
  console.log("=== TESTING NATURAL LANGUAGE BUYER SEARCH PIPELINE ===");

  const prompt = "50 ergonomic office chairs, black, under ₹7,500 each, delivered within 10 days";

  const res = await fetch(`http://127.0.0.1:4000/api/products/search?q=${encodeURIComponent(prompt)}`);
  const data = await res.json();

  console.log("\n1. Original User Prompt:", data.prompt);
  console.log("\n2. Buyer Intent Agent Parsed Intent:");
  console.log("   • Category:", data.intent?.category);
  console.log("   • Quantity:", data.intent?.quantity);
  console.log("   • Max Unit Price (Paise):", data.intent?.maxUnitPriceInPaise, `(₹${data.intent?.maxUnitPriceInPaise ? data.intent.maxUnitPriceInPaise / 100 : "N/A"})`);
  console.log("   • Attributes:", data.intent?.attributes);
  console.log("   • Delivery Deadline (Days):", data.intent?.deliveryDeadline);

  console.log(`\n3. Merchant Agent Ranked Matches (${data.matches?.length || 0} Products):`);
  (data.matches || []).forEach((m, idx) => {
    console.log(`\n[Match #${idx + 1}] Score: ${m.score}`);
    console.log(`   Product: ${m.product.name}`);
    console.log(`   Price: ₹${(m.product.priceInPaise / 100).toLocaleString('en-IN')}`);
    console.log(`   Inventory: ${m.product.inventory} units`);
    console.log(`   Delivery: ${m.product.deliveryMinDays}-${m.product.deliveryMaxDays} days`);
    console.log(`   Fact-Based Explanation: "${m.explanation}"`);
  });
}

testBuyerConsoleApi().catch(console.error);

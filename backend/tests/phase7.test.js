async function testPhase7() {
  console.log("=== STARTING PHASE 7 ANALYTICS & TRANSACTIONS TEST ===");

  // 1. Fetch Real Aggregated Merchant Analytics
  const aRes = await fetch("http://127.0.0.1:4000/api/merchants/all/analytics");
  const analytics = await aRes.json();
  console.log("Real DB Aggregated Merchant Analytics:");
  console.log("  • Total Revenue:", `₹${(analytics.totalRevenuePaise / 100).toLocaleString('en-IN')}`);
  console.log("  • Transaction Count:", analytics.transactionCount);
  console.log("  • Paid Count:", analytics.paidCount);
  console.log("  • Conversion Rate:", `${analytics.conversionRate}%`);
  console.log("  • Avg Order Value:", `₹${(analytics.avgOrderValuePaise / 100).toLocaleString('en-IN')}`);
  console.log("  • Pending Approvals:", analytics.pendingApprovalCount);
  console.log("  • State Breakdown:", analytics.stateBreakdown);

  // 2. Fetch Transactions List with Filtering
  const tRes = await fetch("http://127.0.0.1:4000/api/transactions?limit=10");
  const transactions = await tRes.json();
  console.log(`\nFetched ${transactions.length} transactions from /api/transactions:`);
  transactions.slice(0, 3).forEach((t, i) => {
    console.log(`  [${i + 1}] TXN #${String(t._id).slice(-8).toUpperCase()} | Product: ${t.productId?.name || 'N/A'} | Amount: ₹${(t.amountInPaise / 100).toLocaleString('en-IN')} | State: ${t.state}`);
  });
}

testPhase7().catch(console.error);

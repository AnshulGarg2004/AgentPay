// Format currency in Indian Rupees (₹X,XX,XXX)
export function formatRupee(paise) {
  if (paise === undefined || paise === null) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

// Format raw number with Indian digit grouping
export function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}

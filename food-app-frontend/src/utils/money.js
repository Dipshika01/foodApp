export function currencyOf(explicitCountry) {
  const c = (explicitCountry ?? localStorage.getItem("country") ?? "India").toString().toLowerCase();
  return c === "america" ? "USD" : "INR";
}

export function formatMoney(amount, country) {
  const code = currencyOf(country);                 // <- explicit country wins
  const locale = code === "USD" ? "en-US" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}
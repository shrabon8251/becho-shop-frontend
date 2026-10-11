export const money = (n: number, currency = "BDT") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: currency === "BDT" ? 0 : 2 }).format(n);

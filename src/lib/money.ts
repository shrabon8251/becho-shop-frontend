export const money = (n: number, currency = "BDT") => {
    // Never render "NaN": a missing/undefined amount becomes 0 (BUG-31/32 class).
    const v = Number.isFinite(Number(n)) ? Number(n) : 0;
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: currency === "BDT" ? 0 : 2 }).format(v);
};

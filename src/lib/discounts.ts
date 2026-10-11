import type { Discount, OrderItem } from "../types";
import { money } from "./money";

/** True when the discount is active, within its schedule, and has uses left. */
export function isUsable(d: Discount, now = Date.now()): boolean {
    if (!d.active) return false;
    if (d.usageLimit && d.usageLimit > 0 && d.used >= d.usageLimit) return false;
    if (d.startsAt && now < d.startsAt) return false;
    if (d.endsAt && now > d.endsAt) return false;
    return true;
}

export function isBxgy(d: Discount): boolean {
    return !!d.buyQty && d.buyQty > 0 && !!d.getQty && d.getQty > 0;
}

/** Find a usable discount-code match (case-insensitive). */
export function findCode(discounts: Discount[], code: string | undefined, now = Date.now()): Discount | undefined {
    const c = code?.trim().toUpperCase();
    if (!c) return undefined;
    return discounts.find((d) => (d.kind ?? "code") === "code" && d.code.toUpperCase() === c && isUsable(d, now));
}

/** Usable automatic discounts, best savings first. */
export function findAutos(discounts: Discount[], now = Date.now()): Discount[] {
    return discounts.filter((d) => (d.kind ?? "code") === "automatic" && isUsable(d, now));
}

/** Buy-X-get-Y amount: for each line, every (buyQty+getQty) units give getQty at getPercent% off. */
export function bxgyAmount(d: Discount, items: OrderItem[], prices: Map<string, number>): number {
    if (!isBxgy(d)) return 0;
    const buy = d.buyQty!, get = d.getQty!, pct = d.getPercent ?? 100;
    let amt = 0;
    for (const i of items) {
        const price = prices.get(i.variantId) ?? 0;
        const sets = Math.floor(i.qty / (buy + get));
        amt += sets * get * price * (pct / 100);
    }
    return amt;
}

function pctAmount(d: Discount, sub: number): number {
    return d.type === "%" ? (sub * d.value) / 100 : Math.min(d.value, sub);
}

export interface ResolvedDiscount {
    sub: number;
    disc: number;
    discLabel: string;
    freeShip: boolean;
    code?: string;
    applied?: Discount;
}

/**
 * Resolve which discount applies. A valid code wins over automatic ones.
 * Minimum purchase is checked against the subtotal.
 */
export function resolveDiscount(items: OrderItem[], prices: Map<string, number>, code: string | undefined, discounts: Discount[], now = Date.now(), currency = "BDT"): ResolvedDiscount {
    const sub = items.reduce((a, i) => a + (prices.get(i.variantId) ?? 0) * i.qty, 0);
    const meetsMin = (d: Discount) => !d.minimum || sub >= d.minimum;
    const label = (d: Discount) =>
        isBxgy(d) ? `Buy ${d.buyQty} get ${d.getQty}` : d.freeShipping ? "Free shipping" : d.type === "%" ? `${d.value}% off` : `${money(d.value, currency)} off`;

    const cd = findCode(discounts, code, now);
    if (cd && meetsMin(cd)) {
        const amt = isBxgy(cd) ? bxgyAmount(cd, items, prices) : pctAmount(cd, sub);
        return { sub, disc: Math.min(amt, sub), discLabel: `${cd.code} (${label(cd)})`, freeShip: !!cd.freeShipping, code: cd.code, applied: cd };
    }
    // Best automatic discount by savings; free shipping can stack with a %/$ auto discount.
    const autos = findAutos(discounts, now).filter(meetsMin);
    let best: Discount | undefined;
    let bestAmt = 0;
    for (const d of autos) {
        const amt = isBxgy(d) ? bxgyAmount(d, items, prices) : pctAmount(d, sub);
        if (amt > bestAmt) { bestAmt = amt; best = d; }
    }
    const freeShip = autos.some((d) => d.freeShipping);
    if (best) return { sub, disc: Math.min(bestAmt, sub), discLabel: `${best.title ?? best.code} (${label(best)})`, freeShip, code: undefined, applied: best };
    return { sub, disc: 0, discLabel: "", freeShip, code: undefined, applied: freeShip ? autos.find((d) => d.freeShipping) : undefined };
}

/** Short human-readable summary, e.g. "10% off", "Buy 2 get 1 free", "Free shipping". */
export function describeDiscount(d: Discount, currency = "BDT"): string {
    if (isBxgy(d)) return `Buy ${d.buyQty} get ${d.getQty}${(d.getPercent ?? 100) >= 100 ? " free" : ` (${d.getPercent}% off)`}`;
    if (d.freeShipping) return "Free shipping";
    return d.type === "%" ? `${d.value}% off` : `${money(d.value, currency)} off`;
}

/** "Active" / "Scheduled" / "Expired" / "Used up" / "Disabled". */
export function discountStatus(d: Discount, now = Date.now()): string {
    if (!d.active) return "Disabled";
    if (d.usageLimit && d.usageLimit > 0 && d.used >= d.usageLimit) return "Used up";
    if (d.startsAt && now < d.startsAt) return "Scheduled";
    if (d.endsAt && now > d.endsAt) return "Expired";
    return "Active";
}

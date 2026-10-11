import type { Plan, Store } from "../types";

// Becho plan pricing — BDT monthly base prices.
// Suggested to beat Lokzon (৳399/৳999/৳1,999): change the numbers here, everything updates.
export const PLANS: Record<Plan, number> = { Starter: 399, Growth: 999, Pro: 1999 };
export const PLAN_CURRENCY = "BDT" as const;
export const TRIAL_DAYS = 14;

export interface BillingCycle {
  id: string;
  months: number;
  /** fraction off the full-period price, e.g. 0.1 = 10% off */
  off: number;
  label: string;
}

export const BILLING_CYCLES: BillingCycle[] = [
  { id: "monthly", months: 1, off: 0, label: "Monthly" },
  { id: "quarterly", months: 3, off: 0.1, label: "3 months" },
  { id: "halfyearly", months: 6, off: 0.2, label: "6 months" },
  { id: "yearly", months: 12, off: 0.3, label: "Yearly" },
];

/** Total price for a plan over one billing cycle (rounded to whole taka). */
export const cyclePrice = (prices: Record<Plan, number>, p: Plan, c: BillingCycle): number =>
  Math.round(prices[p] * c.months * (1 - c.off));

/** Effective per-month price inside a cycle. */
export const cycleMonthly = (prices: Record<Plan, number>, p: Plan, c: BillingCycle): number =>
  Math.round(cyclePrice(prices, p, c) / c.months);

/** Promo codes → fraction off the first invoice. Backend must validate these server-side. */
export const PROMO_CODES: Record<string, number> = { BECHO10: 0.1 };

export const promoOff = (code: string): number =>
  PROMO_CODES[code.trim().toUpperCase()] ?? 0;

export const trialDaysLeft = (s: Store) => {
    // Backend authority: use trialEndsAt when present (TASK 2)
    const endsAt = (s as any).trialEndsAt;
    if (endsAt) {
        const ms = new Date(endsAt).getTime();
        if (!isNaN(ms)) {
            return Math.max(0, Math.ceil((ms - Date.now()) / 864e5));
        }
    }
    // Fallback: days since creation (guard against missing createdAt).
    const created = typeof s.createdAt === "number" ? s.createdAt : Date.parse(String(s.createdAt ?? ""));
    if (isNaN(created)) return TRIAL_DAYS;
    return Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - created) / 864e5));
};


/** Paid-plan days remaining. Cycles map to days (30/90/180/365). */
export const CYCLE_DAYS: Record<string, number> = { monthly: 30, quarterly: 90, halfyearly: 180, yearly: 365 };
export const paidDaysLeft = (s: Store) =>
  s.planExpiresAt ? Math.max(0, Math.ceil((s.planExpiresAt - Date.now()) / 864e5)) : 0;

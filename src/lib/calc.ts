import type { Discount, OrderItem, Settings } from "../types";
import { resolveDiscount } from "./discounts";
import { cartWeight, pickRate } from "./shipping";
export interface Totals { sub: number; disc: number; discLabel: string; ship: number; shipName: string; tax: number; taxRate: number; duties: number; total: number }
export interface CalcOpts { rateId?: string; weights?: Map<string, number>; taxExempt?: Set<string> }
/** Build the tax-exempt variant set from the product catalog, so tax skips exempt products. */
export function taxOpts(products: { taxExempt?: boolean; variants: { id: string }[] }[]): Pick<CalcOpts, "taxExempt"> {
    return { taxExempt: new Set(products.flatMap((p) => (p.taxExempt ? p.variants.map((v) => v.id) : []))) };
}
export function calc(items: OrderItem[], prices: Map<string, number>, zoneId: string | undefined, code: string | undefined, s: Settings, discounts: Discount[], opts: CalcOpts = {}): Totals {
    const r = resolveDiscount(items, prices, code, discounts, Date.now(), s.currency);
    const after = r.sub - r.disc;
    const z = s.zones.find((x) => x.id === zoneId);
    const weightKg = opts.weights ? cartWeight(items, opts.weights) : undefined;
    const rate = z ? pickRate(z, after, weightKg, opts.rateId) : undefined;
    const shipName = rate?.name ?? "";
    const ship = r.freeShip ? 0 : rate ? (s.freeOver > 0 && after >= s.freeOver ? 0 : rateCostOf(rate, weightKg ?? 0)) : 0;
    // Tax: a zone can point at a tax region (nexus); otherwise the store's default rate applies.
    const region = z?.taxRegionId ? s.taxRegions?.find((t) => t.id === z.taxRegionId) : undefined;
    const taxRate = region ? region.rate : s.tax.rate;
    const exempt = opts.taxExempt;
    const taxableSub = r.sub > 0 ? items.reduce((a, i) => a + (exempt?.has(i.variantId) ? 0 : (prices.get(i.variantId) ?? 0) * i.qty), 0) : 0;
    const taxableAfter = r.sub > 0 ? (taxableSub / r.sub) * after : 0;
    const tax = s.tax.on ? (s.tax.inclusive ? taxableAfter - taxableAfter / (1 + taxRate / 100) : (taxableAfter * taxRate) / 100) : 0;
    // Duties: charged per zone as a % of the discounted subtotal when the zone collects them.
    const duties = z?.duties?.collect ? Math.round(after * (z.duties.rate / 100) * 100) / 100 : 0;
    return { sub: r.sub, disc: r.disc, discLabel: r.discLabel, ship, shipName, tax, taxRate, duties, total: after + ship + duties + (s.tax.inclusive ? 0 : tax) };
}
function rateCostOf(rate: NonNullable<ReturnType<typeof pickRate>>, weightKg: number): number {
    return rate.carrier && rate.perKg ? rate.price + rate.perKg * weightKg : rate.price;
}

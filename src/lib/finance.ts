import type { Discount, Order, Product, Settings } from "../types";
import { calc, taxOpts } from "./calc";
export const FEE_RATE = 0.029;
export const FEE_FIXED = 0.3;
export interface FinanceSummary { gross: number; refunds: number; fees: number; net: number; count: number }
/** Captured = paid or refunded orders. Payment fees are not returned on refunds. */
export function financeSummary(orders: Order[], prices: Map<string, number>, s: Settings, discounts: Discount[], products: Product[]): FinanceSummary {
  let gross = 0, refunds = 0, fees = 0, count = 0;
  for (const o of orders) {
    if (o.pay !== "Paid" && o.pay !== "Refunded") continue;
    const t = calc(o.items, prices, o.zoneId, o.code, s, discounts, taxOpts(products)).total;
    gross += t; refunds += o.refunded; fees += t * FEE_RATE + FEE_FIXED; count += 1;
  }
  return { gross, refunds, fees, net: gross - refunds - fees, count };
}

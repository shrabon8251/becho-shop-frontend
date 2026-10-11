import type { Customer, CustomerSegment, SegmentCondition } from "../types";

export interface CustomerStats { totalSpent: number; ordersCount: number }

function condVal(stats: CustomerStats, c: Customer, cond: SegmentCondition): boolean {
  if (cond.field === "tag") {
    const v = cond.value.trim().toLowerCase();
    if (!v) return false;
    const tags = (c.tags ?? []).map((t) => t.toLowerCase());
    return cond.op === "eq" ? tags.includes(v) : cond.op === "contains" ? tags.some((t) => t.includes(v)) : false;
  }
  const n = parseFloat(cond.value);
  if (Number.isNaN(n)) return false;
  const actual = cond.field === "totalSpent" ? stats.totalSpent : stats.ordersCount;
  return cond.op === "gte" ? actual >= n : cond.op === "lte" ? actual <= n : actual === n;
}

/** All conditions must match; empty/invalid conditions match nothing. */
export function segmentMatches(c: Customer, stats: CustomerStats, s: CustomerSegment): boolean {
  const conds = (s.conditions ?? []).filter((x) => x.value.trim() !== "");
  return conds.length > 0 && conds.every((x) => condVal(stats, c, x));
}

export function segmentMembers(segment: CustomerSegment, customers: Customer[], statsOf: (id: string) => CustomerStats): Customer[] {
  return customers.filter((c) => segmentMatches(c, statsOf(c.id), segment));
}

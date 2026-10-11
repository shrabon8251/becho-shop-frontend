import type { Customer, Discount, Order, Product, Settings } from "../types";
import { calc, taxOpts, type Totals } from "./calc";
import { priceMap } from "./orderTotal";

export interface ReportCtx {
  orders: Order[]; products: Product[]; customers: Customer[]; discounts: Discount[];
  settings: Settings; abandoned: { createdAt: number; recovered: boolean }[];
  prices: Map<string, number>;
  totalOf(o: Order): Totals;
}
export function makeCtx(orders: Order[], products: Product[], customers: Customer[], discounts: Discount[], settings: Settings, abandoned: { createdAt: number; recovered: boolean }[]): ReportCtx {
  const prices = priceMap(products);
  const opts = taxOpts(products);
  return { orders, products, customers, discounts, settings, abandoned, prices, totalOf: (o) => calc(o.items, prices, o.zoneId, o.code, settings, discounts, opts) };
}
export type RangeKey = "7d" | "30d" | "90d" | "all";
export const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "Last 7 days" }, { id: "30d", label: "Last 30 days" }, { id: "90d", label: "Last 90 days" }, { id: "all", label: "All time" },
];
export function inRange(ts: number, r: RangeKey): boolean {
  if (r === "all") return true;
  const days = r === "7d" ? 7 : r === "30d" ? 30 : 90;
  return ts >= Date.now() - days * 864e5;
}
export const captured = (o: Order) => o.pay === "Paid" || o.pay === "Refunded";

export interface ReportDef {
  id: string; group: "Sales" | "Customers" | "Behavior"; name: string; desc: string;
  columns: string[];
  rows(ctx: ReportCtx, range: RangeKey): (string | number)[][];
  bars?(ctx: ReportCtx, range: RangeKey): { label: string; v: number }[];
}

function dayLabel(ts: number) { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

function dailyBuckets(range: RangeKey): { start: number; label: string }[] {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
  const out: { start: number; label: string }[] = [];
  for (let k = days - 1; k >= 0; k--) {
    const d = new Date(Date.now() - k * 864e5); d.setHours(0, 0, 0, 0);
    out.push({ start: d.getTime(), label: dayLabel(d.getTime()) });
  }
  return out;
}
function bucketize<T>(items: T[], ts: (x: T) => number, range: RangeKey, val: (x: T) => number) {
  const b = dailyBuckets(range);
  return b.map(({ start, label }) => ({ label, v: items.filter((x) => { const t = ts(x); return t >= start && t < start + 864e5; }).reduce((a, x) => a + val(x), 0) }));
}

const vTitle = (ctx: ReportCtx, variantId: string) => {
  for (const p of ctx.products) { const v = p.variants.find((x) => x.id === variantId); if (v) return `${p.title} — ${v.name}`; }
  return variantId;
};

export const REPORTS: ReportDef[] = [
  {
    id: "sales-time", group: "Sales", name: "Sales over time", desc: "Gross sales per day.",
    columns: ["Date", "Orders", "Gross sales"],
    rows: (ctx, r) => dailyBuckets(r).map(({ start, label }) => {
      const os = ctx.orders.filter((o) => captured(o) && o.createdAt >= start && o.createdAt < start + 864e5);
      return [label, os.length, +os.reduce((a, o) => a + ctx.totalOf(o).total, 0).toFixed(2)];
    }),
    bars: (ctx, r) => bucketize(ctx.orders.filter(captured), (o) => o.createdAt, r, (o) => ctx.totalOf(o).total),
  },
  {
    id: "sales-product", group: "Sales", name: "Sales by product", desc: "Units and revenue per product.",
    columns: ["Product", "Units sold", "Gross revenue"],
    rows: (ctx, r) => {
      const m = new Map<string, { units: number; rev: number }>();
      for (const o of ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)))
        for (const i of o.items) {
          const t = vTitle(ctx, i.variantId).split(" — ")[0];
          const e = m.get(t) ?? { units: 0, rev: 0 };
          e.units += i.qty; e.rev += (ctx.prices.get(i.variantId) ?? 0) * i.qty;
          m.set(t, e);
        }
      return [...m.entries()].sort((a, b) => b[1].rev - a[1].rev).map(([t, e]) => [t, e.units, +e.rev.toFixed(2)]);
    },
  },
  {
    id: "sales-discount", group: "Sales", name: "Sales by discount", desc: "Orders and discounts given per code.",
    columns: ["Discount code", "Orders", "Discount given"],
    rows: (ctx, r) => {
      const m = new Map<string, { n: number; d: number }>();
      for (const o of ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r) && o.code)) {
        const t = ctx.totalOf(o);
        const e = m.get(o.code!) ?? { n: 0, d: 0 };
        e.n += 1; e.d += t.disc;
        m.set(o.code!, e);
      }
      return [...m.entries()].sort((a, b) => b[1].d - a[1].d).map(([code, e]) => [code, e.n, +e.d.toFixed(2)]);
    },
  },
  {
    id: "sales-tax", group: "Sales", name: "Taxes collected", desc: "Tax charged per day.",
    columns: ["Date", "Tax collected"],
    rows: (ctx, r) => bucketize(ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)), (o) => o.createdAt, r, (o) => ctx.totalOf(o).tax)
      .map((b) => [b.label, +b.v.toFixed(2)]),
    bars: (ctx, r) => bucketize(ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)), (o) => o.createdAt, r, (o) => ctx.totalOf(o).tax),
  },
  {
    id: "sales-shipping", group: "Sales", name: "Shipping revenue", desc: "Shipping charged per day.",
    columns: ["Date", "Shipping charged"],
    rows: (ctx, r) => bucketize(ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)), (o) => o.createdAt, r, (o) => ctx.totalOf(o).ship)
      .map((b) => [b.label, +b.v.toFixed(2)]),
    bars: (ctx, r) => bucketize(ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)), (o) => o.createdAt, r, (o) => ctx.totalOf(o).ship),
  },
  {
    id: "sales-refunds", group: "Sales", name: "Refunds", desc: "Refunded orders in range.",
    columns: ["Order", "Date", "Refunded"],
    rows: (ctx, r) => ctx.orders.filter((o) => o.refunded > 0 && inRange(o.createdAt, r))
      .map((o) => [`#${o.id}`, new Date(o.createdAt).toLocaleDateString(), +o.refunded.toFixed(2)]),
  },
  {
    id: "cust-top", group: "Customers", name: "Top customers", desc: "Customers ranked by total spend.",
    columns: ["Customer", "Orders", "Total spent"],
    rows: (ctx, r) => {
      const m = new Map<string, { n: number; s: number }>();
      for (const o of ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r))) {
        const e = m.get(o.customerId) ?? { n: 0, s: 0 };
        e.n += 1; e.s += ctx.totalOf(o).total;
        m.set(o.customerId, e);
      }
      return [...m.entries()].sort((a, b) => b[1].s - a[1].s).slice(0, 50).map(([id, e]) => {
        const c = ctx.customers.find((x) => x.id === id);
        return [c ? `${c.name} (${c.email})` : id, e.n, +e.s.toFixed(2)];
      });
    },
  },
  {
    id: "cust-repeat", group: "Customers", name: "New vs returning", desc: "Share of orders from repeat buyers.",
    columns: ["Type", "Orders", "Share"],
    rows: (ctx, r) => {
      const counts = new Map<string, number>();
      for (const o of ctx.orders) counts.set(o.customerId, (counts.get(o.customerId) ?? 0) + 1);
      const os = ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r));
      const ret = os.filter((o) => (counts.get(o.customerId) ?? 0) > 1).length;
      const nw = os.length - ret;
      const pct = (n: number) => (os.length ? `${Math.round((n / os.length) * 100)}%` : "—");
      return [["New customers", nw, pct(nw)], ["Returning customers", ret, pct(ret)]];
    },
  },
  {
    id: "beh-units", group: "Behavior", name: "Units sold by variant", desc: "Best-selling variants.",
    columns: ["Variant", "Units sold"],
    rows: (ctx, r) => {
      const m = new Map<string, number>();
      for (const o of ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)))
        for (const i of o.items) m.set(i.variantId, (m.get(i.variantId) ?? 0) + i.qty);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50).map(([vid, n]) => [vTitle(ctx, vid), n]);
    },
    bars: (ctx, r) => {
      const m = new Map<string, number>();
      for (const o of ctx.orders.filter((o) => captured(o) && inRange(o.createdAt, r)))
        for (const i of o.items) m.set(i.variantId, (m.get(i.variantId) ?? 0) + i.qty);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([vid, n]) => ({ label: vTitle(ctx, vid).slice(0, 18), v: n }));
    },
  },
  {
    id: "beh-abandoned", group: "Behavior", name: "Abandoned checkouts", desc: "Abandoned vs completed checkouts.",
    columns: ["Status", "Count"],
    rows: (ctx, r) => {
      const ab = ctx.abandoned.filter((a) => inRange(a.createdAt, r)).length;
      const done = ctx.orders.filter((o) => inRange(o.createdAt, r)).length;
      return [["Abandoned", ab], ["Completed orders", done], ["Recovery rate", ab + done ? `${Math.round((done / (ab + done)) * 100)}% completed` : "—"]];
    },
  },
  {
    id: "beh-aov", group: "Behavior", name: "Average order value", desc: "AOV per day.",
    columns: ["Date", "Orders", "Avg order value"],
    rows: (ctx, r) => dailyBuckets(r).map(({ start, label }) => {
      const os = ctx.orders.filter((o) => captured(o) && o.createdAt >= start && o.createdAt < start + 864e5);
      const g = os.reduce((a, o) => a + ctx.totalOf(o).total, 0);
      return [label, os.length, os.length ? +(g / os.length).toFixed(2) : 0];
    }),
    bars: (ctx, r) => dailyBuckets(r).map(({ start, label }) => {
      const os = ctx.orders.filter((o) => captured(o) && o.createdAt >= start && o.createdAt < start + 864e5);
      const g = os.reduce((a, o) => a + ctx.totalOf(o).total, 0);
      return { label, v: os.length ? g / os.length : 0 };
    }),
  },
];

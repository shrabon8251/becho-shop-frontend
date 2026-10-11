import { useState } from "react";
import { PageHeader, Loading } from "../components/polaris";
import { api } from "../api";
import { Card } from "../components/ui";
import { FEE_FIXED, FEE_RATE, financeSummary } from "../lib/finance";
import { money } from "../lib/money";
import { calc, taxOpts } from "../lib/calc";
import { priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
export default function Finance() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([api.orders.list(storeId), api.products.list(storeId), api.settings.get(storeId), api.discounts.list(storeId), api.payouts.list(storeId), api.locations.list(storeId)]), [storeId]);
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState("");
  if (!data) return <Loading />;
  const [orders, products, settings, discounts, payouts, locations] = data;
  const cur = settings.currency;
  const sum = financeSummary(orders, priceMap(products), settings, discounts, products);
  const paidOut = payouts.reduce((a, p) => a + p.amount, 0);
  const available = Math.max(0, sum.net - paidOut);
  const prices = priceMap(products);
  const branchSales = new Map<string, { n: number; total: number }>();
  for (const o of orders) {
    if (o.pay !== "Paid" || !o.locationId) continue;
    const t = calc(o.items, prices, o.zoneId, o.code, settings, discounts, taxOpts(products)).total;
    const b = branchSales.get(o.locationId) ?? { n: 0, total: 0 };
    b.n += 1; b.total += t; branchSales.set(o.locationId, b);
  }
  const request = async () => {
    const a = amt ? +amt : available;
    try { await api.payouts.request(storeId, Math.round(a * 100) / 100); setAmt(""); setErr(""); reload(); } catch (e) { setErr((e as Error).message); }
  };
  const stats: [string, number][] = [[t("Gross sales"), sum.gross], [t("Refunds"), sum.refunds], [t("Fees"), sum.fees], [t("Paid out"), paidOut], [t("Available"), available]];
  return (
    <>
      <PageHeader title={t("Finance")} />
      <div className="grid">{stats.map(([k, v]) => <div className="card" key={k}><div className="mu-t">{k}</div><div className="big">{money(v, cur)}</div></div>)}</div>
      <p className="mu-t">{t("Fees")}: {(FEE_RATE * 100).toFixed(1)}% + {money(FEE_FIXED, cur)} {t("per captured order (demo rate).")}</p>
      <div className="row"><input type="number" min={0} placeholder={`${t("Amount")} (max ${available.toFixed(2)})`} aria-label={t("Amount")} value={amt} onChange={(e) => setAmt(e.target.value)} /><button className="btn" disabled={available <= 0} onClick={request}>{t("Request payout")}</button></div>
      {err && <p className="er-t">{err}</p>}
      <Card><b>{t("Sales by branch")}</b>
        {branchSales.size ? <table><thead><tr><th>{t("Branch")}</th><th>{t("Orders")}</th><th>{t("Sales")}</th></tr></thead>
          <tbody>{[...branchSales.entries()].map(([id, b]) => (
            <tr key={id}><td>{locations.find((l) => l.id === id)?.name ?? id}</td><td>{b.n}</td><td>{money(b.total, cur)}</td></tr>))}</tbody></table>
          : <p className="mu-t">{t("No branch-tagged sales yet. Pick a branch on the POS screen.")}</p>}</Card>
      <Card><b>{t("Payout history")}</b><table><tbody>{payouts.map((p) => <tr key={p.id}><td>{new Date(p.date).toLocaleDateString()}</td><td>{money(p.amount, cur)}</td><td>{p.status}</td></tr>)}</tbody></table>
        {!payouts.length && <p className="mu-t">{t("No payouts yet.")}</p>}</Card>
    </>
  );
}

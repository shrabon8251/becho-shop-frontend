import { useState } from "react";
import { api } from "../api";
import { PageHeader, Loading, toast } from "../components/polaris";
import { Card } from "../components/ui";
import { makeCtx, REPORTS, RANGES, type RangeKey } from "../lib/reports";
import { toCsv } from "../lib/csv";
import { money } from "../lib/money";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";

const GROUPS = ["Sales", "Customers", "Behavior"] as const;

export default function Analytics() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => Promise.all([
    api.orders.list(storeId), api.products.list(storeId), api.customers.list(storeId),
    api.discounts.list(storeId), api.settings.get(storeId), api.abandoned.list(storeId),
  ]), [storeId]);
  const [reportId, setReportId] = useState("sales-time");
  const [range, setRange] = useState<RangeKey>("30d");
  if (!data) return <Loading />;
  const [orders, products, customers, discounts, settings, abandoned] = data;
  const cur = settings.currency;
  const ctx = makeCtx(orders, products, customers, discounts, settings, abandoned);
  const rep = REPORTS.find((r) => r.id === reportId) ?? REPORTS[0];
  const rows = rep.rows(ctx, range);
  const bars = rep.bars?.(ctx, range);
  const max = Math.max(1, ...(bars ?? []).map((b) => b.v));
  const moneyCols = new Set(rep.columns.map((c, i) => (/sales|revenue|spent|refunded|tax|shipping|value/i.test(c) ? i : -1)).filter((i) => i >= 0));
  const exportCsv = () => {
    const csv = toCsv([rep.columns, ...rows.map((r) => r.map(String))]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${rep.id}-${range}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t("Report exported"));
  };
  return (
    <>
      <PageHeader title={t("Analytics")}
        actions={<>
          <select aria-label={t("Date range")} value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>{" "}
          <button className="btn s" onClick={exportCsv}>{t("Export CSV")}</button>
        </>} />
      <div className="setgrid">
        <Card>
          {GROUPS.map((g) => (
            <div key={g} style={{ marginBottom: 12 }}>
              <div className="mu-t" style={{ marginBottom: 4 }}>{t(g)}</div>
              {REPORTS.filter((r) => r.group === g).map((r) => (
                <button key={r.id} className={"btn s block" + (r.id === rep.id ? " on" : "")} style={{ marginBottom: 4 }} onClick={() => setReportId(r.id)}>{r.name}</button>
              ))}
            </div>
          ))}
        </Card>
        <div>
          <Card>
            <div className="between"><div><b>{rep.name}</b><div className="mu-t">{rep.desc}</div></div></div>
            {bars && bars.length > 0 && (
              <div className="bars" style={{ margin: "12px 0" }}>
                {bars.map((b, i) => {
                  const step = Math.max(1, Math.ceil(bars.length / 6));
                  const showLabel = i % step === 0 || i === bars.length - 1;
                  return <div key={b.label} className="barcol"><div className="bar" style={{ height: Math.max(2, (b.v / max) * 110) }} title={`${b.label}: ${String(Math.round(b.v * 100) / 100)}`} /><div className="mu-t">{showLabel ? b.label : ""}</div></div>;
                })}
              </div>
            )}
            {rows.length === 0 || rows.every((r) => r.slice(1).every((v) => v === 0 || v === "0" || v === "—")) ? (
              <p className="mu-t">{t("No data for this range yet.")}</p>
            ) : (
              <table className="ptable"><thead><tr>{rep.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{rows.map((r, i) => (
                  <tr key={i}>{r.map((v, j) => <td key={j}>{moneyCols.has(j) && typeof v === "number" ? money(v, cur) : String(v)}</td>)}</tr>
                ))}</tbody></table>
            )}
          </Card>
          <p className="mu-t">{t("Computed in the browser from store data. For large stores, add an aggregated analytics endpoint on the backend.")}</p>
        </div>
      </div>
    </>
  );
}

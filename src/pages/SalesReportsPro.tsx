import { api } from "../api";
import { useT } from "../lib/fx";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { orderTotal, priceMap } from "../lib/orderTotal";
import { PageHeader, Loading } from "../components/polaris";
import { Card } from "../components/ui";

/** Sales Reports Pro app: LTV, top customers, repeat-purchase cohorts. */
export default function SalesReportsPro() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => Promise.all([
    api.orders.list(storeId), api.customers.list(storeId), api.settings.get(storeId), api.products.list(storeId),
  ]), [storeId]);
  if (!data) return <Loading />;
  const [orders, customers, settings, products] = data;
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(n);
  const prices = priceMap(products);
  const total = (o: (typeof orders)[number]) => orderTotal(o, prices);
  const paid = orders.filter((o) => o.pay === "Paid" && o.ful !== "Cancelled");
  const revenue = paid.reduce((s, o) => s + total(o), 0);
  const custById = new Map(customers.map((c) => [c.id, c]));

  // LTV per customer.
  const byCust = new Map<string, { name: string; orders: number; spent: number }>();
  for (const o of paid) {
    const c = custById.get(o.customerId);
    const e = byCust.get(o.customerId) ?? { name: c?.name || t("Guest"), orders: 0, spent: 0 };
    e.orders++; e.spent += total(o); byCust.set(o.customerId, e);
  }
  const top = [...byCust.values()].sort((a, b) => b.spent - a.spent).slice(0, 10);
  const avgLtv = byCust.size ? [...byCust.values()].reduce((s, e) => s + e.spent, 0) / byCust.size : 0;
  const repeaters = [...byCust.values()].filter((e) => e.orders > 1).length;
  const repeatRate = byCust.size ? Math.round(100 * repeaters / byCust.size) : 0;

  // Revenue by month (last 6).
  const months: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mTotal = paid.filter((o) => {
      const od = new Date(o.createdAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    }).reduce((s, o) => s + total(o), 0);
    months.push({ label: d.toLocaleString(undefined, { month: "short" }), total: mTotal });
  }
  const maxM = Math.max(1, ...months.map((m) => m.total));

  return (
    <>
      <PageHeader title={"📊 " + t("Sales Reports Pro")} />
      <div className="row" style={{ marginBottom: 12 }}>
        <Card><b>{t("Total revenue")}</b><div className="big">{fmt(revenue)}</div><p className="mu-t">{paid.length} {t("paid orders")}</p></Card>
        <Card><b>{t("Avg. customer LTV")}</b><div className="big">{fmt(Math.round(avgLtv))}</div><p className="mu-t">{byCust.size} {t("customers")}</p></Card>
        <Card><b>{t("Repeat purchase rate")}</b><div className="big">{repeatRate}%</div><p className="mu-t">{repeaters} {t("repeat customers")}</p></Card>
      </div>
      <div className="row" style={{ alignItems: "stretch" }}>
        <Card><b>{t("Revenue — last 6 months")}</b>
          <div className="app-bars">{months.map((m) => (
            <div key={m.label} className="app-bar"><span style={{ height: `${Math.round(100 * m.total / maxM)}%` }} /><i>{m.label}</i><em>{fmt(m.total)}</em></div>))}</div>
        </Card>
        <Card><b>{t("Top customers by LTV")}</b>
          <table><tbody>{top.map((c, i) => (
            <tr key={i}><td>#{i + 1}</td><td>{c.name}</td><td>{c.orders} {t("orders")}</td><td><b>{fmt(c.spent)}</b></td></tr>))}</tbody></table>
          {!top.length && <p className="mu-t">{t("No customer data yet.")}</p>}
        </Card>
      </div>
      <Card><b>{t("Customer cohorts")}</b>
        <table><thead><tr><th>{t("Segment")}</th><th>{t("Customers")}</th><th>{t("Share")}</th></tr></thead><tbody>
          {[[t("One-time buyers"), byCust.size - repeaters], [t("Repeat buyers (2+ orders)"), repeaters],
            [t("VIP (5+ orders)"), [...byCust.values()].filter((e) => e.orders >= 5).length]].map(([label, n]) => (
            <tr key={label as string}><td>{label}</td><td>{n}</td>
              <td><div className="app-meter"><span style={{ width: `${byCust.size ? Math.round(100 * (n as number) / byCust.size) : 0}%` }} /></div></td></tr>))}
        </tbody></table>
      </Card>
    </>
  );
}

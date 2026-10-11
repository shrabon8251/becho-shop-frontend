import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { LineChart, Spark } from "../components/charts";
import { Loading } from "../components/polaris";
import { Badge, Card } from "../components/ui";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { variantIndex } from "../lib/shop";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
const DAY = 864e5;
const delta = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev * 100 : null);
function Onboarding({ products, orders, discounts, storeId }: { products: unknown[]; orders: unknown[]; discounts: unknown[]; storeId: string }) {
    const t = useT();
    const [done, setDone] = useState(() => { try { return localStorage.getItem("onboarding-done:" + storeId) === "1"; } catch { return false; } });
    if (done) return null;
    const themed = (() => { try { return localStorage.getItem("theme-customized:" + storeId) === "1"; } catch { return false; } })();
    const steps = [
        { ok: products.length > 0, label: t("Add your first product"), to: "/admin/products" },
        { ok: themed, label: t("Customize your theme"), to: "/admin/theme" },
        { ok: discounts.length > 0, label: t("Create a discount"), to: "/admin/discounts" },
        { ok: orders.length > 0, label: t("Get your first order"), to: "/admin/orders" },
    ];
    const n = steps.filter((x) => x.ok).length;
    if (n === steps.length) return null;
    const hide = () => { setDone(true); try { localStorage.setItem("onboarding-done:" + storeId, "1"); } catch { /* ignore */ } };
    return (
        <div className="card ob">
            <div className="between"><b>🚀 {t("Get started")} ({n}/{steps.length})</b><button className="btn s ico" aria-label={t("Dismiss")} onClick={hide}>✕</button></div>
            <div className="ob-bar"><div style={{ width: (n / steps.length) * 100 + "%" }} /></div>
            {steps.map((x, i) => (
                <Link key={i} to={x.to} className={"ob-s" + (x.ok ? " ok" : "")}>
                    <span className="ob-c">{x.ok ? "✓" : i + 1}</span><span>{x.label}</span>{!x.ok && <span aria-hidden>→</span>}
                </Link>))}
        </div>
    );
}
/** Time-based greeting. */
function greeting(t: (s: string) => string) {
    const h = new Date().getHours();
    if (h < 12) return t("Good morning");
    if (h < 17) return t("Good afternoon");
    return t("Good evening");
}
const METRIC_ICONS = ["💰", "📦", "🧾", "⏳"];
export default function Dashboard() {
    const t = useT();
    const user = useAuth((s) => s.user);
    const storeId = user!.storeId!;
    const { data } = useLoad(() => Promise.all([api.orders.list(storeId), api.products.list(storeId), api.settings.get(storeId), api.discounts.list(storeId), api.meta.announcements()]), [storeId]);
    const [range, setRange] = useState(7);
    const [dismissed, setDismissed] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("dismissed-ann") ?? "[]"); } catch { return []; } });
    if (!data) return <Loading />;
    const [orders, products, settings, discounts, anns] = data;
    const visible = anns.filter((a) => !dismissed.includes(a.id));
    const dismiss = (id: string) => { const next = [...dismissed, id]; setDismissed(next); try { localStorage.setItem("dismissed-ann", JSON.stringify(next)); } catch { /* ignore */ } };
    const cur = settings.currency, prices = priceMap(products), idx = variantIndex(products);
    const tot = (o: (typeof orders)[number]) => calc(o.items, prices, o.zoneId, o.code, settings, discounts, taxOpts(products)).total;
    const isPaid = (o: (typeof orders)[number]) => o.pay === "Paid" || o.pay === "Refunded";
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const days = (from: number) => Array.from({ length: range }, (_, i) => {
        const s = from + i * DAY, os = orders.filter((o) => o.createdAt >= s && o.createdAt < s + DAY && o.pay !== "Cancelled");
        return { label: new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }), sales: os.filter(isPaid).reduce((a, o) => a + tot(o), 0), orders: os.length, paid: os.filter(isPaid).length };
    });
    const start = d0.getTime() - (range - 1) * DAY, now = days(start), prev = days(start - range * DAY);
    const sum = (a: typeof now, k: "sales" | "orders" | "paid") => a.reduce((s, d) => s + d[k], 0);
    const sales = sum(now, "sales"), cnt = sum(now, "orders"), paidN = sum(now, "paid");
    const toFulfill = orders.filter((o) => o.ful === "Unfulfilled" && o.pay !== "Cancelled" && o.pay !== "Refunded").length;
    const top = new Map<string, number>();
    for (const o of orders) if (isPaid(o) && o.createdAt >= start) for (const i of o.items) { const r = idx.get(i.variantId); if (r) top.set(r.p.title, (top.get(r.p.title) ?? 0) + r.v.price * i.qty); }
    const Delta = ({ d }: { d: number | null }) => (d === null ? <span className="mu-t">–</span> : <span className={d >= 0 ? "ok-t" : "er-t"}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%</span>);
    const metrics: { k: string; v: string; d?: number | null; s?: number[]; to?: string; icon: string }[] = [
        { k: t("Total sales"), v: money(sales, cur), d: delta(sales, sum(prev, "sales")), s: now.map((x) => x.sales), icon: METRIC_ICONS[0] },
        { k: t("Orders"), v: String(cnt), d: delta(cnt, sum(prev, "orders")), s: now.map((x) => x.orders), icon: METRIC_ICONS[1] },
        { k: t("Average order value"), v: money(paidN ? sales / paidN : 0, cur), icon: METRIC_ICONS[2] },
        { k: t("To fulfill"), v: String(toFulfill), to: "/admin/orders", icon: METRIC_ICONS[3] },
    ];
    const firstName = (user?.name || user?.email || "").split(" ")[0].split("@")[0];
    const todayStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    // Activity timeline: latest order events.
    const activity = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6).map((o) => ({
        id: o.id,
        icon: o.pay === "Paid" ? "💰" : o.ful === "Fulfilled" ? "📦" : "🛒",
        text: `#${o.id} — ${money(tot(o), cur)}`,
        sub: `${o.pay} · ${new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        to: `/admin/orders/${o.id}`,
    }));
    return (
        <>
            {/* Welcome header with quick actions */}
            <div className="dash-welcome">
                <div>
                    <h1 className="dash-greet">{greeting(t)}, {firstName} 👋</h1>
                    <p className="mu-t">{t("Here's what's happening with your store today")} · {todayStr}</p>
                </div>
                <div className="dash-actions">
                    <select className="mini-select" aria-label={t("Date range")} value={range} onChange={(e) => setRange(+e.target.value)}>
                        <option value={7}>{t("Last 7 days")}</option><option value={30}>{t("Last 30 days")}</option><option value={90}>{t("Last 90 days")}</option>
                    </select>
                    <Link to={`/shop?store=${storeId}`} className="btn s">🔗 {t("View store")}</Link>
                    <Link to="/admin/products" className="btn">+ {t("Add product")}</Link>
                </div>
            </div>
            <Onboarding products={products} orders={orders} discounts={discounts} storeId={storeId} />
            {visible.map((a) => (
                <div key={a.id} className="card" style={{ borderLeft: "4px solid var(--ac)", marginBottom: 12 }}>
                    <div className="between"><b>📣 {a.title}</b><button className="btn s ico" aria-label={t("Dismiss announcement")} onClick={() => dismiss(a.id)}>✕</button></div>
                    <p style={{ margin: "6px 0 0" }}>{a.body}</p>
                </div>))}
            <div className="grid">{metrics.map((m) => (
                <div className="card mtile" key={m.k}>
                    <div className="between"><span className="mu-t">{m.to ? <Link to={m.to} className="mu-t">{m.k}</Link> : m.k}</span><span className="mtile-ico">{m.icon}</span></div>
                    <div className="big">{m.v}</div>
                    {m.d !== undefined && <div><Delta d={m.d} /> <span className="mu-t">{t("vs previous")} {range} {t("days")}</span></div>}
                    {m.s && <Spark points={m.s} />}
                </div>))}
            </div>
            <div className="dash-main">
                <div className="dash-left">
                    <Card><b>{t("Total sales over time")}</b><LineChart points={now.map((d) => d.sales)} labels={now.map((d) => d.label)} fmt={(n) => money(n, cur)} /></Card>
                    <div className="two">
                        <Card><b>{t("Top products")}</b>{top.size ? <table style={{ marginTop: 8 }}><tbody>{[...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => <tr key={n}><td>{n}</td><td style={{ textAlign: "right" }}>{money(v, cur)}</td></tr>)}</tbody></table> : <p className="mu-t">{t("No paid orders in this period.")}</p>}</Card>
                        <Card><div className="between"><b>{t("Recent orders")}</b><Link to="/admin/orders">{t("View all")}</Link></div>{orders.length ? <table style={{ marginTop: 8 }}><tbody>{[...orders].reverse().slice(0, 5).map((o) => (
                            <tr key={o.id}><td><Link to={`/admin/orders/${o.id}`}>#{o.id}</Link></td><td>{money(tot(o), cur)}</td><td><Badge t={o.pay} /></td></tr>))}</tbody></table> : <p className="mu-t">{t("No orders yet.")}</p>}</Card>
                    </div>
                </div>
                <div className="dash-side">
                    <Card>
                        <div className="between"><b>⚡ {t("Quick actions")}</b></div>
                        <div className="qa-list">
                            <Link to="/admin/products" className="qa-item"><span>📦</span>{t("Add product")}</Link>
                            <Link to="/admin/discounts" className="qa-item"><span>🏷️</span>{t("Create discount")}</Link>
                            <Link to="/admin/orders" className="qa-item"><span>🧾</span>{t("View orders")}{toFulfill > 0 && <b className="qa-badge">{toFulfill}</b>}</Link>
                            <Link to={`/shop?store=${storeId}`} className="qa-item"><span>🔗</span>{t("View store")}</Link>
                            <Link to="/admin/customers" className="qa-item"><span>👥</span>{t("Customers")}</Link>
                        </div>
                    </Card>
                    <Card>
                        <div className="between"><b>🕐 {t("Activity")}</b></div>
                        {activity.length ? (
                            <div className="timeline">
                                {activity.map((a) => (
                                    <Link key={a.id} to={a.to} className="tl-item">
                                        <span className="tl-ico">{a.icon}</span>
                                        <span><b>{a.text}</b><br /><span className="mu-t">{a.sub}</span></span>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="mu-t">{t("No activity yet.")}</p>}
                    </Card>
                </div>
            </div>
        </>
    );
}

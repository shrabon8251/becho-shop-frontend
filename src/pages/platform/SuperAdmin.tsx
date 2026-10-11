import { useEffect, useState } from "react";
import { api } from "../../api";
import { Badge, Card } from "../../components/ui";
import { LineChart } from "../../components/charts";
import { money } from "../../lib/money";
import { useLoad } from "../../lib/useLoad";
import { useAuth } from "../../store/auth";
import type { Announcement, Store, Ticket } from "../../types";
import { Loading, Confirm } from "../../components/polaris";
import { useT } from "../../lib/fx";
import WebsiteEditor from "./WebsiteEditor";
function TicketCard({ t: tk, onDone }: { t: Ticket; onDone(): void }) {
    const tr = useT();
    const [text, setText] = useState("");
    const [err, setErr] = useState("");
    const run = async (fn: () => Promise<unknown>) => { try { await fn(); setErr(""); setText(""); onDone(); } catch (e) { setErr((e as Error).message); } };
    return (
        <div style={{ borderBottom: "1px solid var(--bd)", padding: "8px 0" }}>
            <div className="between"><b>{tk.subject}</b><span className="mu-t">{tk.storeName} · {tk.status}</span></div>
            <p>{tk.message}</p>
            {tk.replies.map((r, i) => <p key={i} className={r.from === "support" ? "ok-t" : ""}><b>{r.from === "support" ? tr("Support") : tr("Merchant")}:</b> {r.text}</p>)}
            <div className="row"><input placeholder={tr("Reply")} aria-label={tr("Reply")} value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn s" onClick={() => run(() => api.platform.tickets.reply(tk.id, text))}>{tr("Reply")}</button>
                <button className="btn s" onClick={() => run(() => api.platform.tickets.setStatus(tk.id, tk.status === "Open" ? "Closed" : "Open"))}>{tk.status === "Open" ? tr("Close") : tr("Reopen")}</button></div>
            {err && <p className="er-t">{err}</p>}
        </div>
    );
}
const DAY = 864e5;
// ---- Platform data normalization (backend contract) ----
// /platform/stores returns plan ids lowercase ("starter"|"growth"|"pro") and may omit
// gmv/createdAt; /platform/plans returns { starter: { monthly, yearly }, ... }.
// Everything is normalized here so a missing field renders ৳0 / 0, never NaN.
const PLAN_IDS = ["starter", "growth", "pro"] as const;
const PLAN_LABEL: Record<string, string> = { starter: "Starter", growth: "Growth", pro: "Pro" };
const planId = (p: unknown): string => {
    const s = String(p ?? "starter").toLowerCase();
    return (PLAN_IDS as readonly string[]).includes(s) ? s : "starter";
};
const numOf = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
function Analytics({ stores }: { stores: Store[] }) {
    // signups per week, last 12 weeks
    const weeks = 12, now = Date.now();
    const pts: number[] = [], labels: string[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const s = now - (i + 1) * 7 * DAY, e = now - i * 7 * DAY;
        pts.push(stores.filter((x) => (x.createdAt || 0) >= s && (x.createdAt || 0) < e).length);
        labels.push(new Date(e).toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    }
    const plans = PLAN_IDS;
    const max = Math.max(1, ...plans.map((p) => stores.filter((s) => planId(s.plan) === p).length));
    return (
        <>
            <Card><b>Store signups — last 12 weeks</b>
                <LineChart points={pts} labels={labels} fmt={(n) => String(n)} /></Card>
            <Card><b>Stores by plan</b>
                {plans.map((p) => { const n = stores.filter((s) => planId(s.plan) === p).length; return (
                    <div key={p} className="between" style={{ margin: "8px 0" }}>
                        <span style={{ width: 70 }}>{PLAN_LABEL[p]}</span>
                        <div style={{ flex: 1, background: "var(--bg)", borderRadius: 4, height: 14, margin: "0 10px" }}>
                            <div style={{ width: `${(n / max) * 100}%`, background: "var(--ac)", height: "100%", borderRadius: 4 }} /></div>
                        <b>{n}</b></div>); })}
                <div className="mu-t">Suspended: {stores.filter((s) => s.status === "Suspended").length} · Trial: {stores.filter((s) => s.status === "Trial").length}</div></Card>
        </>
    );
}
function Announcements({ list, reload }: { list: Announcement[]; reload(): void }) {
    const t = useT();
    const [title, setTitle] = useState(""), [body, setBody] = useState(""), [err, setErr] = useState(""), [del, setDel] = useState<Announcement | null>(null);
    const create = async () => {
        if (!title.trim() || !body.trim()) return setErr(t("Title and message are required"));
        await api.platform.announcements.create({ title: title.trim(), body: body.trim() });
        setTitle(""); setBody(""); setErr(""); reload();
    };
    return (
        <>
            <Card><b>{t("New announcement")}</b>
                <p className="mu-t">{t("Published to every store owner's dashboard.")}</p>
                <input placeholder={t("Title")} aria-label={t("Title")} value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder={t("Message")} aria-label={t("Message")} value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
                <button className="btn" onClick={create}>{t("Publish")}</button>
                {err && <p className="er-t">{err}</p>}</Card>
            {list.map((a) => (
                <Card key={a.id}><div className="between"><div><b>{a.title}</b>
                    <div className="mu-t">{new Date(a.createdAt).toLocaleString()}</div><p>{a.body}</p></div>
                    <button className="btn s" onClick={() => setDel(a)}>Delete</button></div></Card>))}
            {!list.length && <p className="mu-t">{t("No announcements yet.")}</p>}
            {del && <Confirm open title={t("Delete announcement?")} message={`"${del.title}" ${t("will be removed from all dashboards.")}`} confirmLabel={t("Delete")}
                             onClose={() => setDel(null)} onConfirm={async () => { await api.platform.announcements.remove(del.id); setDel(null); reload(); }} />}
        </>
    );
}
type Tab = "overview" | "stores" | "tickets" | "announcements" | "website";
export default function SuperAdmin() {
    const t = useT();
    const { logout } = useAuth();
    useEffect(() => { document.title = `${t("Platform admin")} — Becho`; }, [t]);
    const { data, reload } = useLoad(() => api.stores.list(), []);
    const { data: prices, reload: reloadPrices } = useLoad(() => api.platform.plans.get(), []);
    const { data: tickets, reload: reloadTickets } = useLoad(() => api.platform.tickets.list(), []);
    const { data: anns, reload: reloadAnns } = useLoad(() => api.platform.announcements.list(), []);
    const [tab, setTab] = useState<Tab>("overview");
    const [draft, setDraft] = useState<Record<string, number>>({});
    const [q, setQ] = useState("");
    const [msg, setMsg] = useState("");
    const [delStore, setDelStore] = useState<Store | null>(null);
    if (!data || !prices || !tickets || !anns) return <Loading />;
    const planIds = [...PLAN_IDS];
    const priceOf = (id: string): number => {
        const e: unknown = (prices as Record<string, unknown>)[id];
        return numOf(typeof e === "number" ? e : (e as { monthly?: unknown } | null)?.monthly);
    };
    const active = data.filter((s) => s.status === "Active");
    const mrr = active.reduce((a, s) => a + priceOf(planId(s.plan)), 0);
    const up = async (id: string, patch: Partial<Store>) => { await api.platform.stores.update(id, patch); reload(); };
    const shown = data.filter((s) => (s.name + s.sub).toLowerCase().includes(q.toLowerCase()));
    const savePrices = async () => {
        // Keep the backend's { plan: { monthly, yearly } } shape; only monthly is edited here.
        const base = prices as Record<string, unknown>;
        const next: Record<string, unknown> = { ...base };
        for (const [k, v] of Object.entries(draft)) {
            const cur = base[k];
            next[k] = typeof cur === "number" ? Number(v) : { ...((cur as object) ?? {}), monthly: Number(v) };
        }
        try { await api.platform.plans.save(next); setDraft({}); setMsg("Prices saved. Existing subscribers are charged the new price from their next invoice."); reloadPrices(); } catch (e) { setMsg((e as Error).message); }
    };
    // "Log in as owner" (impersonation) is hidden until the backend implements
    // a real short-lived token — the current /platform/stores/{id}/impersonate
    // endpoint is a stub that returns {id:"impersonated"} with no token.
    // const view = async (id: string) => { try { impersonate(await api.platform.impersonate(id)); } catch (e) { setMsg((e as Error).message); } };
    const stats: [string, string | number][] = [["Stores", data.length], ["Active", active.length], ["On trial", data.filter((s) => s.status === "Trial").length], ["MRR", money(mrr)], ["GMV", money(data.reduce((a, s) => a + numOf(s.gmv), 0))]];
    const tabs: [Tab, string][] = [["overview", t("Overview")], ["stores", `${t("Stores")} (${data.length})`], ["tickets", `${t("Tickets")} (${tickets.filter((x) => x.status === "Open").length} ${t("open")})`], ["announcements", `${t("Announcements")} (${anns.length})`], ["website", t("Website")]];
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
            <h1>{t("Platform admin")}<button className="btn s" onClick={logout}>{t("Log out")}</button></h1>
            <div className="seg" role="tablist" aria-label="Platform sections" style={{ marginBottom: 12 }}>
                {tabs.map(([tb, label]) => <button key={tb} role="tab" aria-selected={tab === tb} className={"btn s" + (tab === tb ? " on" : "")} onClick={() => setTab(tb)}>{label}</button>)}
            </div>
            {tab === "overview" && (
                <>
                    <div className="grid">{stats.map(([k, v]) => <div className="card" key={k}><div className="mu-t">{t(k)}</div><div className="big">{v}</div></div>)}</div>
                    <Analytics stores={data} />
                    <Card><b>{t("Plan prices (per month)")}</b>
                        <div className="row" style={{ marginTop: 8 }}>{planIds.map((p) => <div key={p} style={{ flex: 1 }}><label className="mu-t">{PLAN_LABEL[p]} ({data.filter((s) => planId(s.plan) === p).length} stores)</label>
                            <input type="number" min={0} value={draft[p] ?? priceOf(p)} onChange={(e) => setDraft({ ...draft, [p]: Number(e.target.value) })} /></div>)}
                            <button className="btn" onClick={savePrices}>{t("Save prices")}</button></div>
                        {msg && <p className={msg.startsWith("Prices saved") ? "ok-t" : "er-t"}>{msg}</p>}</Card>
                </>
            )}
            {tab === "stores" && (
                <>
                    <input type="search" placeholder={t("Search stores")} aria-label={t("Search stores")} value={q} onChange={(e) => setQ(e.target.value)} />
                    <Card><table><thead><tr><td>{t("Store")}</td><td>{t("Owner")}</td><td>{t("Plan")}</td><td>{t("Status")}</td><td>{t("GMV")}</td><td /></tr></thead><tbody>{shown.map((s) => (
                        <tr key={s.id}><td>{s.name}<div className="mu-t">{s.sub}.myshop.com</div></td><td>{s.ownerEmail}</td>
                            <td><select value={planId(s.plan)} onChange={(e) => up(s.id, { plan: e.target.value } as Partial<Store>)}>{planIds.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}</select></td>
                            <td><Badge t={s.status} /></td><td>{money(numOf(s.gmv))}</td>
                            <td>{/* <button className="btn s" onClick={() => view(s.id)}>{t("Log in as owner")}</button>{" "} — hidden: impersonation stub */}
                                {s.status === "Suspended" ? <button className="btn s" onClick={() => up(s.id, { status: "Active" })}>Activate</button> : <>
                                    {s.status === "Trial" && <button className="btn s" onClick={() => up(s.id, { status: "Active" })}>{t("Approve")}</button>}{" "}
                                    <button className="btn s" onClick={() => up(s.id, { status: "Suspended" })}>{t("Suspend")}</button></>}{" "}
                                <button className="btn s" onClick={() => setDelStore(s)}>{t("Delete")}</button></td></tr>))}</tbody></table>
                        {!shown.length && <p className="mu-t">{t("No stores found.")}</p>}</Card>
                </>
            )}
            {delStore && <Confirm open title={t("Delete store")} message={`${t("Delete")} ${delStore.name}? ${t("This cannot be undone.")}`} confirmLabel={t("Delete")} onConfirm={async () => { await api.platform.stores.remove(delStore.id); setDelStore(null); reload(); }} onClose={() => setDelStore(null)} />}
            {tab === "tickets" && (
                <Card><b>{t("Support tickets")} ({tickets.filter((x) => x.status === "Open").length} {t("open")})</b>
                    {tickets.map((t) => <TicketCard key={t.id + t.replies.length + t.status} t={t} onDone={reloadTickets} />)}
                    {!tickets.length && <p className="mu-t">{t("No tickets.")}</p>}</Card>
            )}
            {tab === "announcements" && <Announcements list={anns} reload={reloadAnns} />}
            {tab === "website" && <WebsiteEditor />}
        </div>
    );
}

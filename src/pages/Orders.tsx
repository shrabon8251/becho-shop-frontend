import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import CreateOrderPage from "../components/CreateOrderPage";
import DraftOrderForm from "../components/DraftOrderForm";
import { Confirm, EmptyState, IndexTable, Loading, Page, toast } from "../components/polaris";
import { Badge } from "../components/ui";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { orderTotal, priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { Customer, Discount, DraftOrder, Order, OrderReturn, Product, Settings } from "../types";

type Ctx = { storeId: string; customers: Customer[]; products: Product[]; settings: Settings; discounts: Discount[]; reload(): void };

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const PAGE_SIZE = 20;

function OrdersTab({ ctx }: { ctx: Ctx }) {
    const t = useT();
    const nav = useNavigate();
    const prices = priceMap(ctx.products);
    const name = (id: string) => ctx.customers.find((c) => c.id === id)?.name ?? (id === "walkin" ? t("Walk-in") : "-");
    const [range, setRange] = useState(7);
    const [tab, setTab] = useState<"all" | "unf" | "unp" | "ful">("all");
    const [sort, setSort] = useState("newest");
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [payF, setPayF] = useState("");
    const [fulF, setFulF] = useState("");
    const [page, setPage] = useState(0);
    const [sel, setSel] = useState<Set<number>>(new Set());
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterPinned, setFilterPinned] = useState(false);

    useEffect(() => { const id = setTimeout(() => setDebouncedQ(q), 300); return () => clearTimeout(id); }, [q]);
    useEffect(() => { setPage(0); setSel(new Set()); }, [range, tab, sort, debouncedQ, payF, fulF]);

    // Server-side page (20 rows) + exact counts — the browser never loads all orders.
    const { data: pageData, reload: reloadPage } = useLoad(() => api.orders.listPage(ctx.storeId, {
        page, size: PAGE_SIZE, tab: tab === "all" ? undefined : tab,
        pay: payF || undefined, ful: fulF || undefined, range,
        q: debouncedQ.trim() || undefined, sort,
    }), [ctx.storeId, page, sort, tab, debouncedQ, range, payF, fulF]);
    const { data: counts, reload: reloadCounts } = useLoad(() => api.orders.counts(ctx.storeId, range), [ctx.storeId, range]);
    const reloadAll = () => { reloadPage(); reloadCounts(); };

    const stats = counts ?? { total: 0, unfulfilled: 0, unpaid: 0, totalSales: 0 };
    const pageItems = useMemo(() => pageData?.items ?? [], [pageData]);
    const total = pageData?.total ?? 0;
    const activeFilters = (payF ? 1 : 0) + (fulF ? 1 : 0);

    const act = async (id: number, patch: Partial<Order>, text: string) => { await api.orders.update(ctx.storeId, id, patch, text); toast(t(text)); reloadAll(); };
    const bulk = async (patch: Partial<Order>, text: string) => {
        await Promise.all([...sel].map((id) => api.orders.update(ctx.storeId, id, patch, text)));
        toast(`${sel.size} ${t(text)}`); setSel(new Set()); reloadAll();
    };
    const toggleSel = (id: number) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const exportCsv = () => {
        // Exports the loaded page only — same as the Products page.
        const rows = [["Order", "Date", "Customer", "Payment", "Fulfillment", "Total"],
            ...pageItems.map((o) => [String(o.id), fmtDate(o.createdAt), name(o.customerId), o.pay, o.ful, String(o.total ?? orderTotal(o, prices))])];
        const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "orders.csv"; a.click(); URL.revokeObjectURL(a.href);
    };

    const statCards: { label: string; value: string; onClick: () => void }[] = [
        { label: t("Total orders"), value: String(stats.total), onClick: () => setTab("all") },
        { label: t("Unfulfilled"), value: String(stats.unfulfilled), onClick: () => setTab("unf") },
        { label: t("Unpaid"), value: String(stats.unpaid), onClick: () => setTab("unp") },
        { label: t("Total sales"), value: money(stats.totalSales, ctx.settings.currency), onClick: () => setTab("all") },
    ];

    if (!pageData || !counts) return <Loading />;

    return (
        <>
            <div className="ord-strip" role="group" aria-label={t("Order summary")}>
                {statCards.map((s) => (
                    <button key={s.label} type="button" className="ord-stat" onClick={s.onClick}>
                        <span className="ord-stat-l">{s.label}</span>
                        <span className="ord-stat-v">{s.value}</span>
                    </button>))}
            </div>

            <div className="prod-toolbar">
                <select className="sort-sel" aria-label={t("Date range")} value={range} onChange={(e) => setRange(+e.target.value)}>
                    <option value={7}>{t("Last 7 days")}</option>
                    <option value={30}>{t("Last 30 days")}</option>
                    <option value={90}>{t("Last 90 days")}</option>
                </select>
                <select className="sort-sel" aria-label={t("Sort by")} value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="newest">{t("Sort by")}: {t("Newest")}</option>
                    <option value="oldest">{t("Sort by")}: {t("Oldest")}</option>
                    <option value="total-desc">{t("Sort by")}: {t("Total high to low")}</option>
                    <option value="total-asc">{t("Sort by")}: {t("Total low to high")}</option>
                </select>
                <div className="filter-wrap"
                     onMouseEnter={() => setFilterOpen(true)}
                     onMouseLeave={() => { if (!filterPinned) setFilterOpen(false); }}>
                    <button type="button" className="btn" onClick={() => { setFilterPinned((p) => !p); setFilterOpen((o) => !o); }}>
                        ⌕ {t("Filters")}{activeFilters > 0 && <span className="fcount">{activeFilters}</span>}
                    </button>
                    {filterOpen && (
                        <div className="filter-pop">
                            <div className="filter-pop-h"><b>{t("Filters")}</b>
                                <button type="button" className="btn s" onClick={() => { setPayF(""); setFulF(""); }}>✕</button></div>
                            <b className="mu-t">{t("Payment")}</b>
                            <div className="row" style={{ flexWrap: "wrap", gap: 6, margin: "6px 0 12px" }}>
                                {([["", t("All")], ["paid", t("Paid")], ["pending", t("Pending")], ["refunded", t("Refunded")], ["cancelled", t("Cancelled")]] as const).map(([v, label]) => (
                                    <button key={v || "all"} type="button" className={"btn s" + (payF === v ? " on" : "")}
                                            onClick={() => setPayF(payF === v ? "" : v)}>{label}</button>))}
                            </div>
                            <b className="mu-t">{t("Fulfillment")}</b>
                            <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                {([["", t("All")], ["unfulfilled", t("Unfulfilled")], ["fulfilled", t("Fulfilled")], ["cancelled", t("Cancelled")]] as const).map(([v, label]) => (
                                    <button key={v || "all"} type="button" className={"btn s" + (fulF === v ? " on" : "")}
                                            onClick={() => setFulF(fulF === v ? "" : v)}>{label}</button>))}
                            </div>
                        </div>)}
                </div>
                <div className="seg" role="tablist" aria-label={t("Order status")}>
                    {(["all", "unf", "unp", "ful"] as const).map((k) => (
                        <button key={k} role="tab" aria-selected={tab === k} className={"btn s" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
                            {k === "all" ? t("All") : k === "unf" ? t("Unfulfilled") : k === "unp" ? t("Unpaid") : t("Fulfilled")}</button>))}
                </div>
                <input className="tsearch" type="search" placeholder={t("Search orders")} value={q} onChange={(e) => setQ(e.target.value)} />
                <button type="button" className="btn" onClick={exportCsv}>⇩ {t("Export")}</button>
            </div>

            {sel.size > 0 && (
                <div className="bulkbar">
                    <b>{sel.size} {t("selected")}</b>
                    <button type="button" className="btn s" onClick={() => void bulk({ pay: "Paid" }, "Marked as paid")}>{t("Mark paid")}</button>
                    <button type="button" className="btn s" onClick={() => void bulk({ ful: "Fulfilled" }, "Marked as fulfilled")}>{t("Fulfill")}</button>
                    <button type="button" className="btn s" onClick={() => setSel(new Set())}>✕</button>
                </div>)}

            {pageItems.length === 0
                ? <EmptyState art="📦" title={t("No orders")} text={t("Orders from your store will show up here.")} />
                : <div className="card itable">
                    <table>
                        <thead><tr>
                            <th><input type="checkbox" aria-label={t("Select all")} checked={pageItems.length > 0 && pageItems.every((o) => sel.has(o.id))}
                                       onChange={(e) => setSel(e.target.checked ? new Set(pageItems.map((o) => o.id)) : new Set())} /></th>
                            <th>{t("Order")}</th><th>{t("Date")}</th><th>{t("Customer")}</th>
                            <th>{t("Payment")}</th><th>{t("Fulfillment")}</th>
                            <th style={{ textAlign: "right" }}>{t("Total")}</th><th style={{ textAlign: "right" }}>{t("Actions")}</th>
                        </tr></thead>
                        <tbody>
                        {pageItems.map((o) => (
                            <tr key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} style={{ cursor: "pointer" }}>
                                <td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`${t("Select order")} #${o.id}`} checked={sel.has(o.id)} onChange={() => toggleSel(o.id)} /></td>
                                <td><b>#{o.id}</b></td>
                                <td className="mu-t">{fmtDate(o.createdAt)}</td>
                                <td>{name(o.customerId)}</td>
                                <td><Badge t={o.pay} /></td>
                                <td><Badge t={o.ful} /></td>
                                <td style={{ textAlign: "right" }}>{money(o.total ?? orderTotal(o, prices))}</td>
                                <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                        <span className="acts" style={{ justifyContent: "flex-end" }}>
                                            {o.pay === "Pending" && <button className="btn s" onClick={() => void act(o.id, { pay: "Paid" }, "Marked as paid")}>{t("Mark paid")}</button>}
                                            {o.ful === "Unfulfilled" && o.pay !== "Cancelled" && <button className="btn s" onClick={() => void act(o.id, { ful: "Fulfilled" }, "Marked as fulfilled")}>{t("Fulfill")}</button>}
                                            <Link to={`/admin/orders/${o.id}`} className="btn s">{t("View")}</Link>
                                        </span>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                    <div className="pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px" }}>
                        <span className="mu-t">{total === 0 ? "0" : `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)}`} {t("of")} {total}</span>
                        <span className="row" style={{ gap: 8 }}>
                            <button type="button" className="btn s" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹ {t("Prev")}</button>
                            <button type="button" className="btn s" disabled={!pageData.hasMore} onClick={() => setPage((p) => p + 1)}>{t("Next")} ›</button>
                        </span>
                    </div>
                </div>}
        </>
    );
}

function DraftsTab({ drafts, ctx, onEdit }: { drafts: DraftOrder[]; ctx: Ctx; onEdit(d: DraftOrder): void }) {
    const t = useT();
    const [confirmDel, setConfirmDel] = useState<DraftOrder | null>(null);
    const prices = priceMap(ctx.products);
    const name = (id?: string) => !id ? t("Walk-in") : ctx.customers.find((c) => c.id === id)?.name ?? "-";
    const complete = async (d: DraftOrder) => {
        try { const o = await api.draftOrders.complete(ctx.storeId, d.id); toast(`${t("Order")} #${o.id} ${t("created")}`); ctx.reload(); }
        catch (e) { toast((e as Error).message, true); }
    };
    return (
        <>
            <div style={{ marginBottom: 12 }}>
                <button className="btn" onClick={() => onEdit({ id: crypto.randomUUID(), items: [], status: "Open", createdAt: Date.now() })}>{t("Create draft order")}</button>
            </div>
            <IndexTable items={[...drafts].reverse()} id={(d) => d.id} onRow={onEdit}
                        search={(d) => name(d.customerId)} searchPlaceholder={t("Search drafts")}
                        empty={<EmptyState art="📝" title={t("No draft orders")} text={t("Drafts let you take phone or in-person orders.")} />}
                        cols={[
                            { h: t("Draft"), cell: (d) => <b>#{d.id.slice(0, 8)}</b> },
                            { h: t("Customer"), cell: (d) => name(d.customerId) },
                            { h: t("Items"), right: true, cell: (d) => d.items.reduce((a, i) => a + i.qty, 0) },
                            { h: t("Total"), right: true, cell: (d) => money(calc(d.items, prices, d.zoneId, d.code, ctx.settings, ctx.discounts, taxOpts(ctx.products)).total, ctx.settings.currency) },
                            { h: t("Status"), cell: (d) => <Badge t={d.status} /> },
                            { h: "", right: true, cell: (d) => (
                                    <span className="acts" style={{ justifyContent: "flex-end" }}>
              <button className="btn s" onClick={() => void complete(d)}>{t("Complete")}</button>
              <button className="btn s" onClick={() => setConfirmDel(d)}>{t("Delete")}</button>
            </span>) },
                        ]} />
            <Confirm open={!!confirmDel} title={t("Delete this draft order?")} message={t("This cannot be undone.")}
                     onClose={() => setConfirmDel(null)}
                     onConfirm={() => { if (confirmDel) return api.draftOrders.remove(ctx.storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Draft deleted")); ctx.reload(); }); }} />
        </>
    );
}

function ReturnsTab({ returns, ctx }: { returns: OrderReturn[]; ctx: Ctx }) {
    const t = useT();
    const vlabel = (variantId: string) => {
        const e = ctx.products.flatMap((p) => p.variants.map((v) => ({ p, v }))).find((x) => x.v.id === variantId);
        return e ? `${e.p.title} — ${e.v.name}` : variantId;
    };
    const setStatus = async (r: OrderReturn, status: OrderReturn["status"]) => {
        try { await api.returns.setStatus(ctx.storeId, r.id, status); toast(`${t("Return")} ${status.toLowerCase()}`); ctx.reload(); }
        catch (e) { toast((e as Error).message, true); }
    };
    return (
        <IndexTable items={returns} id={(r) => r.id} pageSize={15}
                    tabs={[{ id: "all", label: t("All") }, { id: "req", label: t("Requested") }, { id: "app", label: t("Approved") }, { id: "done", label: t("Completed") }]}
                    filter={(r, t) => t === "all" || (t === "req" && r.status === "Requested") || (t === "app" && r.status === "Approved") || (t === "done" && r.status === "Completed")}
                    empty={<EmptyState art="↩️" title={t("No returns")} text={t("Return requests from the order page will show up here.")} />}
                    cols={[
                        { h: t("Order"), cell: (r) => <Link to={`/admin/orders/${r.orderId}`}><b>#{r.orderId}</b></Link> },
                        { h: t("Items"), cell: (r) => r.items.map((i) => `${i.qty} × ${vlabel(i.variantId)}${i.reason ? ` (${i.reason})` : ""}`).join(", ") },
                        { h: t("Refund"), right: true, cell: (r) => r.refundAmount > 0 ? money(r.refundAmount, ctx.settings.currency) : <span className="mu-t">—</span> },
                        { h: t("Status"), cell: (r) => <Badge t={r.status} /> },
                        { h: "", right: true, cell: (r) => (
                                <span className="acts" style={{ justifyContent: "flex-end" }}>
            {r.status === "Requested" && <><button className="btn s" onClick={() => void setStatus(r, "Approved")}>{t("Approve")}</button><button className="btn s" onClick={() => void setStatus(r, "Declined")}>{t("Decline")}</button></>}
                                    {r.status === "Approved" && <button className="btn s" onClick={() => void setStatus(r, "Completed")}>{t("Complete return")}</button>}
          </span>) },
                    ]} />
    );
}

export default function Orders() {
    const t = useT();
    const nav = useNavigate();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, reload } = useLoad(() => Promise.all([
        api.orders.counts(storeId), api.customers.list(storeId), api.products.list(storeId),
        api.settings.get(storeId), api.discounts.list(storeId), api.draftOrders.list(storeId), api.returns.list(storeId),
    ]), [storeId]);
    const [tab, setTab] = useState<"orders" | "drafts" | "returns">("orders");
    const [editDraft, setEditDraft] = useState<DraftOrder | null>(null);
    const [creating, setCreating] = useState(false);
    if (!data) return <Loading />;
    const [orderCounts, customers, products, settings, discounts, drafts, returns] = data;
    const ctx: Ctx = { storeId, customers, products, settings, discounts, reload };
    const saveDraft = async (d: DraftOrder) => { await api.draftOrders.save(storeId, d); setEditDraft(null); toast(t("Draft saved")); reload(); };
    // BUG-33 fix: the draft-order product picker searched a list loaded when the page
    // mounted — products created afterwards were invisible. Reload on open so the
    // picker always searches fresh data.
    const openDraft = (d: DraftOrder | null) => { reload(); setEditDraft(d); };
    if (creating) return <CreateOrderPage storeId={storeId} customers={customers} products={products} settings={settings} discounts={discounts}
                                          onBack={() => setCreating(false)}
                                          onDone={(o) => { setCreating(false); toast(`${t("Order")} #${o.id} ${t("created")}`); reload(); nav(`/admin/orders/${o.id}`); }} />;
    if (editDraft) return <DraftOrderForm initial={editDraft} customers={customers} products={products} settings={settings} discounts={discounts} onSave={(d) => void saveDraft(d)} onBack={() => setEditDraft(null)} />;
    return (
        <Page title={t("Orders")}
              actions={<div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <div className="seg" role="tablist" aria-label={t("Order sections")}>
                      {(["orders", "drafts", "returns"] as const).map((k) => (
                          <button key={k} role="tab" aria-selected={tab === k} className={"btn s" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
                              {k === "orders" ? `${t("Orders")} (${orderCounts.total})` : k === "drafts" ? `${t("Drafts")} (${drafts.length})` : `${t("Returns")} (${returns.filter((r) => r.status === "Requested").length})`}</button>))}
                  </div>
                  {tab === "orders" && <button className="btn" onClick={() => setCreating(true)}>+ {t("Create order")}</button>}
              </div>}>
            {tab === "orders" && <OrdersTab ctx={ctx} />}
            {tab === "drafts" && <DraftsTab drafts={drafts} ctx={ctx} onEdit={openDraft} />}
            {tab === "returns" && <ReturnsTab returns={returns} ctx={ctx} />}
        </Page>
    );
}

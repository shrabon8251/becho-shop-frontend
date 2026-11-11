import { useMemo, useState } from "react";
import { api } from "../api";
import { ProductTools } from "../components/ProductTools";
import ProductForm from "../components/ProductForm";
import { Confirm, EmptyState, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { money } from "../lib/money";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Product } from "../types";

/**
 * Products page — mockup v4-uniform (confirmed 2026-11-11).
 * - 4 slim summary cards on top (Total / Active / Draft / Low stock) — clickable,
 *   they set the matching filter. Counts come from GET /products/counts so they
 *   are exact even when the store has more than the 100-row list page.
 * - Toolbar: Sort by, Filters button (hover opens, click pins it open), status
 *   tabs, search, List/Grid toggle. All colours are theme variables only
 *   (premium-theme.css) — changing the admin theme recolours this page too.
 *   The left sidebar is untouched; it is the same on every admin page.
 * - Sort / search / filters run on the loaded list (first 100 products,
 *   newest first) — same as the old IndexTable behaviour. Server-side
 *   search/pagination is Phase 2 work.
 * - Collection filter is intentionally NOT here: the backend has no
 *   product↔collection link (StoreProductController always returns
 *   collectionId ""), so a Collection filter could never match anything.
 */
type ViewMode = "list" | "grid";
type SortKey = "newest" | "price-asc" | "price-desc" | "title";
type StockKind = "in" | "low" | "out";

const PAGE_SIZE = 20;
const ALL_STATUS = new Set<"Active" | "Draft">(["Active", "Draft"]);

const stockOf = (p: Product) => p.variants.reduce((a, v) => a + (Number(v.stock) || 0), 0);
const stockKind = (p: Product): StockKind => {
    const s = stockOf(p);
    return s === 0 ? "out" : s < 5 ? "low" : "in";
};
const minPrice = (p: Product) => (p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0);
const thumb = (p: Product) => p.images[0] ?? p.photo ?? "";

export default function Products() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, reload } = useLoad(() => api.products.list(storeId), [storeId]);
    const { data: cols } = useLoad(() => api.collections.list(storeId), [storeId]);
    const { data: countsData, reload: reloadCounts } = useLoad(() => api.products.counts(storeId), [storeId]);
    const [edit, setEdit] = useState<Product | null>(null);
    const [confirmDel, setConfirmDel] = useState<{ ids: string[]; done: () => void } | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [view, setView] = useState<ViewMode>(() => (localStorage.getItem("products-view") === "grid" ? "grid" : "list"));
    const [sort, setSort] = useState<SortKey>("newest");
    const [q, setQ] = useState("");
    const [statusSel, setStatusSel] = useState<Set<"Active" | "Draft">>(new Set(ALL_STATUS));
    const [stockSel, setStockSel] = useState<Set<StockKind>>(new Set());
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterPinned, setFilterPinned] = useState(false);
    const [sel, setSel] = useState<string[]>([]);
    const [page, setPage] = useState(0);

    const reloadAll = () => { reload(); reloadCounts(); };

    // Hooks must run before any early return. counts falls back to the loaded
    // list until GET /products/counts answers (e.g. backend not restarted yet).
    const counts = countsData ?? (data ? {
        total: data.length,
        active: data.filter((p) => p.status === "Active").length,
        draft: data.filter((p) => p.status === "Draft").length,
        lowStock: data.filter((p) => stockKind(p) === "low").length,
    } : { total: 0, active: 0, draft: 0, lowStock: 0 });

    const rows = useMemo(() => {
        if (!data) return [];
        const query = q.trim().toLowerCase();
        const filtered = data.filter((p) => {
            if (statusSel.size === 1 && !statusSel.has(p.status)) return false;
            if (stockSel.size > 0 && !stockSel.has(stockKind(p))) return false;
            if (query && !p.title.toLowerCase().includes(query)) return false;
            return true;
        });
        const sorted = [...filtered];
        if (sort === "price-asc") sorted.sort((a, b) => minPrice(a) - minPrice(b));
        else if (sort === "price-desc") sorted.sort((a, b) => minPrice(b) - minPrice(a));
        else if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
        return sorted; // "newest" keeps the backend order (newest first)
    }, [data, q, sort, statusSel, stockSel]);

    if (!data || !cols) return <Loading />;

    const bulk = async (ids: string[], done: () => void, fn: (p: Product) => Promise<unknown>) => { await Promise.all(data.filter((p) => ids.includes(p.id)).map(fn)); done(); setSel([]); toast(t(`${ids.length} product(s) updated`)); reloadAll(); };
    // New products go through POST create (backend assigns the numeric id);
    // existing ones through PUT save. Never PUT a client-generated UUID id —
    // the real backend rejects it with 400 (@PathVariable Long id).
    // BUG-45 fix: try/catch with error toast — no more silent failures.
    const save = async (p: Product) => {
        try {
            await (isNew ? api.products.create(storeId, p) : api.products.save(storeId, p));
            setEdit(null); setIsNew(false); toast(t("Product saved")); reloadAll();
        } catch (e) {
            toast(t("Failed to save product") + ": " + (e as Error).message, true);
        }
    };
    if (edit) return <ProductForm initial={edit} collections={cols} storeId={storeId} isNew={isNew} onSave={(p) => void save(p)} onBack={() => { setEdit(null); setIsNew(false); }} />;
    const add = () => { setIsNew(true); setEdit({ id: crypto.randomUUID(), title: "New product", status: "Draft", collectionId: "", images: [], variants: [{ id: crypto.randomUUID(), name: "Default", price: 0, sku: "", stock: 0 }] }); };
    const addBtn = <button className="btn" onClick={add}>{t("Add product")}</button>;

    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const p = Math.min(page, pages - 1);
    const shown = rows.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
    const pageIds = shown.map((x) => x.id);
    const allChecked = pageIds.length > 0 && pageIds.every((i) => sel.includes(i));
    const toggleSel = (id: string, on: boolean) => setSel(on ? [...sel, id] : sel.filter((x) => x !== id));
    const resetPage = () => { setPage(0); setSel([]); };

    const tab: "all" | "Active" | "Draft" = statusSel.size === 1 ? [...statusSel][0] : "all";
    const setTab = (tb: "all" | "Active" | "Draft") => { setStatusSel(tb === "all" ? new Set(ALL_STATUS) : new Set([tb])); resetPage(); };
    const toggleStatus = (s: "Active" | "Draft") => setStatusSel((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next; });
    const toggleStock = (s: StockKind) => setStockSel((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next; });
    const activeFilters = (statusSel.size === 1 ? 1 : 0) + stockSel.size;
    const clearFilters = () => { setStatusSel(new Set(ALL_STATUS)); setStockSel(new Set()); setQ(""); resetPage(); };
    const changeView = (v: ViewMode) => { setView(v); localStorage.setItem("products-view", v); };

    const cards = [
        { key: "total", label: t("Total products"), value: counts.total, icon: "▤", onClick: () => { setStatusSel(new Set(ALL_STATUS)); setStockSel(new Set()); resetPage(); } },
        { key: "active", label: t("Active"), value: counts.active, icon: "✓", onClick: () => { setTab("Active"); setStockSel(new Set()); } },
        { key: "draft", label: t("Draft"), value: counts.draft, icon: "▦", onClick: () => { setTab("Draft"); setStockSel(new Set()); } },
        { key: "low", label: t("Low stock"), value: counts.lowStock, icon: "⚠", onClick: () => { setStatusSel(new Set(ALL_STATUS)); setStockSel(new Set(["low"])); resetPage(); } },
    ];

    const bulkActions = (ids: string[], done: () => void) => (<>
        <button className="btn s" onClick={() => void bulk(ids, done, (p) => api.products.save(storeId, { ...p, status: "Active" }))}>{t("Set Active")}</button>
        <button className="btn s" onClick={() => void bulk(ids, done, (p) => api.products.save(storeId, { ...p, status: "Draft" }))}>{t("Set Draft")}</button>
        <button className="btn s" onClick={() => setConfirmDel({ ids, done })}>{t("Delete")}</button></>);

    return (
        <Page title={t("Products")} actions={addBtn}>
            <div className="prod-stats">
                {cards.map((c) => (
                    <button key={c.key} type="button" className="stat-card" onClick={c.onClick} title={c.label}>
                        <span className="stat-ico" aria-hidden>{c.icon}</span>
                        <span className="stat-tx"><span className="stat-label">{c.label}</span><span className="stat-num">{c.value}</span></span>
                    </button>
                ))}
            </div>

            <div className="prod-toolbar">
                <select className="sort-sel" aria-label={t("Sort by")} value={sort} onChange={(e) => { setSort(e.target.value as SortKey); resetPage(); }}>
                    <option value="newest">{t("Sort by: Newest")}</option>
                    <option value="price-asc">{t("Sort by: Price, low to high")}</option>
                    <option value="price-desc">{t("Sort by: Price, high to low")}</option>
                    <option value="title">{t("Sort by: Name, A to Z")}</option>
                </select>
                <div className="filter-wrap"
                     onMouseEnter={() => setFilterOpen(true)}
                     onMouseLeave={() => { if (!filterPinned) setFilterOpen(false); }}>
                    <button type="button" className="btn s" aria-expanded={filterOpen}
                            onClick={() => { const next = !filterPinned; setFilterPinned(next); setFilterOpen(next); }}>
                        ⏷ {t("Filters")}{activeFilters > 0 ? <span className="fcount">{activeFilters}</span> : null}
                    </button>
                    {filterOpen && (
                        <div className="filter-pop card" role="dialog" aria-label={t("Filters")}>
                            <div className="filter-pop-h"><b>⏷ {t("Filters")}</b><button type="button" className="btn s ico" aria-label={t("Close")} onClick={() => { setFilterPinned(false); setFilterOpen(false); }}>✕</button></div>
                            <div className="filter-sec"><div className="filter-sec-t">{t("Status")}</div>
                                {(["Active", "Draft"] as const).map((s) => (
                                    <label key={s} className="filter-opt"><input type="checkbox" checked={statusSel.has(s)} onChange={() => toggleStatus(s)} /> {t(s)}</label>
                                ))}
                            </div>
                            <div className="filter-sec"><div className="filter-sec-t">{t("Stock")}</div>
                                {(["in", "low", "out"] as const).map((s) => (
                                    <label key={s} className="filter-opt"><input type="checkbox" checked={stockSel.has(s)} onChange={() => toggleStock(s)} /> {t(s === "in" ? "In stock" : s === "low" ? "Low stock" : "Out of stock")}</label>
                                ))}
                            </div>
                            <button type="button" className="btn s" onClick={clearFilters}>{t("Clear all filters")}</button>
                        </div>
                    )}
                </div>
                <div className="tabs" role="tablist">
                    {(["all", "Active", "Draft"] as const).map((tb) => (
                        <button key={tb} type="button" role="tab" aria-selected={tab === tb} className={"tab" + (tab === tb ? " on" : "")}
                                onClick={() => setTab(tb)}>{t(tb === "all" ? "All" : tb)}</button>
                    ))}
                </div>
                <input className="tsearch" type="search" aria-label={t("Search products")} placeholder={t("Search products")}
                       value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} />
                <div className="view-toggle" role="group" aria-label={t("View")}>
                    <button type="button" className={"vt-btn" + (view === "list" ? " on" : "")} aria-pressed={view === "list"} onClick={() => changeView("list")}>☰ {t("List")}</button>
                    <button type="button" className={"vt-btn" + (view === "grid" ? " on" : "")} aria-pressed={view === "grid"} onClick={() => changeView("grid")}>▦ {t("Grid")}</button>
                </div>
            </div>

            <ProductTools products={data} storeId={storeId} reload={reloadAll} />

            {sel.length > 0 && (
                <div className="bulkbar card"><span>{sel.length} {t("selected")}</span>{bulkActions(sel, () => setSel([]))}</div>
            )}

            {rows.length === 0 ? (
                <EmptyState art="🏷️" title={t("Add your first product")} text={t("Products you add will show up here.")} action={addBtn} />
            ) : view === "list" ? (
                <div className="card itable">
                    <table>
                        <thead><tr>
                            <th style={{ width: 40 }}><input type="checkbox" aria-label={t("Select all")} checked={allChecked} onChange={(e) => setSel(e.target.checked ? pageIds : [])} /></th>
                            <th>{t("Product")}</th><th>{t("Status")}</th><th>{t("Inventory")}</th><th>{t("Variants")}</th><th style={{ textAlign: "right" }}>{t("Price")}</th>
                        </tr></thead>
                        <tbody>{shown.map((p) => {
                            const stock = stockOf(p);
                            return (
                                <tr key={p.id} className="click" tabIndex={0} onClick={(e) => !(e.target as HTMLElement).closest("button,a,input,select") && setEdit(p)}
                                    onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && setEdit(p)}>
                                    <td><input type="checkbox" aria-label={t("Select row")} checked={sel.includes(p.id)} onChange={(e) => toggleSel(p.id, e.target.checked)} /></td>
                                    <td><div className="prod">{thumb(p) ? <img className="tn" src={thumb(p)} alt="" /> : <span className="tn ph0" />}{p.title}</div></td>
                                    <td><Badge t={p.status} /></td>
                                    <td><span className={stockKind(p) === "low" || stockKind(p) === "out" ? "stock-low" : "stock-ok"}>{stock} {t("in stock")}</span></td>
                                    <td>{p.variants.length}</td>
                                    <td style={{ textAlign: "right" }}>{t("from")} {money(minPrice(p))}</td>
                                </tr>
                            );
                        })}</tbody>
                    </table>
                    {rows.length > PAGE_SIZE && (
                        <div className="pager"><span className="mu-t">{p * PAGE_SIZE + 1}–{Math.min((p + 1) * PAGE_SIZE, rows.length)} of {rows.length}</span>
                            <button className="btn s" disabled={p === 0} aria-label={t("Previous page")} onClick={() => setPage(p - 1)}>←</button>
                            <button className="btn s" disabled={p >= pages - 1} aria-label={t("Next page")} onClick={() => setPage(p + 1)}>→</button></div>
                    )}
                </div>
            ) : (
                <div className="prod-grid">
                    {shown.map((p) => {
                        const stock = stockOf(p);
                        return (
                            <div key={p.id} className={"prod-card card" + (sel.includes(p.id) ? " sel" : "")} role="button" tabIndex={0}
                                 onClick={(e) => !(e.target as HTMLElement).closest("button,a,input,select") && setEdit(p)}
                                 onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && setEdit(p)}>
                                <input className="prod-card-check" type="checkbox" aria-label={t("Select row")} checked={sel.includes(p.id)} onChange={(e) => toggleSel(p.id, e.target.checked)} />
                                {thumb(p) ? <img className="prod-thumb" src={thumb(p)} alt="" /> : <div className="prod-thumb ph">🏷️</div>}
                                <div className="prod-card-t">{p.title}</div>
                                <div className="prod-card-r"><Badge t={p.status} /><span className={stockKind(p) === "low" || stockKind(p) === "out" ? "stock-low" : "stock-ok"}>{stock} {t("in stock")}</span></div>
                                <div className="prod-card-p">{t("from")} {money(minPrice(p))}</div>
                            </div>
                        );
                    })}
                </div>
            )}
            {view === "grid" && rows.length > PAGE_SIZE && (
                <div className="pager card"><span className="mu-t">{p * PAGE_SIZE + 1}–{Math.min((p + 1) * PAGE_SIZE, rows.length)} of {rows.length}</span>
                    <button className="btn s" disabled={p === 0} aria-label={t("Previous page")} onClick={() => setPage(p - 1)}>←</button>
                    <button className="btn s" disabled={p >= pages - 1} aria-label={t("Next page")} onClick={() => setPage(p + 1)}>→</button></div>
            )}
            <Confirm open={!!confirmDel} title={t(`Delete ${confirmDel?.ids.length} product(s)?`)} message={t("This cannot be undone.")}
                     onClose={() => setConfirmDel(null)}
                     onConfirm={() => { if (confirmDel) return bulk(confirmDel.ids, confirmDel.done, (p) => api.products.remove(storeId, p.id)).then(() => setConfirmDel(null)); }} />
        </Page>
    );
}

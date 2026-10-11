import { useState } from "react";
import { api } from "../api";
import { Confirm, EmptyState, Modal, PageHeader, toast, Loading } from "../components/polaris";
import { Badge, Card } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useFx, useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { Bundle, BundleItem, Product } from "../types";

function BundleForm({ initial, products, onClose, onSave }: {
    initial: Bundle; products: Product[]; onClose(): void; onSave(b: Bundle): void;
}) {
    const t = useT();
    const [f, setF] = useState(initial);
    const addItem = () => {
        const p = products[0];
        if (!p) return;
        setF({ ...f, items: [...f.items, { productId: p.id, variantId: p.variants[0]?.id, qty: 1 }] });
    };
    const setItem = (i: number, patch: Partial<BundleItem>) => {
        const items = f.items.map((x, j) => (j === i ? { ...x, ...patch } : x));
        setF({ ...f, items });
    };
    const ok = f.name.trim().length > 0 && f.items.length > 0 && f.price > 0;
    return (
        <Modal open wide title={initial.id ? t("Edit bundle") : t("New bundle")} onClose={onClose}
               footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" disabled={!ok} onClick={() => onSave(f)}>{t("Save")}</button></>}>
            <label><b>{t("Name")}</b><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("e.g. Summer starter kit")} /></label>
            <label><span className="mu-t">{t("Image URL")}</span><input value={f.image ?? ""} onChange={(e) => setF({ ...f, image: e.target.value || undefined })} placeholder="https://…" /></label>
            <div className="row">
                <label><b>{t("Bundle price")}</b><input type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Math.max(0, +e.target.value || 0) })} /></label>
                <label className="check" style={{ alignSelf: "end" }}><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> {t("Active")}</label>
            </div>
            <b>{t("Items")}</b>
            {f.items.map((it, i) => {
                const p = products.find((x) => x.id === it.productId);
                return (
                    <div className="row" key={i} style={{ alignItems: "end" }}>
                        <label style={{ flex: 2 }}>{t("Product")}
                            <select value={it.productId} onChange={(e) => { const np = products.find((x) => x.id === e.target.value); setItem(i, { productId: e.target.value, variantId: np?.variants[0]?.id }); }}>
                                {products.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                            </select></label>
                        {p && p.variants.length > 1 && (
                            <label style={{ flex: 2 }}>{t("Variant")}
                                <select value={it.variantId ?? ""} onChange={(e) => setItem(i, { variantId: e.target.value })}>
                                    {p.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select></label>)}
                        <label style={{ flex: 1 }}>{t("Qty")}
                            <input type="number" min={1} value={it.qty} onChange={(e) => setItem(i, { qty: Math.max(1, +e.target.value || 1) })} /></label>
                        <button className="btn s" onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })}>{t("Remove")}</button>
                    </div>
                );
            })}
            <button className="btn s" onClick={addItem}>+ {t("Add item")}</button>
        </Modal>
    );
}

export default function Bundles() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, reload } = useLoad(() => Promise.all([
        api.bundles.list(storeId), api.products.list(storeId), api.settings.get(storeId),
    ]), [storeId]);
    const fx = useFx(data ? data[2] : undefined);
    const [form, setForm] = useState<Bundle | null>(null);
    const [confirm, setConfirm] = useState<Bundle | null>(null);
    if (!data) return <Loading />;
    const [bundles, products] = data;
    const label = (b: Bundle) => b.items.map((it) => {
        const p = products.find((x) => x.id === it.productId);
        const v = p?.variants.find((x) => x.id === it.variantId);
        return `${it.qty} × ${p?.title ?? "—"}${v && (p?.variants.length ?? 0) > 1 ? ` (${v.name})` : ""}`;
    }).join(", ");
    const save = async (b: Bundle) => {
        try {
            // ID is generated when the form opens (not here), so double-clicks
            // save the same bundle instead of creating duplicates.
            await api.bundles.save(storeId, b);
            setForm(null); reload(); toast(t("Bundle saved"));
        } catch (e) { toast((e as Error).message, true); }
    };
    return (
        <>
            <PageHeader title={t("Bundles")}
                        actions={<button className="btn" onClick={() => setForm({ id: crypto.randomUUID(), name: "", items: [], price: 0, active: true })}>{t("New bundle")}</button>} />
            <Card>
                {bundles.length === 0 ? <EmptyState art="🎁" title={t("No bundles yet")} text={t("Group products into kits sold at a special price.")} /> : (
                    <table className="ptable"><thead><tr><th>{t("Bundle")}</th><th>{t("Items")}</th><th>{t("Price")}</th><th>{t("Status")}</th><th></th></tr></thead>
                        <tbody>{bundles.map((b) => (
                            <tr key={b.id}>
                                <td><b>{b.name}</b></td>
                                <td className="mu-t">{label(b)}</td>
                                <td>{fx.fmt(b.price)}</td>
                                <td><Badge t={b.active ? t("Active") : t("Inactive")} /></td>
                                <td style={{ textAlign: "right" }}>
                                    <button className="btn s" onClick={() => setForm(b)}>{t("Edit")}</button>{" "}
                                    <button className="btn s" onClick={() => setConfirm(b)}>{t("Delete")}</button>
                                </td>
                            </tr>))}</tbody></table>)}
            </Card>
            {form && <BundleForm initial={form} products={products} onClose={() => setForm(null)} onSave={(b) => void save(b)} />}
            {confirm && (
                <Confirm open title={`${t("Delete bundle")} "${confirm.name}"?`} message={t("This cannot be undone.")}
                         onClose={() => setConfirm(null)}
                         onConfirm={async () => { await api.bundles.remove(storeId, confirm.id); setConfirm(null); reload(); toast(t("Bundle deleted")); }} />
            )}
        </>
    );
}

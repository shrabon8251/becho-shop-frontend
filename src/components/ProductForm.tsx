import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "./polaris";
import { Card } from "./ui";
import type { Collection, Product, ProductOption, Variant } from "../types";
import { useT } from "../lib/fx";

const comboKey = (ov: Record<string, string>) => JSON.stringify(ov);
export const variantName = (ov: Record<string, string>): string => {
    const vals = Object.values(ov);
    return vals.length ? vals.join(" / ") : "Default";
};
/** All option-value combinations; [{}] when there are no usable options (single default variant). */
export function combosOf(options: ProductOption[]): Record<string, string>[] {
    const valid = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (!valid.length) return [{}];
    return valid.reduce<Record<string, string>[]>((acc, o) => acc.flatMap((c) => o.values.map((val) => ({ ...c, [o.name]: val }))), [{}]);
}
/** Rebuild variants from options, preserving data for combinations that still exist.
 * BUG-31 fix: when a new option is added, existing variants won't have it in
 * their optionValues, so exact key match fails. Fall back to best-overlap
 * match so SKU/stock/price survive option changes. */
function rebuild(p: Product, options: ProductOption[]): Product {
    const valid = options.filter((o) => o.name.trim() && o.values.length > 0);
    const byKey = new Map(p.variants.map((v) => [comboKey(v.optionValues ?? {}), v]));
    // Best-overlap: find existing variant matching the most option values.
    const bestMatch = (c: Record<string, string>): Variant | undefined => {
        let best: Variant | undefined; let bestScore = -1;
        for (const v of p.variants) {
            const ov = v.optionValues ?? {};
            let score = 0, conflict = false;
            for (const k of Object.keys(c)) {
                if (k in ov) { if (ov[k] === c[k]) score++; else { conflict = true; break; } }
            }
            if (!conflict && score > bestScore) { bestScore = score; best = v; }
        }
        return bestScore > 0 ? best : undefined;
    };
    const variants = combosOf(options).map((c) => {
        const ex = byKey.get(comboKey(c)) ?? bestMatch(c);
        if (ex) return valid.length ? { ...ex, optionValues: c, name: variantName(c) } : ex;
        return { id: crypto.randomUUID(), name: variantName(c), price: p.variants[0]?.price ?? 0, sku: "", stock: 0, optionValues: c } as Variant;
    });
    return { ...p, options, variants };
}

export default function ProductForm({ initial, collections, storeId, isNew, onSave, onBack }: {
    initial: Product; collections: Collection[]; storeId: string; isNew?: boolean; onSave(p: Product): void; onBack(): void;
}) {
    const t = useT();
    // Draft autosave: navigating to another page unmounts this form and React state
    // is lost. Persist the in-progress draft to localStorage on every change so
    // unsaved work survives navigation (and refresh). Cleared on save or discard.
    const draftKey = `becho:draft:product:${storeId}:${isNew ? "new" : initial.id}`;
    const [draft, setDraft] = useState<Product>(() => {
        try {
            const saved = localStorage.getItem(draftKey);
            if (saved) {
                const p = JSON.parse(saved) as Product;
                return rebuild(p, p.options ?? []);
            }
        } catch { /* corrupted draft — fall through to initial */ }
        return rebuild(initial, initial.options ?? []);
    });
    const [restored, setRestored] = useState<boolean>(() => {
        try { return localStorage.getItem(draftKey) !== null; } catch { return false; }
    });
    useEffect(() => {
        try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* storage blocked/full — form still works */ }
    }, [draft, draftKey]);
    const clearDraft = () => {
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
        setRestored(false);
    };
    const discardDraft = () => { clearDraft(); setDraft(rebuild(initial, initial.options ?? [])); };
    const [imgErr, setImgErr] = useState("");
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkStock, setBulkStock] = useState("");
    // BUG-30 fix: keep raw text while typing so commas aren't stripped mid-typing.
    // Parse to values only on blur.
    const [rawValues, setRawValues] = useState<Record<number, string>>({});
    const [rawTags, setRawTags] = useState<string | null>(null);
    const opts = draft.options ?? [];
    const matrix = opts.length > 0;

    const upload = async (files: FileList | null) => {
        if (!files) return;
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
                if (file.size > 2_000_000) throw new Error("Each image must be under 2 MB");
                urls.push(await api.uploads.image(storeId, file));
            }
            setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
            setImgErr("");
        } catch (err) { setImgErr((err as Error).message); }
    };
    const setV = (id: string, patch: Partial<Variant>) =>
        setDraft((d) => ({ ...d, variants: d.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
    const setOptions = (options: ProductOption[]) => setDraft((d) => rebuild(d, options));
    const applyBulk = () => setDraft((d) => ({
        ...d, variants: d.variants.map((v) => ({
            ...v,
            ...(bulkPrice !== "" ? { price: +bulkPrice } : {}),
            ...(bulkStock !== "" ? { stock: +bulkStock } : {}),
        })),
    }));

    return (
        <>
            <PageHeader title={draft.title || t("New product")} back={onBack}
                        actions={<button className="btn" disabled={!draft.title.trim()} onClick={() => { clearDraft(); onSave(draft); }}>{t("Save")}</button>} />
            {restored && <p className="mu-t" style={{ margin: "8px 0" }}>{t("Unsaved draft restored.")} <button className="btn s" onClick={discardDraft}>{t("Discard")}</button></p>}
            <div className="two">
                <div>
                    <Card>
                        <label><b>{t("Title")}</b><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t("e.g. Cotton T-shirt")} /></label>
                        <label><span className="mu-t">{t("Description")}</span>
                            <textarea rows={4} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={t("Describe the product…")} /></label>
                    </Card>
                    <Card><b>{t("Media")}</b>
                        <div className="row" style={{ flexWrap: "wrap", marginTop: 8 }}>{draft.images.map((u, i) => (
                            <div key={i} className="thumb"><img src={u} alt="" />
                                <button className="btn s" disabled={i === 0} onClick={() => setDraft({ ...draft, images: [u, ...draft.images.filter((_, j) => j !== i)] })}>{t("Main")}</button>{" "}
                                <button className="btn s" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, j) => j !== i) })}>{t("Remove")}</button></div>))}</div>
                        <input type="file" accept="image/*" multiple onChange={(e) => void upload(e.target.files)} />
                        {imgErr && <p className="er-t">{imgErr}</p>}
                    </Card>
                    <Card>
                        <div className="between"><b>{t("Options")}</b>
                            {opts.length < 3 && <button className="btn s" onClick={() => setOptions([...opts, { name: "", values: [] }])}>{t("Add option")}</button>}</div>
                        {!matrix && <p className="mu-t">{t("Add options like Size or Color to sell variants of this product.")}</p>}
                        {opts.map((o, i) => (
                            <div key={i} className="card" style={{ boxShadow: "none", border: "1px solid var(--bd)", margin: "8px 0 0" }}>
                                <div className="between">
                                    <input aria-label={t("Option name")} placeholder={t("Option name (e.g. Size)")} value={o.name} style={{ maxWidth: 220 }}
                                           onChange={(e) => setOptions(opts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                                    <button className="btn s" onClick={() => setOptions(opts.filter((_, j) => j !== i))}>{t("Remove")}</button>
                                </div>
                                <label><span className="mu-t">{t("Values (comma separated)")}</span>
                                    <input aria-label={t("Option values")} placeholder={t("e.g. S, M, L")} value={rawValues[i] ?? o.values.join(", ")}
                                           onChange={(e) => setRawValues((prev) => ({ ...prev, [i]: e.target.value }))}
                                           onBlur={(e) => {
                                               const values = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                               setOptions(opts.map((x, j) => (j === i ? { ...x, values } : x)));
                                               setRawValues((prev) => { const n = { ...prev }; delete n[i]; return n; });
                                           }} /></label>
                            </div>))}
                    </Card>
                    <Card>
                        <div className="between"><b>{t("Variants")} ({draft.variants.length})</b>
                            {matrix && <span className="row" style={{ alignItems: "center" }}>
                <input aria-label={t("Bulk price")} type="number" placeholder={t("Price")} value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} style={{ width: 90, margin: 0 }} />
                <input aria-label={t("Bulk stock")} type="number" placeholder={t("Stock")} value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} style={{ width: 90, margin: 0 }} />
                <button className="btn s" disabled={bulkPrice === "" && bulkStock === ""} onClick={applyBulk}>{t("Apply to all")}</button>
              </span>}</div>
                        <div style={{ overflowX: "auto" }}>
                            <table>
                                <thead><tr>
                                    {matrix && opts.filter((o) => o.name.trim() && o.values.length).map((o) => <th key={o.name}>{o.name}</th>)}
                                    {!matrix && <th>{t("Name")}</th>}
                                    <th style={{ textAlign: "right" }}>{t("Price")}</th><th style={{ textAlign: "right" }}>{t("Compare price")}</th><th>{t("SKU")}</th><th style={{ textAlign: "right" }}>{t("Stock")}</th>
                                    <th>{t("Barcode")}</th><th style={{ textAlign: "right" }}>{t("Weight (g)")}</th><th>{t("Image")}</th>
                                </tr></thead>
                                <tbody>{draft.variants.map((v) => (
                                    <tr key={v.id}>
                                        {matrix && opts.filter((o) => o.name.trim() && o.values.length).map((o) => <td key={o.name}>{v.optionValues?.[o.name]}</td>)}
                                        {!matrix && <td><input aria-label={t("Variant name")} value={v.name} onChange={(e) => setV(v.id, { name: e.target.value })} /></td>}
                                        <td><input aria-label={t("Price")} type="number" min={0} value={v.price} onChange={(e) => setV(v.id, { price: +e.target.value })} style={{ width: 90 }} /></td>
                                        <td><input aria-label={t("Compare price")} title={t("Original price before discount")} type="number" min={0} value={v.compareAt ?? ""} placeholder="-" onChange={(e) => setV(v.id, { compareAt: e.target.value === "" ? undefined : +e.target.value })} style={{ width: 90 }} /></td>
                                        <td><input aria-label={t("SKU")} value={v.sku} onChange={(e) => setV(v.id, { sku: e.target.value })} style={{ width: 110 }} /></td>
                                        <td><input aria-label={t("Stock")} type="number" min={0} value={v.stock} onChange={(e) => setV(v.id, { stock: +e.target.value })} style={{ width: 80 }} /></td>
                                        <td><input aria-label={t("Barcode")} value={v.barcode ?? ""} onChange={(e) => setV(v.id, { barcode: e.target.value })} style={{ width: 110 }} /></td>
                                        <td><input aria-label={t("Weight in grams")} type="number" min={0} value={v.weight ?? ""} onChange={(e) => setV(v.id, { weight: e.target.value === "" ? undefined : +e.target.value })} style={{ width: 80 }} /></td>
                                        <td><select aria-label={t("Variant image")} value={v.image ?? ""} onChange={(e) => setV(v.id, { image: e.target.value || undefined })} style={{ width: 110 }}>
                                            <option value="">{t("None")}</option>
                                            {draft.images.map((u, i) => <option key={i} value={u}>{t("Image")} {i + 1}</option>)}
                                        </select></td>
                                    </tr>))}
                                </tbody>
                            </table>
                        </div>
                        {!matrix && <button className="btn s" style={{ marginTop: 8 }} onClick={() => setDraft({ ...draft, variants: [...draft.variants, { id: crypto.randomUUID(), name: "", price: 0, sku: "", stock: 0 }] })}>{t("Add variant")}</button>}
                    </Card>
                    <Card>
                        <div className="between"><b>{t("Metafields")}</b><button className="btn s" onClick={() => setDraft({ ...draft, metafields: [...(draft.metafields ?? []), { key: "", value: "" }] })}>{t("Add metafield")}</button></div>
                        {(draft.metafields ?? []).length === 0 && <p className="mu-t">{t("Custom key–value data for themes and apps. None yet.")}</p>}
                        {(draft.metafields ?? []).map((m, i) => (
                            <div className="row" key={i} style={{ alignItems: "center" }}>
                                <input aria-label={t("Metafield key")} placeholder={t("Key")} value={m.key} onChange={(e) => setDraft({ ...draft, metafields: draft.metafields!.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} />
                                <input aria-label={t("Metafield value")} placeholder={t("Value")} value={m.value} onChange={(e) => setDraft({ ...draft, metafields: draft.metafields!.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                                <button className="btn s" aria-label={t("Remove metafield")} onClick={() => setDraft({ ...draft, metafields: draft.metafields!.filter((_, j) => j !== i) })}>✕</button>
                            </div>))}
                    </Card>
                </div>
                <div>
                    <Card><label><b>{t("Status")}</b>
                        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Product["status"] })}><option value="Active">{t("Active")}</option><option value="Draft">{t("Draft")}</option></select></label>
                    </Card>
                    <Card><b>{t("Product organization")}</b>
                        <label className="mu-t">{t("Collection")}
                            <select value={draft.collectionId} onChange={(e) => setDraft({ ...draft, collectionId: e.target.value })}><option value="">{t("None")}</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                        <label className="mu-t">{t("Vendor")}<input value={draft.vendor ?? ""} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} placeholder={t("e.g. Acme")} /></label>
                        <label className="mu-t">{t("Product type")}<input value={draft.productType ?? ""} onChange={(e) => setDraft({ ...draft, productType: e.target.value })} placeholder={t("e.g. T-shirt")} /></label>
                        <label className="mu-t">{t("Tags (comma separated)")}<input value={rawTags ?? (draft.tags ?? []).join(", ")}
                                                                                    onChange={(e) => setRawTags(e.target.value)}
                                                                                    onBlur={(e) => { setDraft({ ...draft, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }); setRawTags(null); }}
                                                                                    placeholder={t("e.g. summer, cotton")} /></label>
                    </Card>
                    <Card><b>{t("Purchase options")}</b>
                        <label className="mu-t">{t("Product video URL")}<input value={draft.video ?? ""} onChange={(e) => setDraft({ ...draft, video: e.target.value || undefined })} placeholder="https://…" /></label>
                        <label className="check"><input type="checkbox" checked={!!draft.preorder} onChange={(e) => setDraft({ ...draft, preorder: e.target.checked || undefined })} /> {t("Allow pre-orders when out of stock")}</label>
                    </Card>
                    <Card><b>{t("Digital product")}</b>
                        <label className="check"><input type="checkbox" checked={!!draft.digital} onChange={(e) => setDraft({ ...draft, digital: e.target.checked || undefined })} /> {t("This is a digital product (no shipping needed)")}</label>
                        <label className="check"><input type="checkbox" checked={!!draft.taxExempt} onChange={(e) => setDraft({ ...draft, taxExempt: e.target.checked || undefined })} /> {t("Don't charge tax on this product")}</label>
                        {draft.digital && <>
                            <label className="mu-t">{t("Downloadable file")}
                                <input type="file" onChange={(e) => setDraft({ ...draft, digitalFile: e.target.files?.[0]?.name ?? draft.digitalFile })} /></label>
                            {draft.digitalFile && <p className="mu-t">{t("File")}: <b>{draft.digitalFile}</b></p>}
                            <p className="hint">{t("Customers get a download link after purchase. Weight and shipping are ignored.")}</p>
                        </>}
                    </Card>
                </div>
            </div>
        </>
    );
}

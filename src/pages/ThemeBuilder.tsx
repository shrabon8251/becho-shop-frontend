import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { HomeSections } from "../components/HomeSections";
import { PageHeader, SaveBar, toast, Loading, Confirm } from "../components/polaris";
import { useShopData } from "../lib/shop";
import { FONTS, SECTION_DEFAULTS, SECTION_LABELS, THEMES, themeStyle } from "../lib/theme";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { nichePhoto } from "../lib/previewPhotos";
import type { FaqItem, HeroSlide, Product, Testimonial, Theme, ThemeSection } from "../types";
// Sample products for the builder preview toggle. Preview-only: they are never
// saved to the store — they just let a merchant with no products yet see what
// product sections will look like.
const SAMPLE_NAMES = ["Classic Sneakers", "Leather Wallet", "Everyday Tote", "Denim Jacket", "Ceramic Mug", "Cotton Tee", "Canvas Backpack", "Sunglasses"];
const SAMPLE_PRICES = [2500, 1200, 950, 3800, 550, 850, 2900, 1750];
const SAMPLE_PRODUCTS: Product[] = SAMPLE_NAMES.map((title, i) => ({
    id: `tb-sample-${i}`,
    title,
    status: "Active",
    collectionId: "",
    images: [nichePhoto("minimal", i) ?? ""],
    variants: [{ id: `tb-sample-${i}-v1`, name: "Default", price: SAMPLE_PRICES[i], sku: "", stock: 10 }],
}));
function SlideEditor({ s, tr, upS }: { s: ThemeSection; tr: (k: string) => string; upS: (id: string, p: Partial<ThemeSection>) => void }) {
    const slides = s.slides ?? [];
    const setSlide = (ix: number, p: Partial<HeroSlide>) => upS(s.id, { slides: slides.map((x, j) => (j === ix ? { ...x, ...p } : x)) });
    const mv = (ix: number, d: number) => { const a = [...slides], j = ix + d; if (j < 0 || j >= a.length) return; [a[ix], a[j]] = [a[j], a[ix]]; upS(s.id, { slides: a }); };
    return (<div className="slides-ed">
        {slides.map((sl, ix) => (
            <div key={ix} className="card" style={{ marginBottom: 8 }}>
                <div className="between"><b>{tr("Slide")} {ix + 1}</b>
                    <span><button className="btn s ico" aria-label={tr("Move up")} disabled={ix === 0} onClick={() => mv(ix, -1)}>↑</button>{" "}
                        <button className="btn s ico" aria-label={tr("Move down")} disabled={ix === slides.length - 1} onClick={() => mv(ix, 1)}>↓</button>{" "}
                        <button className="btn s ico" aria-label={tr("Remove slide")} disabled={slides.length < 2} onClick={() => upS(s.id, { slides: slides.filter((_, j) => j !== ix) })}>✕</button></span></div>
                {sl.img && <img src={sl.img} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                <label>{tr("Image URL")}<input value={sl.img ?? ""} placeholder="https://…" onChange={(e) => setSlide(ix, { img: e.target.value })} /></label>
                <label>{tr("Video URL (optional)")}<input value={sl.video ?? ""} placeholder="https://…mp4" onChange={(e) => setSlide(ix, { video: e.target.value })} /></label>
                <label>{tr("Title")}<input value={sl.title ?? ""} onChange={(e) => setSlide(ix, { title: e.target.value })} /></label>
                <label>{tr("Subtitle")}<input value={sl.sub ?? ""} onChange={(e) => setSlide(ix, { sub: e.target.value })} /></label>
                <div className="row"><label style={{ flex: 1 }}>{tr("Button text")}<input value={sl.btnText ?? ""} onChange={(e) => setSlide(ix, { btnText: e.target.value })} /></label>
                    <label style={{ flex: 1 }}>{tr("Button link")}<input value={sl.btnLink ?? ""} placeholder="/shop/products" onChange={(e) => setSlide(ix, { btnLink: e.target.value })} /></label></div>
            </div>))}
        <button className="btn s" onClick={() => upS(s.id, { slides: [...slides, { img: "https://picsum.photos/seed/slide" + Date.now() % 997 + "/1600/900", title: "", sub: "", btnText: "Shop now", btnLink: "/shop/products" }] })}>+ {tr("Add slide")}</button>
        <p className="mu-t">{tr("Slides auto-play every 5 seconds. Add a video URL to use video instead of image.")}</p>
    </div>);
}
function TileEditor({ s, tr, upS, field, label }: { s: ThemeSection; tr: (k: string) => string; upS: (id: string, p: Partial<ThemeSection>) => void; field: "tiles" | "promos"; label: string }) {
    const items = (s[field] ?? []) as { img: string; title: string; sub?: string; link: string }[];
    const set = (ix: number, k: string, v: string) => upS(s.id, { [field]: items.map((x, j) => (j === ix ? { ...x, [k]: v } : x)) } as Partial<ThemeSection>);
    return (<div>
        {items.map((tl, ix) => (
            <div key={ix} className="card" style={{ marginBottom: 8 }}>
                <div className="between"><b>{label} {ix + 1}</b>
                    <button className="btn s ico" aria-label={tr("Remove")} onClick={() => upS(s.id, { [field]: items.filter((_, j) => j !== ix) } as Partial<ThemeSection>)}>✕</button></div>
                <label>{tr("Image URL")}<input value={tl.img} onChange={(e) => set(ix, "img", e.target.value)} /></label>
                <label>{tr("Title")}<input value={tl.title} onChange={(e) => set(ix, "title", e.target.value)} /></label>
                <label>{tr("Subtitle")}<input value={tl.sub ?? ""} onChange={(e) => set(ix, "sub", e.target.value)} /></label>
                <label>{tr("Link")}<input value={tl.link} placeholder="/shop/products" onChange={(e) => set(ix, "link", e.target.value)} /></label>
            </div>))}
        {items.length < 3 && <button className="btn s" onClick={() => upS(s.id, { [field]: [...items, { img: "", title: "", link: "/shop/products" }] } as Partial<ThemeSection>)}>+ {tr("Add")} {label.toLowerCase()}</button>}
    </div>);
}
function CollectionPick({ s, tr, upS, storeId }: { s: ThemeSection; tr: (k: string) => string; upS: (id: string, p: Partial<ThemeSection>) => void; storeId: string }) {
    const { data: cols } = useLoad(() => api.collections.list(storeId), [storeId]);
    return <label>{tr("Collection")}<select value={s.collectionId ?? ""} onChange={(e) => upS(s.id, { collectionId: e.target.value || undefined })}><option value="">{tr("First collection")}</option>{(cols ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>;
}
function TestimonialEditor({ s, tr, upS }: { s: ThemeSection; tr: (k: string) => string; upS: (id: string, p: Partial<ThemeSection>) => void }) {
    const items = s.testimonials ?? [];
    const setIt = (ix: number, p: Partial<Testimonial>) => upS(s.id, { testimonials: items.map((x, j) => (j === ix ? { ...x, ...p } : x)) });
    return (<div>{items.map((x, ix) => (
        <div key={ix} className="card" style={{ marginBottom: 8 }}>
            <div className="between"><b>{tr("Review")} {ix + 1}</b><button className="btn s ico" aria-label={tr("Remove")} onClick={() => upS(s.id, { testimonials: items.filter((_, j) => j !== ix) })}>✕</button></div>
            <label>{tr("Name")}<input value={x.name} onChange={(e) => setIt(ix, { name: e.target.value })} /></label>
            <label>{tr("Text")}<textarea rows={2} value={x.text} onChange={(e) => setIt(ix, { text: e.target.value })} /></label>
            <label>{tr("Stars")}<select value={x.stars} onChange={(e) => setIt(ix, { stars: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        </div>))}
        <button className="btn s" onClick={() => upS(s.id, { testimonials: [...items, { name: "", text: "", stars: 5 }] })}>+ {tr("Add review")}</button></div>);
}
function FaqEditor({ s, tr, upS }: { s: ThemeSection; tr: (k: string) => string; upS: (id: string, p: Partial<ThemeSection>) => void }) {
    const items = s.faqs ?? [];
    const setIt = (ix: number, p: Partial<FaqItem>) => upS(s.id, { faqs: items.map((x, j) => (j === ix ? { ...x, ...p } : x)) });
    return (<div>{items.map((x, ix) => (
        <div key={ix} className="card" style={{ marginBottom: 8 }}>
            <div className="between"><b>{tr("Question")} {ix + 1}</b><button className="btn s ico" aria-label={tr("Remove")} onClick={() => upS(s.id, { faqs: items.filter((_, j) => j !== ix) })}>✕</button></div>
            <label>{tr("Question")}<input value={x.q} onChange={(e) => setIt(ix, { q: e.target.value })} /></label>
            <label>{tr("Answer")}<textarea rows={2} value={x.a} onChange={(e) => setIt(ix, { a: e.target.value })} /></label>
        </div>))}
        <button className="btn s" onClick={() => upS(s.id, { faqs: [...items, { q: "", a: "" }] })}>+ {tr("Add question")}</button></div>);
}
function Form({ initial, storeId }: { initial: Theme; storeId: string }) {
    const tr = useT();
    const [base, setBase] = useState(initial);
    const [t, setT] = useState(initial);
    const { data: store } = useLoad(() => api.stores.get(storeId), [storeId]);
    const shopUrl = store?.sub ? `/shop/${store.sub}` : "/shop";
    const [add, setAdd] = useState<ThemeSection["type"]>("banner");
    const [open, setOpen] = useState<string | null>(null);
    const [mobile, setMobile] = useState(false);
    const [sample, setSample] = useState(false);
    // Per-preset themes: each gallery preset keeps its own saved customization.
    // Switching presets loads that preset's saved settings (never the factory
    // default over your work). Ask first when there are unsaved edits.
    const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
    // Merchant page: pass the merchant's own store id. useShopData()'s default
    // resolves the *public storefront* store (?store=/env), which is wrong here
    // and left the preview stuck on "Loading preview..." (wrong-store 404s).
    const d = useShopData(storeId);
    const { data: cols } = useLoad(() => api.collections.list(storeId), [storeId]);
    const dirty = JSON.stringify(t) !== JSON.stringify(base);
    const set = (p: Partial<Theme>) => setT({ ...t, ...p });
    const upS = (id: string, p: Partial<ThemeSection>) => set({ sections: t.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) });
    const mv = (i: number, dir: number) => { const a = [...t.sections], j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set({ sections: a }); };
    const save = async () => { try { await api.theme.save(storeId, t, t.template || undefined); setBase(t); try { localStorage.setItem("theme-customized:" + storeId, "1"); } catch { /* ignore */ } toast(tr("Theme saved")); } catch (e) { toast((e as Error).message, true); } };
    // Load one gallery preset's saved customization (or its factory default when
    // never customized). The previous preset's settings stay in its own row.
    const switchPreset = async (presetId: string) => {
        setLoadingPreset(presetId);
        try {
            const loaded = await api.theme.get(storeId, presetId);
            setT(loaded); setBase(loaded);
        } catch (e) { toast((e as Error).message, true); }
        finally { setLoadingPreset(null); setConfirmSwitch(null); }
    };
    const types = Object.keys(SECTION_LABELS) as ThemeSection["type"][];
    const name = t.logoText || d?.settings.storeName || "Shop";
    // Builder preview uses the store's real products. The toggle swaps in
    // sample products (preview-only, never saved) so an empty store can still
    // be visualized with product sections filled.
    const previewProducts = sample ? SAMPLE_PRODUCTS : (d?.products ?? []);
    return (
        <>
            <PageHeader title={tr("Online Store")} actions={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className={"btn s" + (sample ? " on" : "")} aria-pressed={sample} onClick={() => setSample(!sample)} title={tr("Fill product sections with sample products in the preview. They are not saved to your store.")}>{tr("Sample products")}</button>
                <div className="seg" role="group" aria-label={tr("Preview size")}><button className={"btn s" + (!mobile ? " on" : "")} aria-pressed={!mobile} onClick={() => setMobile(false)}>{tr("Desktop")}</button><button className={"btn s" + (mobile ? " on" : "")} aria-pressed={mobile} onClick={() => setMobile(true)}>{tr("Mobile")}</button></div>
            </div>} />
            <div className="tedit">
                <div className="tpanel">
                    <div className="card"><b>{tr("Theme settings")}</b>
                        <label>{tr("Theme gallery")}<div className="tgal">{THEMES.map((p) => (
                            <button key={p.id} className={"tgal-c" + (t.template === p.id ? " on" : "")} disabled={loadingPreset !== null} onClick={() => { if (p.id === t.template && !dirty) return; if (dirty) setConfirmSwitch(p.id); else void switchPreset(p.id); }}>
                                <span className="tgal-pv" style={{ background: `linear-gradient(135deg, ${p.theme.color}, #222)` }} />
                                <b>{tr(p.name)}</b><span className="mu-t">{tr(p.desc)}</span>
                                {t.template === p.id && <span className="badge">{tr("Active")}</span>}
                            </button>))}
                        </div></label>
                        <div className="row"><button className="btn s" onClick={() => setConfirmReset(true)}>{tr("Reset to default")}</button></div>
                        <label>{tr("Brand color")}<input type="color" value={t.color} onChange={(e) => set({ color: e.target.value })} style={{ height: 38, padding: 2 }} /></label>
                        <label>{tr("Font")}<select value={t.font} onChange={(e) => set({ font: e.target.value as Theme["font"] })}>{(Object.keys(FONTS) as Theme["font"][]).map((f) => <option key={f}>{f}</option>)}</select></label>
                        <label>{tr("Corner radius")} ({t.radius}px)<input type="range" min={0} max={24} value={t.radius} onChange={(e) => set({ radius: +e.target.value })} /></label>
                        <label>{tr("Logo text")}<input placeholder={tr("Empty = store name")} value={t.logoText} onChange={(e) => set({ logoText: e.target.value })} /></label></div>
                    <div className="card"><b>{tr("Footer")}</b>
                        <label>{tr("Footer text")}<input value={t.footer?.text ?? ""} placeholder="© {year} {store}" onChange={(e) => set({ footer: { ...t.footer, text: e.target.value } })} /></label>
                        <p className="mu-t">{"{year}"} = {tr("current year")}, {"{store}"} = {tr("store name")}</p>
                        <label className="row"><input type="checkbox" checked={t.footer?.showPayments ?? true} onChange={(e) => set({ footer: { ...t.footer, showPayments: e.target.checked } })} /> {tr("Show payment icons")}</label>
                        <div className="lbl" style={{ marginTop: 8 }}>{tr("Footer links")}</div>
                        {(t.footer?.links ?? []).map((l, i) => (
                            <div className="row" key={i}>
                                <input placeholder={tr("Label")} value={l.label} onChange={(e) => { const links = [...(t.footer?.links ?? [])]; links[i] = { ...links[i], label: e.target.value }; set({ footer: { ...t.footer, links } }); }} style={{ flex: 1 }} />
                                <input placeholder="/shop/blog" value={l.href} onChange={(e) => { const links = [...(t.footer?.links ?? [])]; links[i] = { ...links[i], href: e.target.value }; set({ footer: { ...t.footer, links } }); }} style={{ flex: 1 }} />
                                <button className="btn s" onClick={() => set({ footer: { ...t.footer, links: (t.footer?.links ?? []).filter((_, j) => j !== i) } })} aria-label={tr("Remove")}>✕</button>
                            </div>))}
                        <button className="btn s" onClick={() => set({ footer: { ...t.footer, links: [...(t.footer?.links ?? []), { label: "", href: "" }] } })}>+ {tr("Add link")}</button></div>
                    <div className="card"><b>{tr("Home page sections")}</b>
                        {t.sections.map((s, i) => (
                            <div key={s.id} className={"tsec" + (s.on ? "" : " off")}>
                                <div className="tsec-h">
                                    <button className="tsec-t" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "▾" : "▸"} {tr(SECTION_LABELS[s.type])}</button>
                                    <span className="acts">
                    <button className="btn s ico" aria-label={tr("Move up")} disabled={i === 0} onClick={() => mv(i, -1)}>↑</button>
                    <button className="btn s ico" aria-label={tr("Move down")} disabled={i === t.sections.length - 1} onClick={() => mv(i, 1)}>↓</button>
                    <button className="btn s ico" onClick={() => upS(s.id, { on: !s.on })}>{s.on ? tr("Hide") : tr("Show")}</button>
                    <button className="btn s ico" aria-label={tr("Duplicate section")} title={tr("Duplicate section")} onClick={() => { const i = t.sections.findIndex((x) => x.id === s.id); const copy = { ...JSON.parse(JSON.stringify(s)), id: crypto.randomUUID() }; const a = [...t.sections]; a.splice(i + 1, 0, copy); set({ sections: a }); setOpen(copy.id); }}>⧉</button>
                    <button className="btn s ico" aria-label={tr("Remove section")} onClick={() => set({ sections: t.sections.filter((x) => x.id !== s.id) })}>✕</button></span></div>
                                {open === s.id && <div className="tsec-b">
                                    {s.type === "hero" && <><SlideEditor s={s} tr={tr} upS={upS} /><div style={{ marginTop: 12 }}><b>{tr("Side promo banners")}</b><TileEditor s={s} tr={tr} upS={upS} field="promos" label={tr("Promo")} /></div></>}
                                    {s.type === "deals" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Subtitle")}<input value={s.sub ?? ""} onChange={(e) => upS(s.id, { sub: e.target.value })} /></label><label>{tr("Products to show (1-12)")}<input type="number" min={1} max={12} value={s.count ?? 8} onChange={(e) => upS(s.id, { count: Math.min(12, Math.max(1, +e.target.value)) })} /></label><p className="mu-t">{tr("Shows products with a compare-at price first, with a countdown to midnight.")}</p></>}
                                    {s.type === "cat_circles" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><p className="mu-t">{tr("Shows all collections as circular tiles.")}</p></>}
                                    {s.type === "promo_tiles" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><TileEditor s={s} tr={tr} upS={upS} field="tiles" label={tr("Tile")} /></>}
                                    {s.type === "ptabs" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Products to show (1-12)")}<input type="number" min={1} max={12} value={s.count ?? 8} onChange={(e) => upS(s.id, { count: Math.min(12, Math.max(1, +e.target.value)) })} /></label><p className="mu-t">{tr("Collections become filter tabs automatically.")}</p></>}
                                    {s.type === "cta_banner" && <><label>{tr("Title")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Body")}<textarea rows={2} value={s.body ?? ""} onChange={(e) => upS(s.id, { body: e.target.value })} /></label><label>{tr("Button text")}<input value={s.btnText ?? ""} onChange={(e) => upS(s.id, { btnText: e.target.value })} /></label><label>{tr("Button link")}<input value={s.btnLink ?? ""} onChange={(e) => upS(s.id, { btnLink: e.target.value })} /></label><label>{tr("Background")}<input value={s.bg ?? ""} placeholder="linear-gradient(135deg,#1B6EBB,#1A2A5E)" onChange={(e) => upS(s.id, { bg: e.target.value })} /></label></>}
                                    {s.type === "featured" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Products to show (1-8)")}<input type="number" min={1} max={8} value={s.count ?? 4} onChange={(e) => upS(s.id, { count: Math.min(8, Math.max(1, +e.target.value)) })} /></label></>}
                                    {s.type === "banner" && <><label>{tr("Banner text")}<input value={s.text ?? ""} onChange={(e) => upS(s.id, { text: e.target.value })} /></label><label>{tr("Background color")}<input type="color" value={s.bg ?? "#4f46e5"} onChange={(e) => upS(s.id, { bg: e.target.value })} style={{ height: 38, padding: 2 }} /></label></>}
                                    {(s.type === "featured_collection") && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><CollectionPick s={s} tr={tr} upS={upS} storeId={storeId} /></>}
                                    {s.type === "image_text" && <><label>{tr("Image URL")}<input value={s.img ?? ""} onChange={(e) => upS(s.id, { img: e.target.value })} /></label><label>{tr("Title")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Body")}<textarea rows={3} value={s.body ?? ""} onChange={(e) => upS(s.id, { body: e.target.value })} /></label><label>{tr("Button text")}<input value={s.btnText ?? ""} onChange={(e) => upS(s.id, { btnText: e.target.value })} /></label><label>{tr("Button link")}<input value={s.btnLink ?? ""} onChange={(e) => upS(s.id, { btnLink: e.target.value })} /></label><label className="row"><input type="checkbox" checked={!!s.flip} onChange={(e) => upS(s.id, { flip: e.target.checked })} /> {tr("Image on right")}</label></>}
                                    {s.type === "testimonials" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><TestimonialEditor s={s} tr={tr} upS={upS} /></>}
                                    {s.type === "richtext" && <><label>{tr("Title")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Body")}<textarea rows={3} value={s.body ?? ""} onChange={(e) => upS(s.id, { body: e.target.value })} /></label></>}
                                    {s.type === "faq" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><FaqEditor s={s} tr={tr} upS={upS} /></>}
                                    {s.type === "gallery" && <><label>{tr("Heading")}<input value={s.title ?? ""} onChange={(e) => upS(s.id, { title: e.target.value })} /></label><label>{tr("Image URLs (one per line)")}<textarea rows={4} value={(s.images ?? []).join("\n")} onChange={(e) => upS(s.id, { images: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} /></label></>}
                                    {(s.type === "collections" || s.type === "newsletter") && <p className="mu-t">{tr("This section has no settings.")}</p>}
                                </div>}
                            </div>))}
                        <div className="row" style={{ marginTop: 12 }}><select aria-label={tr("Section type")} value={add} onChange={(e) => setAdd(e.target.value as ThemeSection["type"])}>{types.map((k) => <option key={k} value={k}>{tr(SECTION_LABELS[k])}</option>)}</select>
                            <button className="btn s" onClick={() => { const id = crypto.randomUUID(); set({ sections: [...t.sections, { id, type: add, on: true, ...SECTION_DEFAULTS[add] }] }); setOpen(id); }}>{tr("Add")}</button></div></div>
                </div>
                <div className="pv">
                    <div className={"pv-frame" + (mobile ? " m" : "")}>
                        {sample && <div style={{ textAlign: "center", fontSize: 12, padding: "6px 8px", background: "#fff8e1", color: "#8a6d00", borderBottom: "1px solid #f0e0a0" }}>{tr("Showing sample products — preview only, nothing is saved to your store.")}</div>}
                        {d && cols ? (
                            <div className={"shop preview" + (t.template ? " tpl-" + t.template : "")} style={{ ...themeStyle(t), pointerEvents: "none" }} aria-label="Live preview">
                                {d.apps.bar.on && <div className="announce">{d.apps.bar.text}</div>}
                                <div className="shead sara-h"><div className="sara-h-main"><span className="logo sara-logo">{name}</span><span className="sara-search" style={{ maxWidth: 300 }}><span style={{ display: "flex" }}><input placeholder={tr("Search products")} disabled /><span className="sara-search-btn">🔍</span></span></span></div><div className="sara-nav"><span className="catmenu-btn">☰ {tr("Shop by category")}</span><span className="sara-nav-links"><span style={{ padding: "14px 13px" }}>Shop</span><span style={{ padding: "14px 13px" }}>Blog</span></span></div></div>
                                <div className="shopw"><HomeSections theme={t} settings={d.settings} products={previewProducts} cols={cols} /></div>
                            </div>) : <p className="mu-t" style={{ padding: 16 }}>{tr("Loading preview...")}</p>}
                    </div>
                    <p className="mu-t" style={{ textAlign: "center" }}>{tr("Live preview of your home page.")} <Link to={shopUrl} target="_blank">{tr("Open store")}</Link></p>
                </div>
            </div>
            <SaveBar dirty={dirty} onSave={() => void save()} onDiscard={() => setT(base)} />
            {confirmSwitch && <Confirm open title={tr("Switch theme?")}
                                       message={tr("You have unsaved changes. Switching themes will discard them.")}
                                       confirmLabel={tr("Discard and switch")}
                                       onClose={() => setConfirmSwitch(null)}
                                       onConfirm={() => void switchPreset(confirmSwitch)} />}
            {confirmReset && <Confirm open title={tr("Reset to default?")}
                                      message={tr("Your customizations for this theme will be replaced by the factory default. This cannot be undone.")}
                                      confirmLabel={tr("Reset")}
                                      onClose={() => setConfirmReset(false)}
                                      onConfirm={() => { const preset = THEMES.find((x) => x.id === t.template) ?? THEMES[0]; set({ ...JSON.parse(JSON.stringify(preset.theme)) }); setConfirmReset(false); }} />}
        </>
    );
}
export default function ThemeBuilder() {
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data } = useLoad(() => api.theme.get(storeId), [storeId]);
    return data ? <Form initial={data} storeId={storeId} /> : <Loading />;
}

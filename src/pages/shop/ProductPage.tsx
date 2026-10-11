import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { ProductCard } from "../../components/ProductCard";
import { Reviews } from "../../components/Reviews";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { shopStore, useShopData } from "../../lib/shop";
import { useCart } from "../../store/cart";
import { trackEvent } from "../../lib/tracking";
import { useShopper } from "../../store/shopper";
import { Loading } from "../../components/polaris";
import type { Product } from "../../types";
import { BackInStockButton } from "../../components/apps/BackInStockButton";
import { BundleBox } from "./Bundles";
export default function ProductPage() {
    const { id } = useParams();
    const d = useShopData();
    const fx = useFx(d?.settings);
    const t = useT();
    const seoP = d?.products.find((x) => x.id === id);
    useSeo(seoP?.seoTitle || seoP?.title, seoP?.seoDesc, d?.settings.storeName);
    const { add, setOpen } = useCart();
    const nav = useNavigate();
    const shopper = useShopper((s) => s.customer);
    const setShopper = useShopper((s) => s.set);
    const [img, setImg] = useState(0);
    const [vid, setVid] = useState("");
    const [sel, setSel] = useState<Record<string, string>>({});
    const [qty, setQty] = useState(1);
    const [guide, setGuide] = useState(false);
    const [playVid, setPlayVid] = useState(false);
    const [showBar, setShowBar] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBar(window.scrollY > 650);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        if (!id) return;
        const prod = d?.products.find((x) => x.id === id);
        if (prod) {
            const min = Math.min(...prod.variants.map((x) => x.price));
            trackEvent("ViewContent", { content_ids: [id], content_name: prod.title, value: min, currency: d?.settings.currency });
        }
        try {
            const k = "rv:" + shopStore();
            const cur: string[] = JSON.parse(localStorage.getItem(k) ?? "[]");
            localStorage.setItem(k, JSON.stringify([id, ...cur.filter((x) => x !== id)].slice(0, 12)));
        } catch { /* ignore */ }
    }, [id, d]);
    const toggleWish = async () => {
        if (!shopper || !id) return nav("/shop/account");
        const w = shopper.wishlist ?? [];
        setShopper(await api.account.update(shopStore(), { ...shopper, wishlist: w.includes(id) ? w.filter((x) => x !== id) : [...w, id] }));
    };
    const [directProduct, setDirectProduct] = useState<Product | null>(null);
    const [directError, setDirectError] = useState(false);
    useEffect(() => {
        // Fallback: if product not in the list (pagination/cache), fetch directly by ID.
        if (d && id && !d.products.find((x) => x.id === id) && !directProduct && !directError) {
            api.storefront.product(shopStore(), id)
                .then((p) => setDirectProduct(p))
                .catch(() => setDirectError(true));
        }
    }, [d, id, directProduct, directError]);
    if (!d) return <Loading />;
    const p = d.products.find((x) => x.id === id) ?? directProduct;
    if (!p && !directError) return <Loading />;
    if (!p) return <p>{t("Product not found.")}</p>;
    const opts = (p.options ?? []).filter((o) => o.name.trim() && o.values.length > 0);
    // Effective selection: keep the shopper's pick when still valid, else fall back to first values.
    const eff: Record<string, string> = {};
    for (const o of opts) eff[o.name] = sel[o.name] && o.values.includes(sel[o.name]) ? sel[o.name] : o.values[0];
    const v = opts.length
        ? (p.variants.find((x) => opts.every((o) => (x.optionValues ?? {})[o.name] === eff[o.name])) ?? p.variants[0])
        : (p.variants.find((x) => x.id === vid) ?? p.variants[0]);
    // A value is "sold out" when no in-stock variant exists for that value combined with the other picks.
    const avail = (oName: string, val: string) => p.variants.some((x) => x.stock > 0 && opts.every((o) => (x.optionValues ?? {})[o.name] === (o.name === oName ? val : eff[o.name])));
    const cur = Math.min(img, p.images.length - 1);
    const mainImg = v.image ?? p.images[cur];
    const canPreorder = !!p.preorder && v.stock < 1;
    const qCap = canPreorder ? 99 : Math.max(1, v.stock);
    const q = Math.min(Math.max(1, qty), qCap);
    const addMax = canPreorder ? 99 : v.stock;
    const same = d.products.filter((x) => x.id !== p.id && x.collectionId === p.collectionId);
    const rel = (same.length ? same : d.products.filter((x) => x.id !== p.id)).slice(0, 4);
    return (
        <>
            <div className="pdp">
                <div>
                    <div className="pdp-zoom">{p.video && playVid && !v.image ? <video src={p.video} controls className="pdp-main" /> : mainImg ? <img src={mainImg} alt={p.title} className="pdp-main" /> : <div className="ph pdp-main">{p.title[0]}</div>}</div>
                    {(p.images.length > 1 || p.video) && <div className="thumbs">
                        {p.video && <button className={"tbtn" + (playVid && !v.image ? " on" : "")} aria-label={t("Play video")} onClick={() => setPlayVid(true)}><span className="vid-t" aria-hidden>▶</span></button>}
                        {p.images.map((u, i) => <button key={i} className={"tbtn" + (i === cur && !v.image && !playVid ? " on" : "")} aria-label={`Show image ${i + 1}`} onClick={() => { setImg(i); setPlayVid(false); }}><img src={u} alt="" /></button>)}
                    </div>}
                </div>
                <div className="pdp-i">
                    <h1 className="pdp-t">{p.title}</h1>
                    {canPreorder && <p><span className="badge preorder">{t("Pre-order")}</span></p>}
                    <div className="pdp-p">{fx.fmt(v.price)}
                        {v.compareAt && v.compareAt > v.price && <>
                            <s className="mu-t" style={{ marginLeft: 10, fontWeight: 400 }}>{fx.fmt(v.compareAt)}</s>
                            <span className="pbadge deal" style={{ marginLeft: 10 }}>{t("Save {x}%").replace("{x}", String(Math.round((1 - v.price / v.compareAt) * 100)))}</span>
                        </>}
                    </div>
                    {opts.length > 0 ? opts.map((o) => (
                        <fieldset className="opt" key={o.name}><legend>{o.name}</legend>
                            {o.values.map((val) => (
                                <label key={val} className={"pill" + (eff[o.name] === val ? " on" : "") + (avail(o.name, val) ? "" : " out")}>
                                    <input type="radio" name={`opt-${o.name}`} checked={eff[o.name] === val} onChange={() => { setSel({ ...sel, [o.name]: val }); setQty(1); }} />{val}
                                </label>))}
                        </fieldset>
                    )) : p.variants.length > 1 && (
                        <fieldset className="opt"><legend>{t("Option")}</legend>
                            {p.variants.map((x) => (
                                <label key={x.id} className={"pill" + (x.id === v.id ? " on" : "") + (x.stock < 1 ? " out" : "")}>
                                    <input type="radio" name="variant" checked={x.id === v.id} onChange={() => { setVid(x.id); setQty(1); }} />{x.name}
                                </label>))}
                        </fieldset>)}
                    <p className={v.stock > 0 ? "ok-t" : "er-t"}>{canPreorder ? t("Available for pre-order") : v.stock === 0 ? t("Sold out") : v.stock < 5 ? `${t("Only")} ${v.stock} ${t("left")}` : t("In stock")}</p>
                    <div className="lbl">{t("Quantity")}</div>
                    <div className="qty"><button aria-label={t("Decrease quantity")} onClick={() => setQty(Math.max(1, q - 1))}>−</button>
                        <input type="number" aria-label={t("Quantity")} min={1} max={qCap} value={q} onChange={(e) => setQty(+e.target.value)} />
                        <button aria-label={t("Increase quantity")} onClick={() => setQty(Math.min(qCap, q + 1))}>+</button></div>
                    <button className="btn s wide" disabled={v.stock < 1 && !canPreorder} onClick={() => { add(v.id, q, addMax); trackEvent("AddToCart", { content_ids: [v.id], content_name: p.title, value: v.price * q, currency: d?.settings.currency, num_items: q }); setOpen(true); }}>{canPreorder ? t("Pre-order now") : v.stock < 1 ? t("Sold out") : t("Add to cart")}</button>
                    <button className="btn wide" disabled={v.stock < 1 && !canPreorder} onClick={() => { add(v.id, q, addMax); trackEvent("AddToCart", { content_ids: [v.id], content_name: p.title, value: v.price * q, currency: d?.settings.currency, num_items: q }); nav("/shop/checkout"); }}>{canPreorder ? t("Pre-order now") : t("Buy now")}</button>
                    {v.stock < 1 && !canPreorder && d && <BackInStockButton apps={d.apps} productId={p.id} />}
                    {d && (d.apps.installed ?? []).includes("bundles") && <BundleBox productId={p.id} />}
                    <button className="link" onClick={toggleWish}>{shopper?.wishlist?.includes(p.id) ? t("♥ Remove from wishlist") : t("♡ Add to wishlist")}</button>
                    <button className="link" onClick={() => setGuide(true)}>📏 {t("Size guide")}</button>
                    <div className="trust">
                        <span>🚚 {t("Fast delivery")}</span>
                        <span>↩️ {t("Easy returns")}</span>
                        <span>🔒 {t("Secure checkout")}</span>
                    </div>
                </div>
            </div>
            {d.apps.reviews.on && <Reviews productId={p.id} />}
            {guide && (
                <div className="mback" onMouseDown={(e) => e.target === e.currentTarget && setGuide(false)}>
                    <div className="modal" role="dialog" aria-modal="true" aria-label={t("Size guide")}>
                        <div className="between"><b>{t("Size guide")}</b><button className="btn s ico" aria-label={t("Close")} onClick={() => setGuide(false)}>✕</button></div>
                        <table className="stable"><thead><tr><th>{t("Size")}</th><th>{t("Chest (in)")}</th><th>{t("Length (in)")}</th></tr></thead>
                            <tbody>{["S", "M", "L", "XL"].map((z, i) => <tr key={z}><td>{z}</td><td>{36 + i * 2}</td><td>{27 + i}</td></tr>)}</tbody></table>
                    </div>
                </div>)}
            {rel.length > 0 && <section style={{ marginTop: 48 }}><h2 className="sec-t">{t("You may also like")}</h2><div className="pgrid">{rel.map((x) => <ProductCard key={x.id} p={x} fmt={fx.fmt} />)}</div></section>}
            <div className={"sticky-atc" + (showBar ? " show" : "")} aria-hidden={!showBar}>
                {p.images[0] && <img src={p.images[0]} alt="" />}
                <div className="grow"><b>{p.title}</b><span className="mu-t">{fx.fmt(v.price)}</span></div>
                <button className="btn s" disabled={v.stock < 1 && !canPreorder} tabIndex={showBar ? 0 : -1}
                        onClick={() => { add(v.id, q, addMax); trackEvent("AddToCart", { content_ids: [v.id], content_name: p.title, value: v.price * q, currency: d?.settings.currency, num_items: q }); setOpen(true); }}>{canPreorder ? t("Pre-order now") : v.stock < 1 ? t("Sold out") : t("Add to cart")}</button>
            </div>
        </>
    );
}

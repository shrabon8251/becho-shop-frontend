import { api } from "../../api";
import { useFx, useT } from "../../lib/fx";
import { useLoad } from "../../lib/useLoad";
import { useSeo } from "../../lib/seo";
import { ownStoreId, shopStore, useShopData, variantIndex } from "../../lib/shop";
import { useCart } from "../../store/cart";
import { Loading } from "../../components/polaris";
import type { Bundle } from "../../types";

// The public storefront API returns a reduced bundle shape without `active` —
// the backend only serves active bundles publicly, so a missing flag means visible.
const visible = (b: Bundle) => (b as Partial<Bundle>).active ?? true;

export default function Bundles() {
    const d = useShopData();
    const fx = useFx(d?.settings);
    const t = useT();
    const { add, setOpen } = useCart();
    const { data: bundles } = useLoad(() => { const o = ownStoreId(); return o ? api.bundles.list(o) : api.storefront.bundles(shopStore()); }, []);
    useSeo(t("Bundles"), undefined, d?.settings.storeName);
    if (!d || !bundles) return <Loading />;
    const idx = variantIndex(d.products);
    const list = bundles.filter(visible);
    const itemLabel = (b: Bundle) => b.items.map((it) => {
        const vid = it.variantId ?? d.products.find((p) => p.id === it.productId)?.variants[0]?.id;
        const r = vid ? idx.get(vid) : undefined;
        return r ? `${it.qty} × ${r.p.title}${r.p.variants.length > 1 ? ` (${r.v.name})` : ""}` : null;
    }).filter(Boolean).join(", ");
    const addBundle = (b: Bundle) => {
        let added = 0;
        for (const it of b.items) {
            const vid = it.variantId ?? d.products.find((p) => p.id === it.productId)?.variants[0]?.id;
            const r = vid ? idx.get(vid) : undefined;
            if (r) { add(r.v.id, it.qty, r.v.stock); added++; }
        }
        if (added) setOpen(true);
    };
    return (
        <>
            <h1 className="sec-t">{t("Bundles")}</h1>
            <p className="mu-t">{t("Curated kits at a special price.")}</p>
            {list.length === 0 ? (
                <div className="empty"><div className="empty-art">🎁</div><h3>{t("No bundles yet")}</h3></div>
            ) : (
                <div className="pgrid">
                    {list.map((b) => (
                        <div className="card" key={b.id}>
                            {b.image ? <img src={b.image} alt={b.name} style={{ width: "100%", borderRadius: 8 }} /> : <div className="ph" style={{ aspectRatio: "16/10" }}>🎁</div>}
                            <h3 style={{ margin: "12px 0 4px" }}>{b.name}</h3>
                            <p className="mu-t" style={{ minHeight: 36 }}>{itemLabel(b)}</p>
                            <div className="between" style={{ marginTop: 8 }}>
                                <b>{fx.fmt(b.price)}</b>
                                <button className="btn s" onClick={() => addBundle(b)}>{t("Add bundle to cart")}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/** Bundle box for product pages: "Frequently bought together". */
export function BundleBox({ productId }: { productId: string }) {
    const t = useT();
    const d = useShopData();
    const fx = useFx(d?.settings);
    const add = useCart((s) => s.add);
    const { data: bundles } = useLoad(() => { const o = ownStoreId(); return o ? api.bundles.list(o) : api.storefront.bundles(shopStore()); }, []);
    if (!bundles || !d) return null;
    const relevant = bundles.filter((b) => visible(b) && b.items.some((i) => i.productId === productId));
    if (!relevant.length) return null;
    return (
        <div className="card bundle-box">
            <b>📦 {t("Frequently bought together")}</b>
            {relevant.map((b) => {
                const items = b.items.map((i) => ({ ...i, p: d.products.find((x) => x.id === i.productId) })).filter((x) => x.p);
                if (!items.length) return null;
                const total = items.reduce((s, x) => s + (x.p!.variants.find((v) => v.id === x.variantId) ?? x.p!.variants[0]).price * x.qty, 0);
                return (
                    <div key={b.id} className="bundle-offer">
                        <div className="bundle-items">{items.map((x) => (
                            <span key={x.productId} className="bundle-thumb"><img src={x.p!.images[0]} alt={x.p!.title} /><i>{x.p!.title}</i></span>))}</div>
                        <div className="between">
                            <span><s className="mu-t">{fx.fmt(total)}</s> <b>{fx.fmt(b.price)}</b> <i className="ok-t">{t("Save")} {fx.fmt(total - b.price)}</i></span>
                            <button className="btn s" onClick={() => items.forEach((x) => {
                                const v = x.p!.variants.find((vv) => vv.id === x.variantId) ?? x.p!.variants[0]; add(v.id, x.qty, 99);
                            })}>{t("Add bundle to cart")}</button>
                        </div>
                    </div>);
            })}
        </div>
    );
}

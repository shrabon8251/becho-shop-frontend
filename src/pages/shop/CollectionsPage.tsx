import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { ProductCard } from "../../components/ProductCard";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { shopStore, useShopData } from "../../lib/shop";
import { collectionProducts } from "../../lib/collections";
import { useLoad } from "../../lib/useLoad";
import { Loading } from "../../components/polaris";

export function CollectionsIndex() {
    const d = useShopData();
    const t = useT();
    const { data: cols } = useLoad(() => api.storefront.collections(shopStore()), []);
    useSeo("Collections", undefined, d?.settings.storeName);
    if (!d || !cols) return <Loading />;
    return (
        <>
            <h1 className="sec-t">{t("Collections")}</h1>
            <div className="pgrid">
                {cols.map((c) => {
                    const ps = collectionProducts(c, d.products);
                    return (
                        <Link key={c.id} to={`/shop/collections/${c.id}`} className="card" style={{ textDecoration: "none" }}>
                            {c.image ? <img src={c.image} alt="" style={{ width: "100%", borderRadius: 8 }} /> : <div className="ph0" style={{ height: 120, borderRadius: 8 }} />}
                            <b>{c.name}</b>
                            <div className="mu-t">{ps.length} {t("products")}</div>
                        </Link>
                    );
                })}
            </div>
            {!cols.length && <p className="mu-t">{t("No collections yet.")}</p>}
        </>
    );
}

export function CollectionPage() {
    const { id } = useParams();
    const d = useShopData();
    const t = useT();
    const fx = useFx(d?.settings);
    const { data: cols } = useLoad(() => api.storefront.collections(shopStore()), []);
    const col = cols?.find((c) => c.id === id);
    useSeo(col?.name ?? "Collection", undefined, d?.settings.storeName);
    if (!d || !cols) return <Loading />;
    if (!col) return <p>{t("Collection not found.")} <Link to="/shop/collections">{t("All collections")}</Link></p>;
    const ps = collectionProducts(col, d.products);
    return (
        <>
            <p className="mu-t"><Link to="/shop/collections">{t("Collections")}</Link> / {col.name}</p>
            <h1 className="sec-t">{col.name}</h1>
            {col.image && <img src={col.image} alt="" style={{ maxWidth: 480, borderRadius: 8, marginBottom: 12 }} />}
            <p className="mu-t">{ps.length} {t("products")}</p>
            <div className="pgrid">{ps.map((p) => <ProductCard key={p.id} p={p} fmt={fx.fmt} />)}</div>
            {!ps.length && <p className="mu-t">{t("No products in this collection yet.")}</p>}
        </>
    );
}

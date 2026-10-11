import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Loading } from "../components/polaris";

/**
 * Shareable store URL: /s/:subdomain or /shop/:slug → resolves to /shop?store={id}.
 * Merchants share becho-shop.vercel.app/shop/fitcheck with customers.
 */
export default function ShopBySubdomain() {
    const { sub, slug } = useParams<{ sub: string; slug: string }>();
    const name = sub || slug;
    const nav = useNavigate();
    useEffect(() => {
        if (!name) { nav("/shop", { replace: true }); return; }
        api.storefront.bySubdomain(name)
            .then((r) => {
                try { sessionStorage.setItem("becho-shop-store", r.storeId); } catch { /* ignore */ }
                nav(`/shop?store=${r.storeId}`, { replace: true });
            })
            .catch(() => nav("/shop", { replace: true }));
    }, [name, nav]);
    return <Loading />;
}

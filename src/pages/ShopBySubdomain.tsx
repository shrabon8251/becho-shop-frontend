import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Loading } from "../components/polaris";

/**
 * Shareable store URL: /s/:subdomain → resolves to /shop?store={id}.
 * Merchants share becho-shop.vercel.app/s/fitcheck with customers.
 */
export default function ShopBySubdomain() {
    const { sub } = useParams<{ sub: string }>();
    const nav = useNavigate();
    useEffect(() => {
        if (!sub) { nav("/shop", { replace: true }); return; }
        api.storefront.bySubdomain(sub)
            .then((r) => nav(`/shop?store=${r.storeId}`, { replace: true }))
            .catch(() => nav("/shop", { replace: true }));
    }, [sub, nav]);
    return <Loading />;
}

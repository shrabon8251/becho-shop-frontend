import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Loading } from "../components/polaris";
import ShopLayout from "./shop/ShopLayout";

/**
 * Shop URL with slug: /shop/:slug/* → resolves slug to storeId,
 * saves to sessionStorage (so shopStore() works for all child pages),
 * then renders the standard ShopLayout with nested routes.
 * Example: /shop/fitcheck/products → FitCheck's products page.
 */
export default function ShopSlugLayout() {
    const { slug } = useParams<{ slug: string }>();
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!slug) { setFailed(true); return; }
        // Check if we already resolved this slug.
        try {
            const cached = sessionStorage.getItem(`becho-shop-slug-${slug.toLowerCase()}`);
            if (cached) {
                sessionStorage.setItem("becho-shop-store", cached);
                setReady(true);
                return;
            }
        } catch { /* ignore */ }
        api.storefront.bySubdomain(slug.toLowerCase().trim())
            .then((r) => {
                try {
                    sessionStorage.setItem("becho-shop-store", r.storeId);
                    sessionStorage.setItem(`becho-shop-slug-${slug.toLowerCase()}`, r.storeId);
                } catch { /* ignore */ }
                setReady(true);
            })
            .catch(() => setFailed(true));
    }, [slug]);

    if (failed) {
        return (
            <div style={{ padding: 40, textAlign: "center" }}>
                <h2>Shop not found</h2>
                <p>The shop "{slug}" does not exist.</p>
                <a href="/shop">Go to shop</a>
            </div>
        );
    }
    if (!ready) return <Loading />;
    return <ShopLayout />;
}

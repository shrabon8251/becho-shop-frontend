import { api } from "../api";
import type { AppsConfig, DeliveryProfile, Discount, Product, Settings, Theme, Variant } from "../types";
import { useLoad } from "./useLoad";
/**
 * Storefront store id.
 * Resolved from the `?store=` query param or the VITE_STOREFRONT_STORE_ID
 * env var (set per storefront deployment). Never hardcode a production
 * store id here.
 */
function resolveShopStore(): string {
    try {
        const q = new URLSearchParams(window.location.search).get("store");
        if (q && q.trim()) {
            // Remember for navigation within the shop (links don't carry ?store=).
            try { sessionStorage.setItem("becho-shop-store", q.trim()); } catch { /* ignore */ }
            return q.trim();
        }
        // Fall back to the store resolved from /shop/:slug (if any).
        const saved = sessionStorage.getItem("becho-shop-store");
        if (saved && saved.trim()) return saved.trim();
    } catch { /* ignore */ }
    const env = (import.meta.env.VITE_STOREFRONT_STORE_ID as string | undefined)?.trim();
    if (env) return env;
    // Misconfigured storefront deployment: never SILENTLY fall back to a demo
    // store id. Log loudly (fail-visible) — "st1" does not exist on the real
    // backend, so the storefront will render empty until VITE_STOREFRONT_STORE_ID
    // (or ?store=) is configured for this deployment.
    console.error('[becho] VITE_STOREFRONT_STORE_ID is not set and no ?store= param — using demo store id "st1", which does not exist on the real backend. Set VITE_STOREFRONT_STORE_ID for this storefront deployment.');
    return "st1";
}
/** Store id for the storefront. Resolved FRESH on every call from the current
 * `?store=` query param (or VITE_STOREFRONT_STORE_ID) — NOT a module-level
 * constant, because client-side navigation (e.g. /admin → /shop?store=...)
 * does not re-evaluate module scope. */
export function shopStore(): string {
    return resolveShopStore();
}

import { useAuth } from "../store/auth";  // top-এ import-এ যোগ করো (যদি না থাকে)

/** Merchant নিজের store দেখলে তার storeId, নাহলে null */
export function ownStoreId(): string | null {
    try {
        const me = useAuth.getState().user?.storeId ?? null;
        const viewing = shopStore();
        return me && me === viewing ? me : null;
    } catch { return null; }
}


export interface ShopData {
    products: Product[];
    settings: Settings;
    discounts: Discount[];
    theme: Theme;
    apps: AppsConfig;
    profiles: DeliveryProfile[];
    /** Non-critical endpoints that failed to load; "" when everything loaded. */
    error: string;
}

/** "Everything off" apps config — safe fallback when the apps call fails. */
const APPS_OFF: AppsConfig = {
    bar: { on: false, text: "" }, reviews: { on: false },
    emailPopups: { on: false, title: "", text: "", delaySec: 0, code: "" },
    liveChat: { on: false, welcome: "" },
    currency: { on: false },
    instaFeed: { on: false, images: [] },
    faqPage: { on: false, items: [] },
    backInStock: { on: false },
};

/**
 * Storefront data for a store (public endpoints — no login needed).
 * products/settings/theme are critical — without them the shop cannot render,
 * so a failure there returns null (callers keep their loading state).
 * discounts/apps are best-effort: one of them failing no longer blanks the
 * whole shop; the failure is reported in `error` instead.
 * (shippingProfiles uses the public /shippingProfiles/public endpoint.)
 *
 * `storeId` override: storefront pages omit it and resolve the public
 * storefront store via `?store=` / VITE_STOREFRONT_STORE_ID. Merchant pages
 * (e.g. ThemeBuilder) must pass their own store id — the public resolution
 * has no `?store=` there and would load the wrong store (or demo "st1").
 */
export function useShopData(storeId?: string): ShopData | null {
    const sid = storeId ?? shopStore();
    const { data } = useLoad(async (): Promise<ShopData> => {
        const [pr, se, di, th, ap, sp] = await Promise.allSettled([
            api.storefront.products(sid),
            api.storefront.settings(sid),
            api.storefront.discounts(sid),
            api.storefront.theme(sid),
            api.storefront.apps(sid),
            // Public shipping profiles for checkout (no auth needed).
            fetch(`${import.meta.env.VITE_API_URL}/stores/${sid}/shippingProfiles/public`).then((r) => r.ok ? r.json() : []).catch(() => []),
        ]);
        // Resilience: never throw — one failed call shouldn't blank the whole page.
        const failed: string[] = [];
        const grab = <T>(r: PromiseSettledResult<T>, fallback: T, name: string): T => {
            if (r.status === "fulfilled") return r.value;
            failed.push(name);
            return fallback;
        };
        const products = grab(pr, [], "products").filter((p) => p.status === "Active");
        const settings = grab(se, {} as Settings, "settings");
        const theme = grab(th, {} as Theme, "theme");
        return {
            products,
            settings,
            theme,
            discounts: grab(di, [], "discounts"),
            apps: grab(ap, APPS_OFF, "apps"),
            profiles: grab(sp, [], "shipping"),
            error: failed.length ? `Some store data failed to load (${failed.join(", ")}).` : "",
        };
    }, [sid]);
    return data;
}
export const variantIndex = (products: Product[]) => new Map<string, { p: Product; v: Variant }>(products.flatMap((p) => p.variants.map((v) => [v.id, { p, v }] as const)));

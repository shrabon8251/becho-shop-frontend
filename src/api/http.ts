import type { Api, Crud } from "./types";
import type { Automation, DeliveryProfile, DraftOrder, GiftCard, Location, CustomerSegment, Domain, Settings, AppsConfig, User } from "../types";
import { normalizeStaffRole } from "../lib/perms";
import { THEMES, DEFAULT_THEME } from "../lib/theme";
// Real backend: implement the REST paths below 1:1. The Api interface in
// ./types.ts is the contract — these paths are its concrete mapping.
// New stores have NULL settings JSON — the backend returns just {storeId, currency}.
// Merge over safe defaults so pages (Shipping, Taxes, ...) never crash on missing fields.
const normalizeSettings = (s: unknown): Settings => {
    const d = (s ?? {}) as Record<string, unknown>;
    const tax = (d.tax ?? {}) as Record<string, unknown>;
    const pay = (d.pay ?? {}) as Record<string, unknown>;
    return {
        ...(d as object),
        storeName: typeof d.storeName === "string" ? d.storeName : "",
        currency: typeof d.currency === "string" ? d.currency : "BDT",
        zones: Array.isArray(d.zones) ? d.zones : [],
        freeOver: Number(d.freeOver ?? 0),
        tax: { on: tax.on === true, rate: Number(tax.rate ?? 0), inclusive: tax.inclusive === true },
        taxRegions: Array.isArray(d.taxRegions) ? d.taxRegions : [],
        pay: { cod: pay.cod !== false, card: pay.card === true, ...(pay as object) },
    } as Settings;
};
// The backend returns {"storeId":"...","preset":"minimal"} when a store never
// saved a theme. Resolve the preset to the real built-in theme object —
// otherwise HomeSections (theme.sections.filter) and ThemeBuilder
// (t.sections.map) crash on the missing sections array.
const normalizeTheme = (t: unknown): import("../types").Theme => {
    const d = (t ?? {}) as Record<string, unknown>;
    if (!Array.isArray(d.sections)) {
        const preset = THEMES.find((x) => x.id === d.preset);
        const base = preset ? preset.theme : DEFAULT_THEME;
        return JSON.parse(JSON.stringify(base));
    }
    return t as import("../types").Theme;
};
// The backend's default apps config only ships {bar, reviews, installed}.
// Fill every builtin flag so AppsPage never crashes on a fresh store.
const normalizeApps = (a: unknown): AppsConfig => {
    const d = (a ?? {}) as Record<string, unknown>;
    const g = (k: string) => (d[k] ?? {}) as Record<string, unknown>;
    const bar = g("bar"), reviews = g("reviews"), emailPopups = g("emailPopups"),
        liveChat = g("liveChat"), currency = g("currency"), instaFeed = g("instaFeed"),
        faqPage = g("faqPage"), backInStock = g("backInStock");
    return {
        ...(d as object),
        bar: { on: bar.on === true, text: typeof bar.text === "string" ? bar.text : "" },
        reviews: { on: reviews.on === true },
        emailPopups: {
            on: emailPopups.on === true,
            title: typeof emailPopups.title === "string" ? emailPopups.title : "",
            text: typeof emailPopups.text === "string" ? emailPopups.text : "",
            delaySec: Number(emailPopups.delaySec ?? 0),
            code: typeof emailPopups.code === "string" ? emailPopups.code : "",
        },
        liveChat: { on: liveChat.on === true, welcome: typeof liveChat.welcome === "string" ? liveChat.welcome : "" },
        currency: { on: currency.on === true },
        instaFeed: { on: instaFeed.on === true, images: Array.isArray(instaFeed.images) ? instaFeed.images : [] },
        faqPage: { on: faqPage.on === true, items: Array.isArray(faqPage.items) ? faqPage.items : [] },
        backInStock: { on: backInStock.on === true },
        installed: Array.isArray(d.installed) ? d.installed : [],
    } as AppsConfig;
};
export function httpApi(base: string): Api {
    // SECURITY NOTE (accepted tradeoff): the JWT lives in localStorage so the
    // SPA can attach it as a Bearer header. Any XSS with page-JS access could
    // exfiltrate it — which is why inline-script injection vectors (e.g.
    // tracking pixel IDs in lib/tracking.ts) are allowlist-validated, and the
    // app ships zero dangerouslySetInnerHTML/eval. The stronger alternative is
    // an httpOnly cookie + CSRF protection, but that needs backend Set-Cookie /
    // CSRF support first; until then this tradeoff is documented, not ignored.
    // Read the stored JWT (if any) for the Authorization header.
    const authHeader = (): Record<string, string> => {
        try {
            const t = localStorage.getItem("token");
            return t ? { Authorization: `Bearer ${t}` } : {};
        } catch { return {}; }
    };
    // A 401 means the JWT is dead (expired/revoked). Drop all local session
    // state and send the merchant back to login with a message, instead of
    // leaving the UI "logged in" while every request fails. Never redirect from
    // the auth pages themselves (a failed login attempt is also a 401).
    const AUTH_PAGES = /\/(login|signup|verify[^/]*)\/?$/;
    const isAuthPage = () => typeof location !== "undefined" && AUTH_PAGES.test(location.pathname);
    // Public storefront pages never carry a merchant JWT: a 401 there means the
    // endpoint needs a merchant session, NOT that anyone's session expired.
    // Never bounce shoppers to the merchant login — just throw so the caller's
    // catch block handles it (e.g. Checkout's loyalty lookup, Account page).
    const PUBLIC_PAGES = /^\/($|shop|preview|payment)(\/|$)/;
    const isPublicPage = () => typeof location !== "undefined" && PUBLIC_PAGES.test(location.pathname);
    // Read the backend's real error message (ApiResponse fail shape:
    // {success:false, error:{message}}) so credential failures show what
    // actually went wrong instead of a generic message.
    const backendMessage = async (res: Response, fallback: string): Promise<string> => {
        try {
            const text = await res.text();
            try {
                const j = JSON.parse(text) as { error?: { message?: string }; message?: string };
                return j?.error?.message ?? j?.message ?? text ?? fallback;
            } catch { return text || fallback; }
        } catch { return fallback; }
    };
    const onUnauthorized = (): never => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("becho-merchant-auth");
        } catch { /* ignore */ }
        if (typeof location !== "undefined") {
            const p = location.pathname;
            if (!AUTH_PAGES.test(p)) location.href = "/login?expired=1";
        }
        throw new Error("Session expired. Please log in again.");
    };
    const req = async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
        const res = await fetch(base + path, {
            method,
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (res.status === 401) {
            // On an auth page a 401 is a credential failure (wrong email/password),
            // not an expired session — show the backend's real message.
            if (isAuthPage()) throw new Error(await backendMessage(res, "Invalid email or password"));
            // On public storefront pages a 401 must not redirect to the merchant
            // login; the shopper has no merchant session to expire.
            if (isPublicPage()) throw new Error(await backendMessage(res, "Request failed"));
            onUnauthorized();
        }
        if (!res.ok) throw new Error(await backendMessage(res, res.statusText));
        if (res.status === 204) return undefined as T;
        const json = await res.json();
        // Backend wraps some responses in {success, data, error} (ApiResponse).
        // Unwrap it; pass through raw responses untouched.
        let out: unknown = json;
        if (json && typeof json === "object" && "success" in json && "data" in json) {
            if (!json.success) throw new Error((json as { error?: { message?: string } }).error?.message || "Request failed");
            out = (json as { data: unknown }).data;
        }
        // Backend paginates lists as {items, nextCursor, hasMore} (KeysetPage);
        // the frontend expects a plain array.
        if (out && typeof out === "object" && Array.isArray((out as { items?: unknown }).items)) {
            return (out as { items: T }).items;
        }
        return out as T;
    };
    const crud = <T extends { id: string }>(name: string): Crud<T> => ({
        list: (s) => req(`/stores/${s}/${name}`),
        save: (s, x) => req(`/stores/${s}/${name}/${x.id}`, "PUT", x),
        remove: (s, id) => req(`/stores/${s}/${name}/${id}`, "DELETE"),
    });
    // Helper: store JWT from auth responses in localStorage for subsequent requests.
    // Also normalize backend user shapes (e.g. lowercase staff roles) to the
    // frontend's expected unions — see normalizeStaffRole.
    const normalizeUser = <T,>(u: T): T => {
        if (u && typeof u === "object") {
            const o = u as Record<string, unknown>;
            if ("staffRole" in o) o.staffRole = normalizeStaffRole(o.staffRole);
        }
        return u;
    };
    // Backend OrderDto/CustomerDto use different field names than the frontend
    // types — map them here so pages keep working unchanged.
    const normalizeOrder = (o: unknown): import("../types").Order => {
        const d = (o ?? {}) as Record<string, unknown>;
        const payRaw = String(d.financialStatus ?? d.pay ?? "pending").toLowerCase();
        const fulRaw = String(d.fulfillmentStatus ?? d.ful ?? "unfulfilled").toLowerCase();
        const pay = (payRaw === "paid" ? "Paid" : payRaw === "refunded" ? "Refunded" : payRaw === "cancelled" ? "Cancelled" : "Pending") as import("../types").PayStatus;
        const ful = (fulRaw === "fulfilled" ? "Fulfilled" : fulRaw === "cancelled" ? "Cancelled" : "Unfulfilled") as import("../types").FulfillStatus;
        const lines = Array.isArray(d.lines) ? d.lines : Array.isArray(d.items) ? d.items : [];
        return {
            ...(d as object),
            id: Number(d.id ?? 0),
            pay, ful,
            // Backend sends discountCode/giftAppliedMinor; frontend expects code/giftApplied.
            code: (d.discountCode ?? d.code ?? "") as string,
            // MONEY BOUNDARY: backend minor units (poisha) → frontend taka.
            refunded: Number(d.refunded ?? 0) / 100,
            giftApplied: d.giftAppliedMinor != null ? Number(d.giftAppliedMinor) / 100 : Number(d.giftApplied ?? 0),
            items: lines.map((l: unknown) => {
                const ll = (l ?? {}) as Record<string, unknown>;
                return { variantId: String(ll.variantId ?? ""), qty: Number(ll.quantity ?? ll.qty ?? 1) };
            }),
            createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.parse(String(d.createdAt ?? "")) || Date.now(),
            payMethod: (d.paymentMethod ?? d.payMethod ?? "") as string,
        } as import("../types").Order;
    };
    const normalizeCustomer = (c: unknown): import("../types").Customer => {
        const d = (c ?? {}) as Record<string, unknown>;
        const name = [d.firstName, d.lastName].filter(Boolean).join(" ") || String(d.name ?? "");
        return {
            ...(d as object),
            id: String(d.id ?? ""),
            name,
            addresses: Array.isArray(d.addresses) ? d.addresses : [],
        } as import("../types").Customer;
    };
    const normalizeProduct = (p: unknown): import("../types").Product => {
        const o = (p ?? {}) as Record<string, unknown>;
        const st = String(o.status ?? "draft").toLowerCase();
        return {
            ...(o as object),
            id: String(o.id ?? ""),
            status: (st === "active" ? "Active" : "Draft") as "Active" | "Draft",
            // Backend uses `videoUrl`, frontend uses `video`
            video: (o.videoUrl ?? o.video) as string | undefined,
            variants: Array.isArray(o.variants) ? o.variants.map((v: unknown) => {
                const vv = (v ?? {}) as Record<string, unknown>;
                // MONEY BOUNDARY: the backend stores money in minor units (poisha);
                // the frontend works in taka everywhere. Convert on the way in.
                return {
                    ...vv,
                    id: String(vv.id ?? ""),
                    price: Number(vv.price ?? 0) / 100,
                    compareAt: vv.compareAt == null || vv.compareAt === "" ? undefined : Number(vv.compareAt) / 100,
                };
            }) : [],
        } as import("../types").Product;
    };
    /** Frontend taka → backend minor units (poisha) for product writes. */
    const toMinorProduct = (p: unknown): unknown => {
        const d = (p ?? {}) as Record<string, unknown>;
        return {
            ...(d as object),
            // Frontend uses `video`, backend uses `videoUrl`
            videoUrl: d.videoUrl ?? d.video,
            variants: Array.isArray(d.variants) ? (d.variants as unknown[]).map((v) => {
                const vv = (v ?? {}) as Record<string, unknown>;
                return {
                    ...vv,
                    price: Math.round(Number(vv.price ?? 0) * 100),
                    compareAt: vv.compareAt == null || vv.compareAt === "" ? vv.compareAt : Math.round(Number(vv.compareAt) * 100),
                };
            }) : d.variants,
        };
    };
    // Gift cards: same money boundary as products — backend stores initial/balance
    // in minor units, the frontend works in taka.
    const normalizeGiftCard = (g: unknown): import("../types").GiftCard => {
        const d = (g ?? {}) as Record<string, unknown>;
        return {
            ...(d as object),
            initial: Number(d.initial ?? 0) / 100,
            balance: Number(d.balance ?? 0) / 100,
        } as import("../types").GiftCard;
    };
    const toMinorGiftCard = (g: unknown): unknown => {
        const d = (g ?? {}) as Record<string, unknown>;
        return {
            ...(d as object),
            initial: Math.round(Number(d.initial ?? 0) * 100),
            balance: Math.round(Number(d.balance ?? 0) * 100),
        };
    };
    // Discounts: backend stores value/minimum in minor units for "$" (fixed-amount)
    // discounts; "%" values are plain percentages and pass through untouched.
    const normalizeDiscount = (x: unknown): import("../types").Discount => {
        const d = (x ?? {}) as Record<string, unknown>;
        return {
            ...(d as object),
            value: d.type === "$" ? Number(d.value ?? 0) / 100 : Number(d.value ?? 0),
            minimum: d.minimum == null || d.minimum === "" ? d.minimum : Number(d.minimum) / 100,
        } as import("../types").Discount;
    };
    const toMinorDiscount = (x: unknown): unknown => {
        const d = (x ?? {}) as Record<string, unknown>;
        return {
            ...(d as object),
            value: d.type === "$" ? Math.round(Number(d.value ?? 0) * 100) : d.value,
            minimum: d.minimum == null || d.minimum === "" ? d.minimum : Math.round(Number(d.minimum) * 100),
        };
    };
    const withToken = async (p: Promise<User & { token?: string | null; accessToken?: string | null }>): Promise<User> => {
        const u = normalizeUser(await p);
        // Backend returns { accessToken, refreshToken, ... } (TokenResponse);
        // older builds used { token }. Accept both, prefer accessToken.
        const t = (u as unknown as Record<string, unknown>).accessToken ?? u.token;
        if (u && t) {
            try { localStorage.setItem("token", String(t)); } catch { /* ignore */ }
        }
        return u;
    };
    return {
        auth: {
            login: (email, password) => withToken(req<User & { token?: string | null }>("/auth/login", "POST", { email, password })),
            signup: (name, email, password, phone?, termsAcceptedAt?) => withToken(req<User & { token?: string | null }>("/auth/signup", "POST", { name, email, password, phone, termsAcceptedAt })),
            google: (idToken) => withToken(req<User & { token?: string | null }>("/auth/google", "POST", { idToken })),
            verifyEmail: (email, code) => withToken(req<User & { token?: string | null }>("/auth/verify-email", "POST", { email, code })),
            verifyPhone: (email, code) => withToken(req<User & { token?: string | null }>("/auth/verify-phone", "POST", { email, code })),
            resendEmailCode: (email) => req("/auth/verify-email/resend", "POST", { email }).then(() => undefined),
            sendPhoneCode: (email) => req("/auth/verify-phone/send", "POST", { email }).then(() => undefined),
            forgotPassword: (email) => req("/auth/forgot-password", "POST", { email }).then(() => undefined),
            resetPassword: (email, code, newPassword) => req("/auth/reset-password", "POST", { email, code, newPassword }).then(() => undefined),
        },
        products: {
            list: (s) => req<unknown[]>(`/stores/${s}/products`).then((ps) => ps.map(normalizeProduct)),
            // New products MUST go through POST create: the backend assigns the numeric
            // id server-side. PUT save with a client-generated UUID id gets a 400
            // because the backend declares @PathVariable Long id.
            // Prices are converted taka → minor units at the boundary (toMinorProduct).
            create: (s, p) => req<unknown>(`/stores/${s}/products`, "POST", toMinorProduct(p)).then(normalizeProduct),
            save: (s, p) => req<unknown>(`/stores/${s}/products/${p.id}`, "PUT", toMinorProduct(p)).then(normalizeProduct),
            remove: (s, id) => req(`/stores/${s}/products/${id}`, "DELETE"),
        },
        orders: {
            list: (s) => req<unknown[]>(`/stores/${s}/orders`).then((os) => os.map(normalizeOrder)),
            update: (s, id, patch, event) => req<unknown>(`/stores/${s}/orders/${id}`, "PATCH", { patch, event }).then(normalizeOrder),
            create: (s, input) => req<unknown>(`/stores/${s}/orders`, "POST", input).then(normalizeOrder),
            cancel: (s, id) => req<unknown>(`/stores/${s}/orders/${id}/cancel`, "POST").then(normalizeOrder),
            fulfill: (s, id) => req<unknown>(`/stores/${s}/orders/${id}/fulfill`, "POST").then(normalizeOrder),
            /** amount in minor units (poisha). Callers must convert from taka: Math.round(taka * 100). */
            refund: (s, id, amount) => req<unknown>(`/stores/${s}/orders/${id}/refund`, "POST", { amount }).then(normalizeOrder),
        },
        stores: {
            get: (id) => req(`/stores/${id}`),
            list: () => req("/platform/stores"),
            available: async (sub) => (await req<{ available: boolean }>(`/stores/available?sub=${encodeURIComponent(sub)}`)).available,
            create: (userId, input) => req("/stores", "POST", { userId, ...input }),
            update: (id, patch) => req(`/stores/${id}`, "PATCH", patch),
            remove: (id) => req(`/stores/${id}`, "DELETE"),
        },
        billing: {
            setMethod: (id, method) => req(`/stores/${id}/billing/method`, "PUT", method),
            getMethod: (id) => req(`/stores/${id}/billing/method`),
            plans: (id) => req(`/stores/${id}/billing/plans`),
            quote: (id, plan, cycle, promoCode) => req(`/stores/${id}/billing/quote`, "POST", { plan, cycle, promoCode }),
            subscribe: (id, plan, cycle = "monthly", promoCode) => req(`/stores/${id}/billing/subscribe`, "POST", { plan, cycle, promoCode }),
            confirm: (id, trxId) => req(`/stores/${id}/billing/confirm`, "POST", { trxId }),
            initiateSslCommerz: (id, plan, cycle, promoCode) => req(`/stores/${id}/billing/sslcommerz/initiate`, "POST", { plan, cycle, promoCode }),
        },
        contact: {
            send: (input) => req(`/contact`, "POST", input),
        },
        uploads: {
            async image(s, file) {
                const fd = new FormData(); fd.append("file", file);
                const res = await fetch(`${base}/stores/${s}/uploads`, { method: "POST", headers: authHeader(), body: fd });
                if (res.status === 401) onUnauthorized();
                if (!res.ok) throw new Error(await backendMessage(res, res.statusText));
                return ((await res.json()) as { url: string }).url;
            },
        },
        account: {
            signup: (s, name, email, password) => req(`/stores/${s}/account/signup`, "POST", { name, email, password }),
            login: (s, email, password) => req(`/stores/${s}/account/login`, "POST", { email, password }),
            google: (s, idToken) => req(`/stores/${s}/account/google`, "POST", { idToken }),
            verifyEmail: (s, id) => req(`/stores/${s}/account/${id}/verify-email`, "POST"),
            verifyPhone: (s, id) => req(`/stores/${s}/account/${id}/verify-phone`, "POST"),
            orders: (s, id) => req(`/stores/${s}/account/${id}/orders`),
            update: (s, c) => req(`/stores/${s}/account/${c.id}`, "PUT", c),
            changePassword: (s, id, password) => req(`/stores/${s}/account/${id}/password`, "PUT", { password }),
        },
        settings: { get: (s) => req(`/stores/${s}/settings`).then(normalizeSettings), save: (s, x) => req(`/stores/${s}/settings`, "PUT", x) },
        customers: {
            list: (s) => req<unknown[]>(`/stores/${s}/customers`).then((cs) => cs.map(normalizeCustomer)),
            save: (s, x) => req<unknown>(`/stores/${s}/customers/${x.id}`, "PUT", x).then(normalizeCustomer),
            remove: (s, id) => req(`/stores/${s}/customers/${id}`, "DELETE"),
        },
        campaigns: crud("campaigns"),
        giftCards: {
            ...crud<GiftCard>("gift-cards"),
            // Money boundary: backend minor units ↔ frontend taka.
            list: (s) => req<unknown[]>(`/stores/${s}/gift-cards`).then((gs) => gs.map(normalizeGiftCard)),
            save: (s, x) => req<unknown>(`/stores/${s}/gift-cards/${x.id}`, "PUT", toMinorGiftCard(x)).then(normalizeGiftCard),
            check: (s, code) => req<{ balance: number }>(`/stores/${s}/gift-cards/check`, "POST", { code }).then((r) => ({ balance: r.balance / 100 })),
        },
        emailTemplates: { list: (s) => req(`/stores/${s}/email-templates`), save: (s, t) => req(`/stores/${s}/email-templates/${t.key}`, "PUT", t) },
        support: {
            list: (s) => req(`/stores/${s}/support/tickets`),
            create: (s, subject, message) => req(`/stores/${s}/support/tickets`, "POST", { subject, message }),
            reply: (s, id, text) => req(`/stores/${s}/support/tickets/${id}/reply`, "POST", { text }),
        },
        platform: {
            plans: { get: () => req("/platform/plans"), save: (p) => req("/platform/plans", "PUT", p) },
            tickets: { list: () => req("/platform/tickets"), reply: (id, text) => req(`/platform/tickets/${id}/reply`, "POST", { text }), setStatus: (id, status) => req(`/platform/tickets/${id}`, "PATCH", { status }) },
            impersonate: (storeId) => req(`/platform/stores/${storeId}/impersonate`, "POST"),
            announcements: {
                list: () => req("/platform/announcements"),
                create: (input) => req("/platform/announcements", "POST", input),
                update: (id, patch) => req(`/platform/announcements/${id}`, "PATCH", patch),
                remove: (id) => req(`/platform/announcements/${id}`, "DELETE"),
            },
            landing: {
                get: () => req("/platform/landing"),
                save: (c) => req("/platform/landing", "PUT", c),
            },
            demoThemes: { list: () => req("/platform/demo-themes") },
        },
        tracking: { lookup: (s, orderId, email) => req(`/stores/${s}/track`, "POST", { orderId, email }) },
        fraud: { check: (s, phone) => req(`/stores/${s}/fraud-check`, "POST", { phone }) },
        checkout: {
            createOrder: (s, input) => req(`/stores/${s}/checkout/orders`, "POST", input),
        },
        payments: {
            createIntent: (s, orderId, provider = "sslcommerz") => req(`/stores/${s}/payments/intents`, "POST", { orderId, provider }),
            demoCallback: () => Promise.reject(new Error("Demo gateway is only available in demo mode")),
        },
        pos: { sale: (s, input) => req(`/stores/${s}/pos/sales`, "POST", input) },
        theme: { get: (s) => req<unknown>(`/stores/${s}/theme`).then(normalizeTheme), save: (s, t) => req(`/stores/${s}/theme`, "PUT", t) },
        apps: { get: (s) => req(`/stores/${s}/apps`).then(normalizeApps), save: (s, c) => req(`/stores/${s}/apps`, "PUT", c) },
        reviews: crud("reviews"),
        posts: crud("posts"),
        payouts: { list: (s) => req(`/stores/${s}/payouts`), request: (s, amount) => req(`/stores/${s}/payouts`, "POST", { amount }) },
        staff: crud("staff"),
        collections: crud("collections"),
        discounts: {
            ...crud<import("../types").Discount>("discounts"),
            // Money boundary: backend minor units ↔ frontend taka ("$" value + minimum).
            list: (s) => req<unknown[]>(`/stores/${s}/discounts`).then((ds) => ds.map(normalizeDiscount)),
            save: (s, x) => req<unknown>(`/stores/${s}/discounts/${x.id}`, "PUT", toMinorDiscount(x)).then(normalizeDiscount),
        },
        locations: crud<Location>("locations"),
        inventory: {
            levels: (s) => req(`/stores/${s}/inventory/levels`),
            set: (s, variantId, locationId, qty) => req(`/stores/${s}/inventory/levels`, "PUT", { variantId, locationId, qty }),
            transfers: (s) => req(`/stores/${s}/inventory/transfers`),
            transfer: (s, fromId, toId, items) => req(`/stores/${s}/inventory/transfers`, "POST", { fromId, toId, items }),
        },
        draftOrders: { ...crud<DraftOrder>("draft-orders"), complete: (s, id) => req(`/stores/${s}/draft-orders/${id}/complete`, "POST") },
        returns: {
            list: (s) => req(`/stores/${s}/returns`),
            create: (s, input) => req(`/stores/${s}/returns`, "POST", input),
            setStatus: (s, id, status) => req(`/stores/${s}/returns/${id}`, "PATCH", { status }),
        },
        segments: crud<CustomerSegment>("segments"),
        automations: crud<Automation>("automations"),
        shippingProfiles: crud<DeliveryProfile>("shippingProfiles"),
        abandoned: {
            list: (s) => req(`/stores/${s}/abandoned-checkouts`),
            recover: (s, id) => req(`/stores/${s}/abandoned-checkouts/${id}/recover`, "POST"),
        },
        stockAlerts: {
            subscribe: (s, productId, email) => req(`/stores/${s}/stock-alerts`, "POST", { productId, email }),
            list: (s) => req(`/stores/${s}/stock-alerts`),
            notify: (s, productId) => req(`/stores/${s}/stock-alerts/notify`, "POST", { productId }),
        },
        domains: { ...crud<Domain>("domains"), setPrimary: (s, id) => req(`/stores/${s}/domains/${id}/primary`, "POST") },
        loyalty: {
            get: (s) => req(`/stores/${s}/loyalty`),
            save: (s, x) => req(`/stores/${s}/loyalty`, "PUT", x),
            adjust: (s, id, delta, reason) => req(`/stores/${s}/customers/${id}/points`, "POST", { delta, reason }),
        },
        bundles: crud("bundles"),
        redirects: crud("redirects"),
        webhooks: { ...crud("webhooks"), ping: (s, id) => req(`/stores/${s}/webhooks/${id}/ping`, "POST") },
        apiKeys: {
            list: (s) => req(`/stores/${s}/api-keys`),
            create: (s, name) => req(`/stores/${s}/api-keys`, "POST", { name }),
            revoke: (s, id) => req(`/stores/${s}/api-keys/${id}`, "DELETE"),
        },
        activity: {
            list: (s) => req(`/stores/${s}/activity`),
            log: (s, actor, action, detail) => req(`/stores/${s}/activity`, "POST", { actor, action, detail }),
        },
        meta: { resetDemo: () => req("/meta/reset-demo", "POST"), announcements: () => req("/meta/announcements") }, // mock only; the real backend can 404 this
        // Public storefront endpoints (no JWT, rate-limited). For anonymous shoppers.
        // NOTE: backend serves these under /api/storefront/... (PublicStorefrontController).
        storefront: {
            products: (s) => req<unknown[]>(`/api/storefront/stores/${s}/products`).then((ps) => ps.map(normalizeProduct)),
            product: (s, id) => req<unknown>(`/api/storefront/stores/${s}/products/${id}`).then(normalizeProduct),
            settings: (s) => req(`/api/storefront/stores/${s}/settings`).then(normalizeSettings),
            theme: (s) => req<unknown>(`/api/storefront/stores/${s}/theme`).then(normalizeTheme),
            discounts: (s) => req<unknown[]>(`/api/storefront/stores/${s}/discounts`).then((ds) => ds.map(normalizeDiscount)),
            apps: (s) => req(`/api/storefront/stores/${s}/apps`).then(normalizeApps),
            collections: (s) => req(`/api/storefront/stores/${s}/collections`),
            bundles: (s) => req(`/api/storefront/stores/${s}/bundles`),
            posts: (s) => req(`/api/storefront/stores/${s}/posts`),
            bySubdomain: (sub) => req<{ storeId: string; name: string; subdomain: string }>(`/api/storefront/by-subdomain/${sub}`),
        },
    };
}

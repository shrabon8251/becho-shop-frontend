import type { Announcement, Ticket, GiftCard, EmailTemplate, PlanPrices, User, TrackedOrder, PosSaleInput, AppsConfig, Post, Review, Theme, Campaign, Payout, StaffMember, NewStore, Store, StoreRow, CheckoutInput, CheckoutOrderInput, CheckoutOrderResult, PaymentIntentResult, Settings, Collection, Customer, Discount, Order, Product, Location, StockLevel, StockTransfer, DraftOrder, OrderReturn, ReturnItem, CustomerSegment, Automation, AbandonedCheckout, StockAlert, Domain, DeliveryProfile, LoyaltySettings, Bundle, Redirect, Webhook, ApiKey, ActivityEntry, PayMethod } from "../types";
/**
 * API CONTRACT — the single source of truth for the backend.
 *
 * The frontend NEVER talks to a backend directly; every call goes through this
 * interface (`src/api/index.ts` picks the mock or the real HTTP implementation).
 * When you build the backend later, implement these endpoints 1:1 — the REST
 * paths are documented in `src/api/http.ts` next to each method.
 *
 * Conventions for the backend:
 * - Scope EVERY query by storeId; verify the caller owns / staffs that store.
 * - `platform.*` is platform-admin only.
 * - Mutations that change money or stock (orders.*, pos.sale, payouts.request,
 *   giftCards.check inside orders.create) must run server-side with transactions.
 * - Timestamps are unix ms numbers. Money is decimal in the store currency.
 */
export interface Crud<T> {
    list(storeId: string): Promise<T[]>;
    save(storeId: string, x: T): Promise<T>;
    remove(storeId: string, id: string): Promise<void>;
}
export interface Api {
    auth: {
        login(email: string, password: string): Promise<User>;
        signup(name: string, email: string, password: string, phone?: string, termsAcceptedAt?: string): Promise<User>;
        /** Real Google sign-in: the client sends the GIS ID token; the backend verifies it server-side. */
        google(idToken: string): Promise<User>;
        /** Email/phone verification with the 6-digit code the backend sent. Code is mandatory. */
        verifyEmail(email: string, code: string): Promise<User>;
        verifyPhone(email: string, code: string): Promise<User>;
        /** Re-send the verification code (rate-limited server-side). */
        resendEmailCode(email: string): Promise<void>;
        sendPhoneCode(email: string): Promise<void>;
        /** Forgot password: backend emails a 6-digit reset code (rate-limited). */
        forgotPassword(email: string): Promise<void>;
        /** Reset password with the emailed code. */
        resetPassword(email: string, code: string, newPassword: string): Promise<void>;
    };
    products: {
        list(storeId: string): Promise<Product[]>;
        create(storeId: string, p: Product): Promise<Product>;
        save(storeId: string, p: Product): Promise<Product>;
        remove(storeId: string, id: string): Promise<void>;
    };
    orders: {
        list(storeId: string): Promise<Order[]>;
        update(storeId: string, id: number, patch: Partial<Order>, event?: string): Promise<Order>;
        create(storeId: string, input: CheckoutInput): Promise<Order>;
        cancel(storeId: string, id: number): Promise<Order>; // must restock server-side
        fulfill(storeId: string, id: number): Promise<Order>;
        refund(storeId: string, id: number, amount: number): Promise<Order>;
    };
    settings: { get(storeId: string): Promise<Settings>; save(storeId: string, s: Settings): Promise<Settings> };
    stores: {
        get(id: string): Promise<Store>;
        list(): Promise<StoreRow[]>; // platform admin only
        available(sub: string): Promise<boolean>;
        create(userId: string, input: NewStore): Promise<Store>;
        update(id: string, patch: Partial<Store>): Promise<Store>;
        remove(id: string): Promise<void>;
    };
    billing: {
        setMethod(id: string, method: PayMethod): Promise<{ kind: string; label: string; trxId: string | null }>; // bkash / nagad / rocket / sslcommerz
        getMethod(id: string): Promise<{ method: { kind: string; label: string; trxId: string | null } | null }>;
        /** Server-driven plans + cycles. Never hardcode prices on the client. */
        plans(id: string): Promise<{ currency: string; plans: { name: string; monthlyPrice: number }[]; cycles: { id: string; months: number; off: number }[] }>;
        quote(id: string, plan: string, cycle: string, promoCode?: string): Promise<{ plan: string; cycle: string; months: number; subtotal: number; discount: number; promoDiscount: number; total: number; currency: string }>;
        subscribe(id: string, plan: string, cycle?: string, promoCode?: string): Promise<{ paymentRequired?: boolean; billingStatus?: string; total?: number; currency?: string } & Partial<Store>>; // pending_payment until confirm
        confirm(id: string, trxId?: string): Promise<{ billingStatus: string; plan?: string; cycle?: string }>;
    };
    /** Public contact form → POST /contact (persisted server-side). */
    contact: {
        send(input: { name: string; email: string; subject?: string; message: string }): Promise<{ id: number }>;
    };
    customers: Crud<Customer>;
    campaigns: Crud<Campaign>;
    giftCards: Crud<GiftCard> & { check(storeId: string, code: string): Promise<{ balance: number }> }; // apply/deduct balance server-side in orders.create
    emailTemplates: { list(storeId: string): Promise<EmailTemplate[]>; save(storeId: string, t: EmailTemplate): Promise<EmailTemplate> }; // sending is done by your backend
    support: {
        list(storeId: string): Promise<Ticket[]>;
        create(storeId: string, subject: string, message: string): Promise<Ticket>;
        reply(storeId: string, id: string, text: string): Promise<Ticket>;
    };
    platform: { // platform admin only: enforce on the server
        plans: { get(): Promise<PlanPrices>; save(p: PlanPrices): Promise<PlanPrices> };
        tickets: { list(): Promise<Ticket[]>; reply(id: string, text: string): Promise<Ticket>; setStatus(id: string, status: Ticket["status"]): Promise<Ticket> };
        announcements: {
            list(): Promise<Announcement[]>;
            create(input: Omit<Announcement, "id" | "createdAt">): Promise<Announcement>;
            update(id: string, patch: Partial<Announcement>): Promise<Announcement>;
            remove(id: string): Promise<void>;
        };
        landing: {
            /** Public — landing page content. */
            get(): Promise<import("../types").LandingContent>;
            /** Super admin only. */
            save(c: import("../types").LandingContent): Promise<import("../types").LandingContent>;
        };
        /** Public — demo theme preview data for the landing page. */
        demoThemes: {
            list(): Promise<{ themes: Array<{ id: string; name: string; products: Array<{ id: string; title: string; price: number; compareAt: number | null; images: string[] }>; heroImage: string }> }>;
        };
        impersonate(storeId: string): Promise<User>; // audit-log this and use a short-lived session
    };
    tracking: { lookup(storeId: string, orderId: number, email: string): Promise<TrackedOrder> }; // return only non-sensitive fields; same error for wrong id or email
    fraud: {
        /** Live fraud check. Backend calls courier APIs server-side (keys never in browser).
         *  Returns { result, live: true } when real courier data was used. */
        check(storeId: string, phone: string): Promise<{ result: import("../lib/fraud").FraudResult; live: boolean }>;
    };
    /** Public storefront checkout — no auth, rate-limited, prices validated server-side. */
    checkout: {
        createOrder(storeId: string, input: CheckoutOrderInput): Promise<CheckoutOrderResult>;
    };
    /** Gateway payment intents — public, rate-limited. */
    payments: {
        createIntent(storeId: string, orderId: number, provider?: string): Promise<PaymentIntentResult>;
        /** Demo only: simulates the gateway callback in mock mode. http throws. */
        demoCallback(storeId: string, orderId: number, ok: boolean): Promise<{ ok: boolean }>;
    };
    pos: { sale(storeId: string, input: PosSaleInput): Promise<Order> }; // check stock and decrement server-side
    theme: { get(storeId: string): Promise<Theme>; save(storeId: string, t: Theme): Promise<Theme> };
    apps: { get(storeId: string): Promise<AppsConfig>; save(storeId: string, c: AppsConfig): Promise<AppsConfig> };
    reviews: Crud<Review>; // public create needs spam control/moderation server-side
    posts: Crud<Post>; // storefront must only receive published posts
    payouts: { list(storeId: string): Promise<Payout[]>; request(storeId: string, amount: number): Promise<Payout> }; // validate the balance server-side
    uploads: { image(storeId: string, file: File): Promise<string> }; // returns a public URL
    account: { // storefront customer accounts (use a separate customer session/token in production)
        signup(storeId: string, name: string, email: string, password: string, phone?: string): Promise<Customer>;
        login(storeId: string, email: string, password: string): Promise<Customer>;
        /** Shopper Google sign-in: real GIS ID token, verified server-side. */
        google(storeId: string, idToken: string): Promise<Customer>;
        verifyEmail(storeId: string, customerId: string): Promise<Customer>;
        verifyPhone(storeId: string, customerId: string): Promise<Customer>;
        orders(storeId: string, customerId: string): Promise<Order[]>;
        update(storeId: string, c: Customer): Promise<Customer>;
        changePassword(storeId: string, customerId: string, password: string): Promise<void>;
    };
    staff: Crud<StaffMember>; // creating a member must also create/invite their login server-side
    collections: Crud<Collection>;
    discounts: Crud<Discount>;
    // ---- Roadmap entities: contract-first, UI arrives phase by phase ----
    locations: Crud<Location>; // inventory locations / warehouses; one must be flagged isDefault
    inventory: {
        levels(storeId: string): Promise<StockLevel[]>; // per-location stock breakdown
        set(storeId: string, variantId: string, locationId: string, qty: number): Promise<StockLevel>; // qty >= 0
        transfers(storeId: string): Promise<StockTransfer[]>;
        transfer(storeId: string, fromId: string, toId: string, items: { variantId: string; qty: number }[]): Promise<StockTransfer>; // must validate source stock server-side
    };
    draftOrders: Crud<DraftOrder> & {
        complete(storeId: string, id: string): Promise<Order>; // converts to a real unpaid order, decrements stock
    };
    returns: {
        list(storeId: string): Promise<OrderReturn[]>;
        create(storeId: string, input: { orderId: number; items: ReturnItem[] }): Promise<OrderReturn>;
        setStatus(storeId: string, id: string, status: OrderReturn["status"]): Promise<OrderReturn>; // "Completed" restocks + refunds server-side
    };
    segments: Crud<CustomerSegment>; // saved customer segments (conditions evaluated server-side)
    automations: Crud<Automation>; // marketing automations/flows (abandoned checkout, welcome, win-back)
    shippingProfiles: Crud<DeliveryProfile>; // delivery profiles: product sets with their own shippable zones
    abandoned: {
        list(storeId: string): Promise<AbandonedCheckout[]>;
        recover(storeId: string, id: string): Promise<AbandonedCheckout>; // backend SENDS the recovery email, then marks recovered
    };
    stockAlerts: {
        subscribe(storeId: string, productId: string, email: string): Promise<void>;
        list(storeId: string): Promise<StockAlert[]>;
        notify(storeId: string, productId: string): Promise<number>; // backend SENDS the alert emails, returns count sent
    };
    domains: Crud<Domain> & {
        setPrimary(storeId: string, id: string): Promise<Domain>;
    };
    meta: {
        resetDemo(): Promise<void>; // mock only: wipes localStorage demo data and re-seeds
        announcements(): Promise<Announcement[]>; // published platform announcements, visible to all store owners
    };
    /** Public storefront endpoints (no JWT). For anonymous shoppers. */
    storefront: {
        products(storeId: string): Promise<Product[]>;
        product(storeId: string, id: string): Promise<Product>;
        settings(storeId: string): Promise<Settings>;
        theme(storeId: string): Promise<Theme>;
        discounts(storeId: string): Promise<Discount[]>;
        apps(storeId: string): Promise<AppsConfig>;
        collections(storeId: string): Promise<Collection[]>;
        bundles(storeId: string): Promise<Bundle[]>;
        posts(storeId: string): Promise<Post[]>;
    };
    loyalty: {
        get(storeId: string): Promise<LoyaltySettings>;
        save(storeId: string, s: LoyaltySettings): Promise<LoyaltySettings>;
        adjust(storeId: string, customerId: string, delta: number, reason: string): Promise<Customer>; // backend validates + logs
    };
    bundles: Crud<Bundle>;
    redirects: Crud<Redirect>;
    webhooks: Crud<Webhook> & { ping(storeId: string, id: string): Promise<void> }; // backend sends a test event
    apiKeys: {
        list(storeId: string): Promise<ApiKey[]>;
        create(storeId: string, name: string): Promise<ApiKey>;
        revoke(storeId: string, id: string): Promise<void>;
    };
    activity: {
        list(storeId: string): Promise<ActivityEntry[]>;
        log(storeId: string, actor: string, action: string, detail?: string): Promise<void>;
    };
}

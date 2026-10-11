import { ToastHost } from "../components/polaris";
import { CommandPalette } from "../components/CommandPalette";
import { api, noBackend } from "../api";
import { useLoad } from "../lib/useLoad";
import { can } from "../lib/perms";
import { Bell } from "../components/Bell";
import { ThemeToggle } from "../components/ThemeToggle";
import { VerifyGate } from "../components/VerifyGate";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { paidDaysLeft, trialDaysLeft } from "../lib/plans";
import { useAuth } from "../store/auth";
import { useLocale, useT } from "../lib/fx";
import type { StaffRole, Store } from "../types";
export interface StoreCtx { store: Store; reload(): void }
const ALL: StaffRole[] = ["Admin", "Manager", "Support"], AM: StaffRole[] = ["Admin", "Manager"], A: StaffRole[] = ["Admin"];
// Collapsible grouped sidebar (Shopify-style). Groups expand on click and
// auto-open when the active route is inside them.
interface NavLeaf { to: string; label: string; roles: StaffRole[]; perm?: string }
interface NavEntry extends NavLeaf { children?: NavLeaf[] }
const NAV: NavEntry[] = [
    { to: "/admin", label: "Home", roles: ALL },
    {
        to: "/admin/orders", label: "Orders", roles: ALL, perm: "orders.view", children: [
            { to: "/admin/orders", label: "Orders", roles: ALL, perm: "orders.view" },
            { to: "/admin/fraud-check", label: "Fraud check", roles: AM, perm: "orders.view" },
        ],
    },
    {
        to: "/admin/products", label: "Products", roles: AM, perm: "products.view", children: [
            { to: "/admin/products", label: "Products", roles: AM, perm: "products.view" },
            { to: "/admin/bundles", label: "Bundles", roles: AM, perm: "products.view" },
            { to: "/admin/collections", label: "Collections", roles: AM, perm: "products.view" },
            { to: "/admin/inventory", label: "Inventory", roles: AM, perm: "products.view" },
        ],
    },
    {
        to: "/admin/customers", label: "Customers", roles: ALL, perm: "customers.view",
    },
    {
        to: "/admin/marketing", label: "Marketing", roles: AM, perm: "marketing.manage", children: [
            { to: "/admin/marketing", label: "Marketing", roles: AM, perm: "marketing.manage" },
            { to: "/admin/discounts", label: "Discounts", roles: AM, perm: "discounts.manage" },
            { to: "/admin/gift-cards", label: "Gift cards", roles: AM, perm: "discounts.manage" },
        ],
    },
    {
        to: "/admin/shipping", label: "Delivery", roles: AM, perm: "settings.manage", children: [
            { to: "/admin/shipping", label: "Shipping", roles: AM, perm: "settings.manage" },
            { to: "/admin/taxes", label: "Taxes", roles: AM, perm: "settings.manage" },
            { to: "/admin/couriers", label: "Couriers", roles: AM, perm: "settings.manage" },
        ],
    },
    {
        to: "/admin/payments", label: "Finance", roles: AM, perm: "settings.manage", children: [
            { to: "/admin/payments", label: "Payments", roles: AM, perm: "settings.manage" },
            { to: "/admin/analytics", label: "Analytics", roles: AM, perm: "orders.view" },
            { to: "/admin/finance", label: "Finance", roles: A, perm: "orders.view" },
        ],
    },
    {
        to: "/admin/theme", label: "Sales channels", roles: AM, perm: "settings.manage", children: [
            { to: "/admin/theme", label: "Online Store", roles: AM, perm: "settings.manage" },
            { to: "/admin/content", label: "Content", roles: AM, perm: "settings.manage" },
            { to: "/admin/redirects", label: "Redirects", roles: AM, perm: "settings.manage" },
            { to: "/admin/pos", label: "Point of Sale", roles: ALL, perm: "orders.manage" },
        ],
    },
    {
        to: "/admin/apps", label: "Apps", roles: A, perm: "settings.manage", children: [
            { to: "/admin/apps", label: "Apps", roles: A, perm: "settings.manage" },
            { to: "/admin/notifications", label: "Notifications", roles: A, perm: "settings.manage" },
            { to: "/admin/webhooks", label: "Webhooks", roles: A, perm: "settings.manage" },
            { to: "/admin/api-keys", label: "API keys", roles: A, perm: "settings.manage" },
        ],
    },
    {
        to: "/admin/settings", label: "Store", roles: A, perm: "settings.manage", children: [
            { to: "/admin/staff", label: "Staff", roles: A, perm: "staff.manage" },
            { to: "/admin/activity", label: "Activity log", roles: A, perm: "staff.manage" },
            { to: "/admin/billing", label: "Billing", roles: A, perm: "settings.manage" },
            { to: "/admin/settings", label: "Settings", roles: A, perm: "settings.manage" },
            { to: "/admin/help", label: "Help", roles: ALL },
        ],
    },
];
const ICON: Record<string, string> = {
    Home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    Orders: "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z",
    Products: "M3 3h8l10 10-8 8L3 11z",
    Customers: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    Analytics: "M5 21V10M12 21V3M19 21v-7",
    Discounts: "M19 5L5 19M7 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    "Online Store": "M3 9l2-5h14l2 5M4 9v11h16V9M9 20v-6h6v6",
    Settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 3a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.4 3h4l.4-3a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z",
};
const Icon = ({ n }: { n: string }) => <svg viewBox="0 0 24 24"><path d={ICON[n] ?? "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"} /></svg>;
export default function AdminLayout({ store, reload }: StoreCtx) {
    const { user, logout, exitImpersonation } = useAuth();
    const t = useT();
    const { lang, setLang } = useLocale();
    const loc = useLocation();
    const [menu, setMenu] = useState(false);
    const [open, setOpen] = useState<Record<string, boolean>>({});
    useEffect(() => setMenu(false), [loc.pathname]);
    const isActive = (to: string) => (to === "/admin" ? loc.pathname === "/admin" : loc.pathname.startsWith(to));
    // Browser tab title follows the active admin section.
    const flat: NavLeaf[] = NAV.flatMap((n) => (n.children ? [n, ...n.children] : [n]));
    const activeNav = [...flat].sort((a, b) => b.to.length - a.to.length).find((n) => isActive(n.to));
    useEffect(() => { document.title = activeNav ? `${t(activeNav.label)} — ${store.name}` : store.name; }, [activeNav, store.name, t]);
    if (!user) return null;
    // Frontend guard: unverified accounts must complete email verification
    // before entering the admin. The backend must enforce this too.
    if (!user.emailVerified) return (
        <div className="shell"><VerifyGate key={"em:" + user.email} channel="email" dest={user.email} email={user.email}
                                           sendCode={() => api.auth.resendEmailCode(user.email)}
                                           verifyCode={(code) => api.auth.verifyEmail(user.email, code).then((u) => { useAuth.setState({ user: u }); })}
                                           onVerified={() => undefined}
                                           onBack={logout} /></div>
    );
    // UI guard only: the backend must enforce roles too.
    const { data: staffList } = useLoad(() => api.staff.list(store.id), [store.id]);
    const me = staffList?.find((m) => m.email === user.email);
    const leafOk = (n: NavLeaf) => {
        if (!n.roles.includes(user.staffRole)) return false;
        if (!n.perm || user.staffRole === "Admin") return true;
        return me ? can(me, n.perm) : true;
    };
    const allowed = NAV.map((n) => (n.children ? { ...n, children: n.children.filter(leafOk) } : n))
        .filter((n) => (n.children ? n.children.length > 0 : leafOk(n)));
    if (!flat.some((n) => leafOk(n) && isActive(n.to))) return <Navigate to="/admin" replace />;
    // Auto-open the group that contains the active route.
    useEffect(() => {
        const g = allowed.find((n) => n.children?.some((c) => isActive(c.to)));
        if (g) setOpen((o) => (o[g.label] ? o : { ...o, [g.label]: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.pathname]);
    return (
        <div className="app">
            <ToastHost />
            <header className="top">
                <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
                <div className="brand"><i />shop</div>
                {noBackend && <span className="pill" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }} title={t("No backend connected — set VITE_API_URL")}>⚠️ {t("No backend")}</span>}
                <CommandPalette items={allowed.flatMap((n) => (n.children ? n.children : [n])).map((n) => ({ to: n.to, label: n.label }))} />
                <select className="mini-select" aria-label={t("Language")} value={lang} onChange={(e) => setLang(e.target.value as "en" | "bn")}><option value="en">EN</option><option value="bn">বাংলা</option></select>
                <ThemeToggle />
                <div className="me"><b>{store.name.slice(0, 2).toUpperCase()}</b><span>{store.name}</span></div>
            </header>
            <div className="body">
                {menu && <div className="scrim" onClick={() => setMenu(false)} />}
                <aside className={"side" + (menu ? " open" : "")}>
                    {allowed.map((n) => n.children ? (
                        <div key={n.label}>
                            <button className={"nav grp" + (n.children.some((c) => isActive(c.to)) ? " has-on" : "")}
                                    aria-expanded={!!open[n.label]} onClick={() => setOpen((o) => ({ ...o, [n.label]: !o[n.label] }))}>
                                <Icon n={n.label} />{t(n.label)}<span className="chev">▾</span>
                            </button>
                            {open[n.label] && n.children.map((c) => (
                                <NavLink key={c.to} to={c.to} className={({ isActive: a }) => "nav sub" + (a ? " on" : "")}>
                                    <Icon n={c.label} />{t(c.label)}
                                </NavLink>
                            ))}
                        </div>
                    ) : (
                        <div key={n.to}>
                            <NavLink to={n.to} end={n.to === "/admin"} className={({ isActive: a }) => "nav" + (a ? " on" : "")}><Icon n={n.label} />{t(n.label)}</NavLink>
                        </div>
                    ))}
                    <div className="sec">{t("Account")}</div>
                    <NavLink to={`/shop/${store.sub}`} className="nav"><Icon n="Online Store" />{t("View store")}</NavLink>
                    <button className="nav" onClick={logout}><Icon n="Log out" />{t("Log out")}</button>
                </aside>
                <main>
                    {user.impersonatedBy && <div className="card trial">{t("Support session")}: {store.name}. <button className="btn s" onClick={exitImpersonation}>{t("Exit")}</button></div>}
                    <Bell />
                    {store.status === "Trial" && <div className="card trial">{t("Free trial")}: {trialDaysLeft(store)} {t("days left on the")} {store.plan} {t("plan")}.</div>}
                    {store.status === "Active" && store.planExpiresAt && paidDaysLeft(store) <= 7 && (
                        <div className="card trial">{store.plan} {t("plan")}: {paidDaysLeft(store)} {t("days left")} · <NavLink to="/admin/billing">{t("Renew now")}</NavLink></div>
                    )}
                    <Outlet context={{ store, reload } satisfies StoreCtx} />
                </main>
            </div>
        </div>
    );
}

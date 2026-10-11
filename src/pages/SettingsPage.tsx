import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../api";
import type { StoreCtx } from "../layouts/AdminLayout";
import { PageHeader, SaveBar, toast, Loading } from "../components/polaris";
import { Card } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { paymentsConfig } from "../lib/payments";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { Settings } from "../types";

const SECTIONS = ["General", "Languages", "Markets", "Locations", "Notifications", "Checkout", "Payments", "Tracking", "Shipping and delivery", "Taxes", "Backup"] as const;
const LANGS = [{ id: "en", name: "English" }, { id: "bn", name: "বাংলা" }];

function BackupCard({ storeId }: { storeId: string }) {
    const t = useT();
    const [busy, setBusy] = useState(false);
    const download = async () => {
        setBusy(true);
        try {
            const [products, customers, orders, collections, discounts, settings, theme] = await Promise.all([
                api.products.list(storeId), api.customers.list(storeId), api.orders.list(storeId),
                api.collections.list(storeId), api.discounts.list(storeId), api.settings.get(storeId), api.theme.get(storeId),
            ]);
            const backup = { exportedAt: new Date().toISOString(), version: 1, products, customers, orders, collections, discounts, settings, theme };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `store-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            toast(t("Backup downloaded"));
        } catch (e) { toast((e as Error).message, true); } finally { setBusy(false); }
    };
    return (
        <Card><b>{t("Backup")}</b>
            <p className="mu-t">{t("Download a JSON snapshot of your products, customers, orders, collections, discounts, settings and theme.")}</p>
            <button className="btn" disabled={busy} onClick={() => void download()}>{busy ? t("Preparing…") : t("Download backup (JSON)")}</button>
        </Card>
    );
}
function Form({ initial, storeId }: { initial: Settings; storeId: string }) {
    const t = useT();
    const [base, setBase] = useState(initial);
    const [s, setS] = useState(initial);
    const [sec, setSec] = useState<(typeof SECTIONS)[number]>("General");
    const [err, setErr] = useState("");
    const [zn, setZn] = useState({ name: "", rate: "" });
    const [newCur, setNewCur] = useState({ code: "", rate: "" });
    const { data: extra } = useLoad(() => Promise.all([api.domains.list(storeId), api.locations.list(storeId)]), [storeId]);
    const dirty = JSON.stringify(s) !== JSON.stringify(base);
    const set = (p: Partial<Settings>) => { setS({ ...s, ...p }); setErr(""); };
    const upZone = (id: string, p: object) => set({ zones: s.zones.map((x) => (x.id === id ? { ...x, ...p } : x)) });
    const notif = s.notifications ?? { lowStock: true, abandonedReminders: true };
    const trk = s.tracking ?? {};
    const co = s.checkout ?? { guestCheckout: true, expressButtons: true, orderNotes: false };
    const save = async () => {
        if (!s.storeName.trim()) return setErr(t("Store name is required"));
        if (!Object.values(paymentsConfig(s.pay).methods).some(Boolean)) return setErr(t("Enable at least one payment method"));
        if (s.tax.rate < 0 || s.tax.rate > 100) return setErr(t("Tax rate must be between 0 and 100"));
        if (s.zones.some((z) => !z.name.trim() || z.rate < 0) || s.freeOver < 0) return setErr(t("Check shipping names and rates"));
        if (notif.newOrderEmail && !notif.newOrderEmail.includes("@")) return setErr(t("Notification email is not valid"));
        if (Object.entries(s.rates ?? {}).some(([k, v]) => !k.trim() || !(v > 0))) return setErr(t("Currency rates must be positive numbers"));
        try { await api.settings.save(storeId, s); setBase(s); setErr(""); toast(t("Settings saved")); } catch (e) { setErr((e as Error).message); }
    };
    const locations = extra?.[1] ?? [];
    return (
        <>
            <PageHeader title={t("Settings")} />
            {err && <div className="card errbar" role="alert">{err}</div>}
            <div className="setgrid">
                <nav className="setnav" aria-label={t("Settings sections")}>{SECTIONS.map((n) => <button key={n} className={"nav" + (sec === n ? " on" : "")} aria-current={sec === n} onClick={() => setSec(n)}>{t(n)}</button>)}</nav>
                <div>
                    {sec === "General" && <Card><b>{t("Store details")}</b>
                        <label>{t("Store name")}<input value={s.storeName} onChange={(e) => set({ storeName: e.target.value })} /></label>
                        <label>{t("Store description for search engines")}<input maxLength={160} value={s.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} /></label>
                        <label>{t("Store currency")}<select value={s.currency} onChange={(e) => set({ currency: e.target.value })}>{["USD", "BDT", "EUR", "GBP"].map((c) => <option key={c}>{c}</option>)}</select></label></Card>}
                    {sec === "Languages" && <Card><b>{t("Languages")}</b>
                        <label>{t("Default store language")}<select value={s.defaultLang ?? "en"} onChange={(e) => set({ defaultLang: e.target.value as "en" | "bn" })}>
                            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
                        <b>{t("Published languages")}</b>
                        {LANGS.map((l) => (
                            <label className="check" key={l.id}><input type="checkbox"
                                                                       checked={(s.publishedLangs ?? ["en", "bn"]).includes(l.id)}
                                                                       onChange={(e) => {
                                                                           const cur = s.publishedLangs ?? ["en", "bn"];
                                                                           set({ publishedLangs: e.target.checked ? [...cur, l.id] : cur.filter((x) => x !== l.id) });
                                                                       }} />{l.name}</label>))}
                        <p className="mu-t">{t("Shoppers can switch between published languages on your storefront.")}</p></Card>}
                    {sec === "Markets" && <Card><b>{t("Markets & currencies")}</b>
                        <p className="mu-t">{t("Base currency:")} <b>{s.currency}</b> {t("(change it under General). Rates convert prices for shoppers paying in other currencies.")}</p>
                        <table className="ptable"><thead><tr><th>{t("Currency")}</th><th>{t("Rate")} (1 {s.currency} =)</th><th></th></tr></thead>
                            <tbody>
                            {Object.entries(s.rates ?? {}).filter(([k]) => k !== s.currency).map(([k, v]) => (
                                <tr key={k}>
                                    <td><b>{k}</b></td>
                                    <td><input type="number" min={0} step="any" aria-label={`${k} rate`} value={v} style={{ width: 120 }}
                                               onChange={(e) => set({ rates: { ...(s.rates ?? {}), [k]: +e.target.value } })} /></td>
                                    <td style={{ textAlign: "right" }}><button className="btn s" onClick={() => { const r = { ...(s.rates ?? {}) }; delete r[k]; set({ rates: r }); }}>{t("Remove")}</button></td>
                                </tr>))}
                            </tbody></table>
                        <div className="row"><input placeholder="EUR" value={newCur.code} onChange={(e) => setNewCur({ ...newCur, code: e.target.value.toUpperCase() })} style={{ width: 90 }} />
                            <input type="number" min={0} step="any" placeholder={t("Rate")} value={newCur.rate} onChange={(e) => setNewCur({ ...newCur, rate: e.target.value })} style={{ width: 120 }} />
                            <button className="btn s" onClick={() => {
                                if (!/^[A-Z]{3}$/.test(newCur.code) || !(+newCur.rate > 0)) return setErr(t("Enter a 3-letter currency code and a positive rate"));
                                set({ rates: { ...(s.rates ?? {}), [newCur.code]: +newCur.rate } }); setNewCur({ code: "", rate: "" });
                            }}>{t("Add currency")}</button></div></Card>}
                    {sec === "Locations" && <Card><b>{t("Locations")}</b>
                        <p className="mu-t">{t("Warehouses and stores that hold your inventory.")}</p>
                        <table className="ptable"><tbody>
                        {locations.map((l) => <tr key={l.id}><td><b>{l.name}</b>{l.isDefault && <span className="mu-t"> {t("(default)")}</span>}<div className="mu-t">{l.address ?? ""}</div></td></tr>)}
                        </tbody></table>
                        <p className="mu-t">{t("Manage locations from")} <Link to="/admin/inventory">{t("Inventory")}</Link>.</p></Card>}
                    {sec === "Notifications" && <Card><b>{t("Notifications")}</b>
                        <label>{t("New order notification email")}<input placeholder="orders@example.com" aria-label={t("New order notification email")} value={notif.newOrderEmail ?? ""} onChange={(e) => set({ notifications: { ...notif, newOrderEmail: e.target.value } })} /></label>
                        <label className="check"><input type="checkbox" checked={notif.lowStock} onChange={(e) => set({ notifications: { ...notif, lowStock: e.target.checked } })} />{t("Email me when a product is low on stock")}</label>
                        <label className="check"><input type="checkbox" checked={notif.abandonedReminders} onChange={(e) => set({ notifications: { ...notif, abandonedReminders: e.target.checked } })} />{t("Send abandoned checkout reminder emails")}</label>
                        <p className="mu-t">{t("Reminder emails use your")} <Link to="/admin/marketing">{t("Marketing automations")}</Link>.</p></Card>}
                    {sec === "Checkout" && <Card><b>{t("Checkout")}</b>
                        <label className="check"><input type="checkbox" checked={co.guestCheckout} onChange={(e) => set({ checkout: { ...co, guestCheckout: e.target.checked } })} />{t("Allow guest checkout (no account required)")}</label>
                        <label className="check"><input type="checkbox" checked={co.expressButtons} onChange={(e) => set({ checkout: { ...co, expressButtons: e.target.checked } })} />{t("Show express checkout buttons (Shop Pay, Apple Pay, Google Pay)")}</label>
                        <label className="check"><input type="checkbox" checked={co.orderNotes} onChange={(e) => set({ checkout: { ...co, orderNotes: e.target.checked } })} />{t("Allow order notes at checkout")}</label>
                        <label className="check"><input type="checkbox" checked={co.autoConfirmPaid ?? true} onChange={(e) => set({ checkout: { ...co, autoConfirmPaid: e.target.checked } })} />{t("Auto-confirm orders paid through a gateway (turn off to review every order manually)")}</label></Card>}
                    {sec === "Tracking" && <Card><b>{t("Tracking")}</b>
                        <p className="mu-t">{t("Paste your pixel IDs below. ViewContent, AddToCart, InitiateCheckout and Purchase events fire automatically on your storefront — no code needed.")}</p>
                        <label>{t("Meta Pixel ID")}<input inputMode="numeric" placeholder="1234567890" aria-label={t("Meta Pixel ID")} value={trk.metaPixelId ?? ""} onChange={(e) => set({ tracking: { ...trk, metaPixelId: e.target.value } })} /></label>
                        <label>{t("Google Analytics 4 Measurement ID")}<input placeholder="G-XXXXXXXXXX" aria-label={t("Google Analytics 4 Measurement ID")} value={trk.ga4Id ?? ""} onChange={(e) => set({ tracking: { ...trk, ga4Id: e.target.value } })} /></label>
                        <label>{t("Google Tag Manager Container ID")}<input placeholder="GTM-XXXXXXX" aria-label={t("Google Tag Manager Container ID")} value={trk.gtmId ?? ""} onChange={(e) => set({ tracking: { ...trk, gtmId: e.target.value } })} /></label>
                        <label>{t("TikTok Pixel ID")}<input placeholder="CXXXXXXXXXXXXXXX" aria-label={t("TikTok Pixel ID")} value={trk.tiktokId ?? ""} onChange={(e) => set({ tracking: { ...trk, tiktokId: e.target.value } })} /></label>
                        <p className="mu-t">🧪 {t("Use each platform's test events tool to verify events are arriving.")}</p></Card>}
                    {sec === "Payments" && <Card><b>{t("Payment methods")}</b>
                        <p className="mu-t">{t("bKash, Nagad, Rocket, Upay, cards and COD are managed on the")} <Link to="/admin/payments">{t("Payments")}</Link> {t("page")}.</p></Card>}
                    {sec === "Shipping and delivery" && <><Card><b>{t("Shipping zones")}</b>
                        <div className="zrow mu-t"><span>{t("Zone name")}</span><span>{t("Rate")}</span><span /></div>
                        {s.zones.map((z) => <div className="zrow" key={z.id}>
                            <input aria-label={t("Zone name")} value={z.name} onChange={(e) => upZone(z.id, { name: e.target.value })} />
                            <input aria-label={t("Rate")} type="number" min={0} value={z.rate} onChange={(e) => upZone(z.id, { rate: +e.target.value })} />
                            <button className="btn s" onClick={() => set({ zones: s.zones.filter((x) => x.id !== z.id) })}>{t("Remove")}</button></div>)}
                        <div className="zrow"><input aria-label={t("New zone name")} placeholder={t("New zone")} value={zn.name} onChange={(e) => setZn({ ...zn, name: e.target.value })} /><input aria-label={t("New zone rate")} type="number" placeholder={t("Rate")} value={zn.rate} onChange={(e) => setZn({ ...zn, rate: e.target.value })} />
                            <button className="btn s" onClick={() => { if (zn.name.trim()) { set({ zones: [...s.zones, { id: crypto.randomUUID(), name: zn.name.trim(), rate: +zn.rate || 0 }] }); setZn({ name: "", rate: "" }); } }}>Add</button></div>
                        <p className="mu-t">{t("Advanced zones and delivery profiles are on the")} <Link to="/admin/shipping">{t("Shipping")}</Link>.</p></Card>
                        <Card><label><b>{t("Free shipping over")}</b><input type="number" min={0} value={s.freeOver} onChange={(e) => set({ freeOver: +e.target.value })} /></label><p className="mu-t">{t("Set to 0 to turn off free shipping.")}</p></Card></>}
                    {sec === "Taxes" && <Card><b>{t("Tax collection")}</b>
                        <p className="mu-t">{t("Tax defaults, tax regions and duties are managed on the")} <Link to="/admin/taxes">{t("Taxes and duties")}</Link>.</p></Card>}
                    {sec === "Backup" && <BackupCard storeId={storeId} />}
                </div>
            </div>
            <SaveBar dirty={dirty} onSave={() => void save()} onDiscard={() => { setS(base); setErr(""); }} />
        </>
    );
}
export default function SettingsPage() {
    const storeId = useAuth((s) => s.user!.storeId!);
    const { store } = useOutletContext<StoreCtx>();
    const { data } = useLoad(() => api.settings.get(storeId), [storeId]);
    // BUG-40 fix: settings.storeName was never initialized when the store was
    // created, so General showed an empty name. Fall back to the store's actual
    // name — it persists on the next save.
    const initial = data && !data.storeName?.trim() ? { ...data, storeName: store.name } : data;
    return initial ? <Form initial={initial} storeId={storeId} /> : <Loading />;
}

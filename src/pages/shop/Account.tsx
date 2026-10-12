import { useState } from "react";
import { PasswordInput } from "../../components/PasswordInput";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { calc, taxOpts } from "../../lib/calc";
import { useFx, useT } from "../../lib/fx";
import { priceMap } from "../../lib/orderTotal";
import { shopStore, useShopData } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { Badge } from "../../components/ui";
import { useShopper } from "../../store/shopper";
import type { Customer } from "../../types";
import { Loading } from "../../components/polaris";
import { GoogleButton } from "../../components/GoogleButton";
import { VerifyGate } from "../../components/VerifyGate";
// NOTE: the backend has no self-service OTP endpoint for shoppers (only the
// merchant-authenticated mark-verified), so the verification gate below only
// runs in demo/mock mode. Against the real backend shoppers proceed directly.
function AuthForm() {
    const t = useT();
    const set = useShopper((s) => s.set);
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [f, setF] = useState({ name: "", email: "", pw: "", phone: "" });
    const [err, setErr] = useState("");
    const [verify, setVerify] = useState<{ id: string; email: string; phone?: string } | null>(null);
    const [verifyPh, setVerifyPh] = useState<{ id: string; phone: string } | null>(null);
    const submit = async () => {
        try {
            const c = mode === "login" ? await api.account.login(shopStore(), f.email, f.pw) : await api.account.signup(shopStore(), f.name, f.email, f.pw, f.phone.trim() || undefined);
            if (!c.emailVerified) { setVerify({ id: c.id, email: c.email, phone: c.phone }); return; }
            if (c.phone && !c.phoneVerified) { setVerifyPh({ id: c.id, phone: c.phone }); return; }
            set(c);
        } catch (e) { setErr((e as Error).message); }
    };
    if (verify) return (
        <VerifyGate key={"em:"+verify.email} channel="email" dest={verify.email}
                    onVerified={async () => {
                        const c = await api.account.verifyEmail(shopStore(), verify.id);
                        if (c.phone && !c.phoneVerified) { setVerify(null); setVerifyPh({ id: c.id, phone: c.phone }); return; }
                        set(c);
                    }}
                    onBack={() => setVerify(null)} />
    );
    if (verifyPh) return (
        <VerifyGate key={"ph:"+verifyPh.phone} channel="phone" dest={verifyPh.phone}
                    onVerified={async () => { set(await api.account.verifyPhone(shopStore(), verifyPh.id)); }}
                    onBack={() => setVerifyPh(null)} />
    );
    return (
        <div className="card">
            <h3>{mode === "login" ? t("Log in") : t("Create account")}</h3>
            {mode === "signup" && <input placeholder={t("Name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
            <input placeholder={t("Email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            {mode === "signup" && <input inputMode="tel" placeholder={t("Phone (optional)")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}
            <PasswordInput placeholder={t("Password")} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} />
            {err && <p className="er-t">{err}</p>}
            <button className="btn" onClick={submit}>{mode === "login" ? t("Log in") : t("Sign up")}</button>
            <div className="or"><span>{t("or")}</span></div>
            <GoogleButton onToken={async (idToken) => { try { set(await api.account.google(shopStore(), idToken)); } catch (e) { setErr((e as Error).message); } }} />
            <p className="mu-t" style={{ cursor: "pointer" }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>{mode === "login" ? t("New here? Create an account") : t("Have an account? Log in")}</p>
        </div>
    );
}
function Dashboard({ c }: { c: Customer }) {
    const t = useT();
    const set = useShopper((s) => s.set);
    const d = useShopData();
    const fx = useFx(d?.settings);
    const { data: orders } = useLoad(() => api.account.orders(shopStore(), c.id), [c.id]);
    const { data: loyalty } = useLoad(() => api.loyalty.get(shopStore()), []);
    const [tab, setTab] = useState("Orders");
    const [f, setF] = useState({ name: c.name, phone: c.phone ?? "", pw: "" });
    const [addr, setAddr] = useState("");
    const [msg, setMsg] = useState("");
    const save = async (next: Customer, ok = "Saved") => { try { set(await api.account.update(shopStore(), next)); setMsg(ok); } catch (e) { setMsg((e as Error).message); } };
    const wl = c.wishlist ?? [];
    return (
        <>
            <h3>{t("Hi")} {c.name}</h3>
            {loyalty?.enabled && (
                <div className="card loy-card">
                    <div className="between"><b>⭐ {t("Loyalty points")}</b><span className="big">{c.points ?? 0}</span></div>
                    <p className="mu-t" style={{ margin: "4px 0 0" }}>{t("Earn {p} points for every {a} spent.").replace("{p}", String(loyalty.earnPoints)).replace("{a}", fx.fmt(loyalty.earnPer))} {t("{r} points = {v} off your order.").replace("{r}", String(loyalty.redeemPoints)).replace("{v}", fx.fmt(loyalty.redeemValue))}</p>
                </div>)}
            <div>{[["Orders", t("Orders")], ["Profile", t("Profile")], ["Addresses", t("Addresses")], ["Wishlist", t("Wishlist")]].map(([k, label]) => <span key={k} className={"chip" + (tab === k ? " on" : "")} onClick={() => { setTab(k); setMsg(""); }}>{label}</span>)}<span className="chip" onClick={() => set(null)}>{t("Log out")}</span></div>
            {msg && <p className={msg.startsWith("Saved") || msg === "Password changed" ? "ok-t" : "er-t"}>{msg}</p>}
            {tab === "Orders" && <div className="card">{!orders || !d ? <Loading /> : <table><tbody>{orders.map((o) => (
                <tr key={o.id}><td>#{o.id}</td><td>{fx.fmt(calc(o.items, priceMap(d.products), o.zoneId, o.code, d.settings, d.discounts, taxOpts(d.products)).total)}</td><td><Badge t={o.pay} /></td><td><Badge t={o.ful} /></td></tr>))}</tbody></table>}
                {orders && !orders.length && <p className="mu-t">{t("No orders yet.")}</p>}</div>}
            {tab === "Profile" && <div className="card"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><input value={c.email} disabled /><input placeholder={t("Phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                <button className="btn" onClick={() => f.name.trim() ? save({ ...c, name: f.name.trim(), phone: f.phone }) : setMsg("Name is required")}>{t("Save")}</button>
                <PasswordInput placeholder={t("New password")} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} />
                <button className="btn s" onClick={async () => { try { await api.account.changePassword(shopStore(), c.id, f.pw); setF({ ...f, pw: "" }); setMsg("Password changed"); } catch (e) { setMsg((e as Error).message); } }}>{t("Change password")}</button></div>}
            {tab === "Addresses" && <div className="card">{c.addresses.map((a, i) => <div className="between" key={i}><span>{a}</span><button className="btn s" onClick={() => save({ ...c, addresses: c.addresses.filter((_, j) => j !== i) })}>{t("Delete")}</button></div>)}
                {!c.addresses.length && <p className="mu-t">{t("No saved addresses.")}</p>}
                <div className="row"><input placeholder={t("New address")} value={addr} onChange={(e) => setAddr(e.target.value)} /><button className="btn s" onClick={() => { if (addr.trim()) { void save({ ...c, addresses: [...c.addresses, addr.trim()] }); setAddr(""); } }}>{t("Add")}</button></div></div>}
            {tab === "Wishlist" && <div className="card">{d?.products.filter((p) => wl.includes(p.id)).map((p) => (
                <div className="between" key={p.id}><Link to={`/shop/product/${p.id}`}>{p.title}</Link><button className="btn s" onClick={() => save({ ...c, wishlist: wl.filter((x) => x !== p.id) })}>{t("Remove")}</button></div>))}
                {!wl.length && <p className="mu-t">{t("Your wishlist is empty.")}</p>}</div>}
        </>
    );
}
export default function Account() {
    const customer = useShopper((s) => s.customer);
    return customer ? <Dashboard c={customer} /> : <AuthForm />;
}

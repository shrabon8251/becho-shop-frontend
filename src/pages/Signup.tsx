import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import { GoogleButton } from "../components/GoogleButton";
import { VerifyGate } from "../components/VerifyGate";
import "../landing.css";

const CURS = ["BDT", "USD", "EUR", "GBP", "INR"];
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function Signup() {
    const t = useT();
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const { signup, setStoreId, google } = useAuth();
    const [f, setF] = useState({ name: "", email: sp.get("email") ?? "", pw: "", phone: "", store: "", currency: "BDT" });
    const [terms, setTerms] = useState(false);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
    const [verifyPhone, setVerifyPhone] = useState<string | null>(null);
    const afterEmailVerified = () => {
        const u = useAuth.getState().user;
        if (u && u.phone && !u.phoneVerified) { setVerifyEmail(null); setVerifyPhone(u.phone); return; }
        nav("/admin");
    };
    const submit = async () => {
        try {
            setErr("");
            if (!f.name.trim()) throw new Error(t("Enter your name"));
            if (!f.email.includes("@")) throw new Error(t("Enter a valid email"));
            if (f.pw.length < 8) throw new Error(t("Password must be at least 8 characters"));
            if (!f.store.trim()) throw new Error(t("Enter a store name"));
            const ph = f.phone.replace(/[\s-]/g, "");
            if (ph && !/^01[3-9]\d{8}$/.test(ph)) throw new Error(t("Phone must be a valid Bangladesh mobile number (01XXXXXXXXX)"));
            if (!terms) throw new Error(t("Please accept the Terms of Service and Privacy Policy"));
            const sub = slug(f.store);
            if (!/^[a-z0-9-]{3,}$/.test(sub)) throw new Error(t("Store name: use at least 3 letters or numbers"));
            if (!(await api.stores.available(sub))) throw new Error(t("This store name is taken"));
            setBusy(true);
            // Backend expects LocalDateTime (no timezone suffix): "2026-10-06T20:15:30"
            const termsAcceptedAt = new Date().toISOString().slice(0, 19);
            await signup(f.name.trim(), f.email, f.pw, f.phone.trim() || undefined, termsAcceptedAt);
            const u = useAuth.getState().user;
            if (!u) throw new Error(t("Something went wrong, please try again"));
            const s = await api.stores.create(u.id, { name: f.store.trim(), sub, plan: "Growth", currency: f.currency, industry: "Other" });
            setStoreId(s.id);
            // Apply the theme selected from the landing page preview (if any)
            const themeId = sp.get("theme");
            if (themeId) {
                try {
                    const { THEMES } = await import("../lib/theme");
                    const themeDef = THEMES.find((x) => x.id === themeId);
                    if (themeDef) {
                        await api.theme.save(s.id, JSON.parse(JSON.stringify(themeDef.theme)));
                    }
                } catch { /* theme apply is best-effort; store works with default theme */ }
            }
            const me = useAuth.getState().user;
            if (me && !me.emailVerified) { setVerifyEmail(me.email); setBusy(false); return; }
            nav("/admin");
        } catch (e) { setErr((e as Error).message); setBusy(false); }
    };
    const points = ["Free 14-day trial", "No credit card required", "Cancel anytime", "Support in Bangla & English"];
    return (
        <div className="bx bx-signup">
            <div className="bx-blob b1" /><div className="bx-blob b2" />
            <Link to="/" className="bx-back">← Becho</Link>
            <div className="bx-su-wrap">
                <div className="bx-su-side">
                    <div className="bx-blob b2" style={{ width: 380, height: 380, top: -120, right: -100, left: "auto" }} />
                    <div className="bx-blob b3" style={{ width: 300, height: 300, bottom: -140, left: -80 }} />
                    <Link to="/" className="bx-logo" style={{ position: "relative" }}><span className="bx-logo-mark">◈</span>Becho</Link>
                    <h2>{t("Everything you need to")}<br /><span className="gr">{t("launch your dream store")}</span></h2>
                    <p className="sub2">{t("Launch in minutes — designer themes, payments and couriers built in.")}</p>
                    <ul className="bx-su-points">{points.map((p) => <li key={p}><span className="tick">✓</span>{t(p)}</li>)}</ul>
                    <div className="bx-su-stats">
                        <div><b>10+</b><span>{t("designer themes")}</span></div>
                        <div><b>5</b><span>{t("courier partners")}</span></div>
                        <div><b>0%</b><span>{t("transaction fee")}</span></div>
                    </div>
                </div>
                {verifyEmail ? (
                    <div className="bx-su-card"><VerifyGate key={"em:"+verifyEmail} channel="email" dest={verifyEmail} email={verifyEmail}
                                                            sendCode={() => api.auth.resendEmailCode(verifyEmail)}
                                                            verifyCode={(code) => api.auth.verifyEmail(verifyEmail, code).then((u) => {
                                                                // Backend returns the raw User (no storeId) — preserve the
                                                                // store created moments ago, or the app routes to Onboarding
                                                                // and a second store gets created (BUG-27).
                                                                const prev = useAuth.getState().user;
                                                                useAuth.setState({ user: { ...u, storeId: u.storeId ?? prev?.storeId ?? null } });
                                                            })}
                                                            onVerified={() => afterEmailVerified()}
                                                            onBack={() => setVerifyEmail(null)} /></div>
                ) : verifyPhone ? (
                    <div className="bx-su-card"><VerifyGate key={"ph:"+verifyPhone} channel="phone" dest={verifyPhone} email={useAuth.getState().user?.email ?? ""}
                                                            sendCode={() => { const me = useAuth.getState().user; return me ? api.auth.sendPhoneCode(me.email) : Promise.resolve(); }}
                                                            verifyCode={(code) => { const me = useAuth.getState().user; return me ? api.auth.verifyPhone(me.email, code).then((u) => {
                                                                const prev = useAuth.getState().user;
                                                                useAuth.setState({ user: { ...u, storeId: u.storeId ?? prev?.storeId ?? null } });
                                                            }) : Promise.resolve(); }}
                                                            onVerified={() => nav("/admin")}
                                                            onBack={() => { setVerifyPhone(null); nav("/admin"); }} /></div>
                ) : (
                    <div className="bx-su-card">
                        <h1>{t("Start your free trial")}</h1>
                        <p className="sub">{t("14 days free · No credit card · Live in minutes")}</p>
                        {err && <div className="bx-err">{err}</div>}
                        <label><span>{t("Your name")}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Sara Khan" /></label>
                        <label><span>{t("Email")}</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="sara@example.com" /></label>
                        <label><span>{t("Password")}</span><input type="password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder="••••••••" /></label>
                        <label><span>{t("Phone")} <i className="mu-t">({t("optional, for SMS verification")})</i></span><input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXXXXXXXX" /><span className="bx-hint">{t("Bangladesh format: 01XXXXXXXXX (11 digits)")}</span></label>
                        <label><span>{t("Store name")}</span><input value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })} placeholder="Sara's Boutique" /></label>
                        <label><span>{t("Currency")}</span><select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURS.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                        <label className="bx-terms"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span>{t("I agree to the")} <Link to="/terms" target="_blank" rel="noopener">{t("Terms of Service")}</Link> {t("and")} <Link to="/privacy" target="_blank" rel="noopener">{t("Privacy Policy")}</Link></span></label>
                        <button className="bx-btn shine" disabled={busy} onClick={submit}>{busy ? t("Creating your store…") : t("Create my store")}</button>
                        <div className="bx-or"><span>{t("or")}</span></div>
                        <GoogleButton className="bx-btn bx-google" onToken={async (idToken) => {
                            try {
                                setErr("");
                                if (!terms) throw new Error(t("Please accept the Terms of Service and Privacy Policy"));
                                setBusy(true);
                                await google(idToken);
                                const u = useAuth.getState().user;
                                if (!u) throw new Error(t("Something went wrong, please try again"));
                                setBusy(false);
                                // No store is auto-created here. /admin renders the onboarding
                                // flow (store details → business info → plan → theme) when the
                                // user has no store yet — exactly like Google login. One
                                // behavior everywhere, no "<name>'s Store" surprise.
                                nav("/admin");
                            } catch (e) { setErr((e as Error).message); setBusy(false); }
                        }} />
                        <p className="bx-su-login">{t("Already have an account?")} <Link to="/login">{t("Log in")}</Link></p>
                    </div>)}
            </div>
        </div>
    );
}

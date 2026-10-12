import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../store/auth";
import { api } from "../api";
import { VerifyGate } from "../components/VerifyGate";
import { useT } from "../lib/fx";
import { GoogleButton } from "../components/GoogleButton";
import AuthShell from "../components/AuthShell";
export default function Auth() {
    const t = useT();
    const nav = useNavigate();
    const [params] = useSearchParams();
    // Set when http.ts bounces an expired session here (?expired=1).
    const sessionExpired = params.get("expired") === "1";
    const justReset = params.get("reset") === "1";
    const { login, signup, google } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [f, setF] = useState({ name: "", email: "", pw: "" });
    const [terms, setTerms] = useState(false);
    const [err, setErr] = useState("");
    const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
    const [verifyPhone, setVerifyPhone] = useState<string | null>(null);
    const goPhoneOrAdmin = () => {
        const u = useAuth.getState().user;
        if (u && u.phone && !u.phoneVerified) { setVerifyEmail(null); setVerifyPhone(u.phone); return; }
        nav("/admin");
    };
    const submit = async () => {
        try {
            if (!terms) throw new Error(t("Please accept the Terms of Service and Privacy Policy"));
            if (mode === "signup" && f.pw.length < 8) throw new Error(t("Password must be at least 8 characters"));
            const email = f.email.trim().toLowerCase();
            await (mode === "login" ? login(email, f.pw) : signup(f.name, email, f.pw));
            const u = useAuth.getState().user;
            if (u && !u.emailVerified) { setVerifyEmail(u.email); return; }
            goPhoneOrAdmin();
        } catch (e) {
            // Trial expired: the backend blocks login (no tokens issued) and there
            // is no public /billing route — so surface the message here instead of
            // navigating to a nonexistent page (which just bounced back to /login).
            setErr((e as Error).message);
        }
    };
    if (verifyEmail) return (
        <div className="shell"><VerifyGate key={"em:"+verifyEmail} channel="email" dest={verifyEmail} email={verifyEmail}
                                           sendCode={() => api.auth.resendEmailCode(verifyEmail)}
                                           verifyCode={(code) => api.auth.verifyEmail(verifyEmail, code).then((u) => { useAuth.setState({ user: u }); })}
                                           onVerified={() => goPhoneOrAdmin()}
                                           onBack={() => setVerifyEmail(null)} /></div>
    );
    if (verifyPhone) return (
        <div className="shell"><VerifyGate key={"ph:"+verifyPhone} channel="phone" dest={verifyPhone} email={useAuth.getState().user?.email ?? ""}
                                           sendCode={() => { const me = useAuth.getState().user; return me ? api.auth.sendPhoneCode(me.email) : Promise.resolve(); }}
                                           verifyCode={(code) => { const me = useAuth.getState().user; return me ? api.auth.verifyPhone(me.email, code).then((u) => { useAuth.setState({ user: u }); }) : Promise.resolve(); }}
                                           onVerified={() => nav("/admin")}
                                           onBack={() => { setVerifyPhone(null); nav("/admin"); }}
                                           onSkip={() => { setVerifyPhone(null); nav("/admin"); }} /></div>
    );
    return (
        <AuthShell mode="login" title={mode === "login" ? t("Log in") : t("Create account")}
                   subtitle={mode === "login" ? t("Welcome back to your store") : t("Start your free 14-day trial")}>
            {sessionExpired && <p className="bx-auth-err">{t("Your session expired. Please log in again.")}</p>}
            {justReset && <p className="bx-auth-ok">{t("Password reset — please log in with your new password.")}</p>}
            {mode === "signup" && <input type="text" placeholder={t("Name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
            <input type="email" placeholder={t("Email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <PasswordInput placeholder={t("Password")} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })}
                           onKeyDown={(e) => e.key === "Enter" && void submit()} />
            {err && <p className="bx-auth-err">{err}</p>}
            <label className="bx-terms"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span>{t("I agree to the")} <Link to="/terms" target="_blank" rel="noopener">{t("Terms of Service")}</Link> {t("and")} <Link to="/privacy" target="_blank" rel="noopener">{t("Privacy Policy")}</Link></span></label>
            <button className="bx-auth-btn" onClick={submit}>{mode === "login" ? t("Log in") : t("Sign up")}</button>
            <div className="bx-auth-or"><span>{t("or")}</span></div>
            <GoogleButton onToken={async (idToken) => { try { if (!terms) throw new Error(t("Please accept the Terms of Service and Privacy Policy")); await google(idToken); nav("/admin"); } catch (e) { setErr((e as Error).message); } }} />
            <p className="mu-t" style={{ textAlign: "center", marginTop: 12 }}>🔒 {t("We verify your email to keep stores secure.")}</p>
            <div className="bx-auth-links">
                <p style={{ cursor: "pointer" }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setTerms(false); }}>
                    {mode === "login" ? <><span>{t("No account?")} </span><Link to="/signup">{t("Create account")}</Link></> : <Link to="/login">{t("Back to log in")}</Link>}
                </p>
                {mode === "login" && <p><Link to="/forgot-password">{t("Forgot password?")}</Link></p>}
            </div>
        </AuthShell>
    );
}

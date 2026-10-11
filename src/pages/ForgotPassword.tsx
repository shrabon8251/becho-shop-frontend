import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useT } from "../lib/fx";
import AuthShell from "../components/AuthShell";

/** Forgot password: email → 6-digit code → new password. */
export default function ForgotPassword() {
  const t = useT();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg(t("Enter a valid email"));
    setBusy(true);
    try { await api.auth.forgotPassword(email); setStep(2); setMsg(""); }
    catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };
  const reset = async () => {
    if (code.trim().length < 4) return setMsg(t("Enter the code from your email"));
    if (pw.length < 8) return setMsg(t("Password must be at least 8 characters"));
    if (pw !== pw2) return setMsg(t("Passwords do not match"));
    setBusy(true);
    try { await api.auth.resetPassword(email, code.trim(), pw); nav("/login?reset=1"); }
    catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };
  return (
    <AuthShell mode="forgot" title={"🔑 " + t("Forgot password")}
      subtitle={step === 1 ? t("Enter your account email — we'll send a reset code.") : t("Enter the code and choose a new password.")}>
      {step === 1 ? (
        <>
          <input type="email" placeholder={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()} />
          {msg && <p className="bx-auth-err">{msg}</p>}
          <button className="bx-auth-btn" disabled={busy} onClick={() => void send()}>{busy ? t("Sending…") : t("Send reset code")}</button>
        </>
      ) : (
        <>
          <p className="bx-auth-sub">{t("We sent a 6-digit code to")} <b>{email}</b></p>
          <input inputMode="numeric" placeholder={t("Reset code")} value={code} onChange={(e) => setCode(e.target.value)} />
          <input type="password" placeholder={t("New password")} value={pw} onChange={(e) => setPw(e.target.value)} />
          <input type="password" placeholder={t("Confirm password")} value={pw2} onChange={(e) => setPw2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void reset()} />
          {msg && <p className="bx-auth-err">{msg}</p>}
          <button className="bx-auth-btn" disabled={busy} onClick={() => void reset()}>{busy ? t("Saving…") : t("Reset password")}</button>
          <button className="bx-auth-btn" style={{ background: "#e2e8f0", color: "#334155", boxShadow: "none", marginTop: 8 }} onClick={() => setStep(1)}>{t("Back")}</button>
        </>
      )}
      <div className="bx-auth-links"><p><Link to="/login">{t("Back to login")}</Link></p></div>
    </AuthShell>
  );
}

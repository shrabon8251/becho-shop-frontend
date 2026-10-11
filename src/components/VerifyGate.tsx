import { useEffect, useState } from "react";
import { useT } from "../lib/fx";
import type { VerifyChannel } from "../lib/verify";

/**
 * Email / phone verification gate: sends a 6-digit code, verifies it.
 * The caller injects sendCode/verifyCode which hit the backend's
 * verification endpoints; the code is mandatory server-side.
 */
export function VerifyGate({ channel, dest, sendCode, verifyCode, onVerified, onBack, onSkip }: {
    channel: VerifyChannel; dest: string;
    /** Account email the backend uses to look up the verification code (used by the caller's closures). */
    email?: string;
    /** Real-backend: request a fresh code (resend). */
    sendCode?: () => Promise<void>;
    /** Real-backend: verify the code; throws/rejects when wrong or expired. */
    verifyCode?: (code: string) => Promise<void>;
    onVerified(code?: string): void; onBack?(): void;
    /** Optional "Skip for now" (e.g. phone OTP when no SMS provider is configured). */
    onSkip?(): void;
}) {
    const t = useT();
    const [code, setCode] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [cool, setCool] = useState(0);
    const real = !!verifyCode;
    const send = () => {
        setErr("");
        if (real && sendCode) {
            setBusy(true);
            sendCode().then(() => { setCool(30); setBusy(false); })
                .catch((e) => { setErr((e as Error).message); setBusy(false); });
        } else {
            setErr(t("Verification is not available — backend not connected."));
        }
    };
    useEffect(() => { send(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [channel, dest]);
    useEffect(() => {
        if (cool <= 0) return;
        const id = setTimeout(() => setCool(cool - 1), 1000);
        return () => clearTimeout(id);
    }, [cool]);
    const verify = async () => {
        if (code.trim().length !== 6) return setErr(t("Enter the 6-digit code"));
        setBusy(true);
        try {
            if (real && verifyCode) {
                await verifyCode(code.trim());
                onVerified(code.trim());
            } else {
                setErr(t("Verification is not available — backend not connected."));
                setBusy(false);
            }
        } catch (e) { setErr((e as Error).message); setBusy(false); }
    };
    return (
        <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
            <h3>{channel === "email" ? t("Verify your email") : t("Verify your phone")}</h3>
            <p className="mu-t">{t("We sent a 6-digit code to")} <b>{dest}</b></p>
            {/* Demo code display removed — backend is connected now. */}
            <input inputMode="numeric" maxLength={6} placeholder="••••••" aria-label={t("Verification code")}
                   value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && void verify()}
                   style={{ fontSize: 20, letterSpacing: 6, textAlign: "center" }} />
            {err && <p className="er-t">{err}</p>}
            <button className="btn wide" disabled={busy} onClick={() => void verify()}>{busy ? t("Verifying…") : t("Verify")}</button>
            <div className="between" style={{ marginTop: 10 }}>
                <button className="btn s plain" disabled={cool > 0 || busy} onClick={send}>
                    {cool > 0 ? t("Resend in {s}s").replace("{s}", String(cool)) : t("Resend code")}
                </button>
                {onBack && <button className="btn s plain" onClick={onBack}>{t("Back")}</button>}
                {onSkip && <button className="btn s plain" onClick={onSkip}>{t("Skip for now")}</button>}
            </div>
        </div>
    );
}

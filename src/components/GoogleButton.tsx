import { useState } from "react";
import { useT } from "../lib/fx";
import { requestGoogleIdToken } from "../lib/oauth";

/**
 * "Continue with Google" button.
 * Uses Google Identity Services and hands the raw ID token to onToken;
 * the backend verifies it server-side before creating the session.
 */
export function GoogleButton({ onToken, className }: {
  onToken(idToken: string): Promise<void> | void;
  className?: string;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    try {
      const idToken = await requestGoogleIdToken();
      await onToken(idToken);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ width: "100%" }}>
      <button type="button" className={className ?? "btn s wide"} disabled={busy} onClick={() => void go()}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.7 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9.5z" />
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.7.1-2.9 2.2-.1.6C3.6 21.3 7.5 24 12 24z" />
          <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.6-2.9-2.2-.4.2C.6 8.9 0 10.3 0 12s.6 3.1 1.8 4.9l3.4-2.5z" />
          <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.6 2.7 1.8 6.9l3.4 2.6c1-2.8 3.7-4.8 6.8-4.8z" />
        </svg>
        {busy ? t("Connecting…") : t("Continue with Google")}
      </button>
      {err && <p className="er-t">{err}</p>}
    </div>
  );
}

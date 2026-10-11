import { useEffect, useState } from "react";
import { api } from "../api";
import { useT } from "../lib/fx";
import type { AppsConfig } from "../types";

/** Email Popups app: timed popup offering a discount code for newsletter signup.
 *  Actually saves the subscriber as a customer tagged "newsletter". */
export function NewsletterPopup({ store, apps }: { store: string; apps?: AppsConfig }) {
  const t = useT();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const cfg = apps?.emailPopups;
  const enabled = cfg?.on ?? true;
  useEffect(() => {
    if (!enabled) return;
    try {
      const last = Number(localStorage.getItem("nlpop:" + store) ?? 0);
      if (Date.now() - last < 7 * 864e5) return;
    } catch { /* show anyway */ }
    const id = setTimeout(() => setShow(true), Math.max(3, cfg?.delaySec ?? 8) * 1000);
    return () => clearTimeout(id);
  }, [store, enabled, cfg?.delaySec]);
  const close = () => {
    setShow(false);
    try { localStorage.setItem("nlpop:" + store, String(Date.now())); } catch { /* ignore */ }
  };
  const submit = async () => {
    if (!email.includes("@")) return;
    try {
      await api.customers.save(store, { id: crypto.randomUUID(), name: email.split("@")[0], email, tags: ["newsletter", "popup"] } as any);
    } catch { /* already subscribed etc. */ }
    setOk(true);
    try { localStorage.setItem("nlpop:" + store, String(Date.now())); } catch { /* ignore */ }
  };
  if (!enabled || !show) return null;
  return (
    <div className="mback" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal nlpop" role="dialog" aria-modal="true" aria-label={t("Join our newsletter")}>
        <button className="btn s ico nlpop-x" aria-label={t("Close")} onClick={close}>✕</button>
        {!ok ? (
          <>
            <div className="nlpop-art" aria-hidden>✉️</div>
            <h3>{cfg?.title || t("Join our newsletter")}</h3>
            <p className="mu-t">{cfg?.text || t("Get 10% off your first order.")}</p>
            <div className="row">
              <input type="email" placeholder={t("Email")} aria-label={t("Email")} value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button className="btn" disabled={!email.includes("@")} onClick={submit}>{t("Claim")}</button>
            </div>
          </>
        ) : (
          <>
            <div className="nlpop-art" aria-hidden>🎉</div>
            <h3>{t("You're in!")}</h3>
            <p>{t("Use code")} <b className="app-popup-code">{cfg?.code || "WELCOME10"}</b> {t("for 10% off your first order.")}</p>
            <button className="btn" onClick={close}>{t("Start shopping")}</button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useT } from "../lib/fx";
import { enabledProviders, providerById, type PayProvider } from "../lib/payments";
import type { Settings } from "../types";

/** Radio-card list of enabled payment methods for the storefront checkout. */
export function PayMethodPicker({ pay, value, onChange }: { pay: Settings["pay"]; value: string; onChange(id: string): void }) {
  const t = useT();
  const list = enabledProviders(pay);
  return (
    <div className="paymethods" role="radiogroup" aria-label={t("Payment")}>
      {list.map((p) => (
        <label key={p.id} className={"paymethod" + (value === p.id ? " on" : "")}>
          <input type="radio" name="paymethod" checked={value === p.id} onChange={() => onChange(p.id)} />
          <span className="paybadge" style={{ background: p.color }}>{p.name.slice(0, 2).toUpperCase()}</span>
          <span><b>{p.name}</b><small>{p.tagline}</small></span>
        </label>
      ))}
    </div>
  );
}

/**
 * Mock gateway modal. In production this step becomes a redirect to the real
 * provider (bKash/Nagad/...); the backend verifies the callback and the
 * frontend only needs the success/fail return pages.
 */
export function PayGateway({ providerId, amount, fmt, testMode, onClose, onDone, manualNumber }: {
  providerId: string; amount: number; fmt(n: number): string; testMode: boolean;
  onClose(): void; onDone(trxId: string): void; manualNumber?: string;
}) {
  const t = useT();
  const p: PayProvider = providerById(providerId)!;
  const [step, setStep] = useState<"form" | "busy" | "ok">("form");
  const [acct, setAcct] = useState("");
  const [pin, setPin] = useState("");
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [sender, setSender] = useState("");
  const [userTrx, setUserTrx] = useState("");
  const [aggTab, setAggTab] = useState("bKash");
  const [err, setErr] = useState("");
  const valid = p.kind === "manual"
    ? sender.replace(/\D/g, "").length >= 10 && userTrx.trim().length >= 4
    : p.kind === "card"
      ? card.num.replace(/\D/g, "").length >= 12 && card.exp.trim().length >= 4 && card.cvc.trim().length >= 3
      : acct.replace(/\D/g, "").length >= 10 && pin.length >= 4;
  const confirm = async () => {
    if (!valid) return;
    // Manual MFS: the customer already sent the money; the TrxID they typed
    // is what the merchant verifies. No gateway charge happens here.
    if (p.kind === "manual") { onDone(userTrx.trim().toUpperCase()); return; }
    // Any other provider reaching this modal is a wiring bug — online gateways
    // (SSLCommerz) redirect via /payments/intents and never open this sheet.
    // Fail loudly instead of faking a charge.
    setErr(t("Online payment is handled by the gateway redirect. Please go back and choose SSLCommerz again."));
    setStep("form");
  };
  const brand = p.name.replace(" (manual)", "");
  return (
    <div className="gw-wrap" onClick={step === "form" ? onClose : undefined}>
      <div className="gw" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={p.name}>
        <div className="gw-head" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}>
          <b>{p.kind === "aggregator" ? "SSLCommerz" : p.name}</b>
          <div className="gw-amt">{fmt(amount)}</div>
          <div style={{ fontSize: 12, opacity: .85 }}>Demo Store</div>
        </div>
        <div className="gw-body">
          {testMode && <div className="gw-test">🧪 {t("This is a simulated gateway — no real money moves.")}</div>}
          {step === "form" && (<>
            {p.kind === "aggregator" && (
              <div className="row" style={{ marginBottom: 12 }}>
                {["bKash", "Nagad", "Card"].map((m) => (
                  <button key={m} className={"btn s" + (aggTab === m ? " on" : "")} onClick={() => setAggTab(m)}>{m}</button>
                ))}
              </div>
            )}
            {p.kind === "manual" && (<>
              <div className="gw-manual">
                <p style={{ margin: "0 0 8px" }}>{t("Send {amt} to our {brand} number:").replace("{amt}", fmt(amount)).replace("{brand}", brand)}</p>
                <div className="gw-num">{manualNumber || "01XXXXXXXXX"}</div>
                <p className="mu-t">{t("After sending, enter your sender number and the Transaction ID below.")}</p>
              </div>
              <input inputMode="tel" placeholder={t("Your sender mobile number")} value={sender} onChange={(e) => setSender(e.target.value)} />
              <input placeholder={t("Transaction ID (TrxID)")} value={userTrx} onChange={(e) => setUserTrx(e.target.value.toUpperCase())} />
            </>)}
            {p.kind === "mfs" && (<>
              <input inputMode="tel" placeholder={t("Mobile number") + ` (${p.name})`} value={acct} onChange={(e) => setAcct(e.target.value)} />
              <input inputMode="numeric" type="password" placeholder={t("PIN")} value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} />
            </>)}
            {p.kind === "card" && (<>
              <input inputMode="numeric" placeholder={t("Card number")} value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value })} />
              <div className="row"><input placeholder={t("Expiry") + " (MM/YY)"} value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
              <input inputMode="numeric" placeholder={t("CVC")} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} maxLength={4} /></div>
            </>)}
            {err && <p className="er-t">{err}</p>}
            <button className="btn" disabled={!valid} onClick={confirm} style={{ background: p.color, borderColor: p.color }}>
              {p.kind === "manual" ? t("I've sent the money") : <>{t("Pay")} {fmt(amount)}</>}
            </button>
            <button className="btn s plain" onClick={onClose}>{t("Cancel")}</button>
          </>)}
          {step === "busy" && (<><div className="gw-spin" /><p className="mu-t" style={{ textAlign: "center" }}>{t("Processing payment...")}</p></>)}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { api } from "../../api";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { shopStore, useShopData } from "../../lib/shop";
import { Loading } from "../../components/polaris";
import { PayGateway, PayMethodPicker } from "../../components/PaymentSheet";
import { enabledProviders, manualNumber, paymentsConfig, providerById } from "../../lib/payments";

const AMOUNTS = [10, 25, 50, 100];

export default function GiftCards() {
  const d = useShopData();
  const fx = useFx(d?.settings);
  const t = useT();
  const [amount, setAmount] = useState(25);
  const [to, setTo] = useState({ name: "", email: "" });
  const [from, setFrom] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"form" | "pay">("form");
  const [method, setMethod] = useState("");
  const [gwOpen, setGwOpen] = useState(false);
  useSeo("Gift cards", undefined, d?.settings.storeName);
  if (!d) return <Loading />;

  // Gift cards are delivered digitally, so Cash on Delivery is not offered.
  const payCfg = { ...d.settings.pay, methods: { ...(d.settings.pay.methods ?? {}), cod: false } };
  const methods = enabledProviders(payCfg);
  const issue = async (_trxId: string) => {
    setBusy(true); setErr("");
    try {
      const gc = await api.giftCards.save(shopStore(), {
        id: crypto.randomUUID(), code: "GC-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        initial: amount, balance: amount, active: true, createdAt: Date.now(),
      });
      setGwOpen(false); setBusy(false); setCode(gc.code);
    } catch (e) { setErr((e as Error).message); setBusy(false); setGwOpen(false); }
  };
  const toPay = () => {
    if (!to.email.includes("@")) return setErr(t("Enter the recipient email"));
    if (!(amount > 0)) return setErr(t("Enter a positive amount"));
    setErr("");
    setMethod(methods[0]?.id ?? "");
    setStep("pay");
  };
  const startPay = () => {
    if (!method) return setErr(t("Choose a payment method"));
    setErr(""); setGwOpen(true);
  };
  if (code) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h1 className="sec-t">{t("Gift card ready!")}</h1>
        <p>A {fx.fmt(amount)} gift card for <b>{to.name || to.email}</b> is ready. In a real store this would be emailed to {to.email}.</p>
        <div className="card" style={{ background: "var(--bg)", textAlign: "center", margin: "12px 0" }}>
          <div className="mu-t">{t("Gift card code")}</div>
          <div style={{ fontSize: 28, letterSpacing: 3, fontFamily: "monospace" }}>{code}</div>
        </div>
        <button className="btn s" onClick={() => { setCode(null); setTo({ name: "", email: "" }); setStep("form"); }}>{t("Buy another")}</button>
      </div>
    );
  }
  if (step === "pay") {
    const p = providerById(method);
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h1 className="sec-t">{t("Payment")}</h1>
        <div className="card" style={{ background: "var(--bg)", margin: "12px 0" }}>
          <div className="between"><span className="mu-t">{t("Gift card")}</span><b>{fx.fmt(amount)}</b></div>
          <div className="between"><span className="mu-t">{t("Recipient")}</span><span>{to.name || to.email}</span></div>
          <div className="between"><span className="mu-t">{t("Recipient email")}</span><span>{to.email}</span></div>
        </div>
        {methods.length === 0
          ? <p className="er-t">{t("No online payment methods are enabled for this store.")}</p>
          : <><PayMethodPicker pay={payCfg} value={method} onChange={setMethod} />
            {err && <p className="er-t">{err}</p>}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn s" onClick={() => setStep("form")}>{t("Back")}</button>
              <button className="btn" disabled={busy || !p} onClick={startPay}>{t("Pay")} {fx.fmt(amount)}</button>
            </div></>}
        {gwOpen && p && (
          <PayGateway providerId={p.id} amount={amount} fmt={fx.fmt}
            testMode={paymentsConfig(d.settings.pay).testMode}
            manualNumber={manualNumber(d.settings.pay, p.id)}
            onClose={() => setGwOpen(false)} onDone={issue} />
        )}
      </div>
    );
  }
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 className="sec-t">{t("Buy a gift card")}</h1>
      <p className="mu-t">{t("Give store credit to someone.")}</p>
      <label><span className="mu-t">{t("Amount")} ({fx.cur})</span>
        <div className="row" role="radiogroup" aria-label="Amount" style={{ flexWrap: "wrap" }}>
          {AMOUNTS.map((a) => (
            <button key={a} role="radio" aria-checked={amount === a} className={"btn s" + (amount === a ? " on" : "")} onClick={() => setAmount(a)}>{fx.fmt(a)}</button>
          ))}
          <input type="number" min={1} aria-label="Custom amount" placeholder={t("Custom")} value={Math.round(amount * (fx.rate || 1) * 100) / 100} onChange={(e) => setAmount(+e.target.value / (fx.rate || 1))} style={{ width: 100 }} />
        </div></label>
      <label><span className="mu-t">{t("Recipient name")}</span><input value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} placeholder="Sara" /></label>
      <label><span className="mu-t">{t("Recipient email")}</span><input value={to.email} onChange={(e) => setTo({ ...to, email: e.target.value })} placeholder="sara@example.com" /></label>
      <label><span className="mu-t">{t("From (optional)")}</span><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" /></label>
      {err && <p className="er-t">{err}</p>}
      <button className="btn" disabled={busy} onClick={toPay}>{t("Continue to payment")} — {fx.fmt(amount)}</button>
    </div>
  );
}

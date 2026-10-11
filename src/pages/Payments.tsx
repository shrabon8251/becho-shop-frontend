import { useState } from "react";
import { api } from "../api";
import { Card } from "../components/ui";
import { PageHeader, SaveBar, toast, Loading } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { PAYMENT_PROVIDERS, paymentsConfig, type PayProvider } from "../lib/payments";
import type { Settings } from "../types";

function ProviderRow({ p, on, testMode, onToggle, open, onOpen, manualNum, onManualNum }: {
  p: PayProvider; on: boolean; testMode: boolean; onToggle(): void; open: boolean; onOpen(): void;
  manualNum?: string; onManualNum?(v: string): void;
}) {
  const t = useT();
  return (
    <Card>
      <div className="between" style={{ alignItems: "center" }}>
        <div className="row" style={{ alignItems: "center" }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: p.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
            {p.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <b>{p.name}</b>
            <div className="mu-t">{p.tagline}</div>
          </div>
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <span className={"badge " + (on ? "ok" : "mu")}>{on ? t("On") : t("Off")}</span>
          <button className="btn s" onClick={onOpen}>{open ? t("Hide setup") : t("Setup")}</button>
          <label className="switch"><input type="checkbox" checked={on} onChange={onToggle} /><span /></label>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {p.kind === "cod" ? (
            <p className="mu-t">{t("No setup needed — customers pay in cash when they receive the order.")}</p>
          ) : p.kind === "manual" ? (
            <>
              <p className="mu-t">{t("Customers send money to this number and enter the TrxID at checkout. You verify each payment manually before fulfilling the order.")}</p>
              <label><span className="mu-t">{t("Your receiving number")}</span>
                <input inputMode="tel" placeholder="01XXXXXXXXX" value={manualNum ?? ""} onChange={(e) => onManualNum?.(e.target.value)} />
              </label>
              {testMode && <p className="ok-t" style={{ marginTop: 8 }}>🧪 {t("Test mode is on — checkout uses a simulated gateway, no real money moves.")}</p>}
            </>
          ) : p.kind === "aggregator" ? (
            <>
              <p className="mu-t">{t("One integration for bKash, Nagad, Rocket, cards and bank transfer. Register at SSLCommerz to get your Store ID and Password, then add them as backend environment variables:")}</p>
              <div className="row" style={{ flexWrap: "wrap" }}>{p.envKeys.map((k) => <code key={k} className="pill">{k}</code>)}</div>
              {testMode && <p className="ok-t" style={{ marginTop: 8 }}>🧪 {t("Test mode is on — checkout uses a simulated gateway, no real money moves.")}</p>}
            </>
          ) : (
            <>
              <p className="mu-t">{t("Live credentials are configured on your backend server (never in the browser). Add these environment variables when you deploy the backend:")}</p>
              <div className="row" style={{ flexWrap: "wrap" }}>{p.envKeys.map((k) => <code key={k} className="pill">{k}</code>)}</div>
              {testMode && <p className="ok-t" style={{ marginTop: 8 }}>🧪 {t("Test mode is on — checkout uses a simulated gateway, no real money moves.")}</p>}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export default function Payments() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => api.settings.get(storeId), [storeId]);
  const [base, setBase] = useState<Settings | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!data) return <Loading />;
  const cur: Settings = s ?? data;
  if (!s) { setS(data); setBase(data); }
  const cfg = paymentsConfig(cur.pay);
  const dirty = base && JSON.stringify(cur) !== JSON.stringify(base);
  const setMethods = (methods: Record<string, boolean>) =>
    setS({ ...cur, pay: { ...cur.pay, methods, cod: !!methods.cod } });
  const save = async () => { await api.settings.save(storeId, cur); setBase(cur); toast(t("Settings saved")); };
  return (
    <div>
      <PageHeader title={t("Payments")} />
      <p className="mu-t" style={{ marginTop: -8 }}>{t("Choose how customers pay you. Cash on delivery, SSLCommerz (cards, bKash, Nagad, Rocket, bank), or manual mobile banking with TrxID.")}</p>
      <Card>
        <div className="between" style={{ alignItems: "center" }}>
          <div><b>🧪 {t("Test mode")}</b><div className="mu-t">{t("Simulate payments without moving real money. Turn off when your backend gateway keys are live.")}</div></div>
          <label className="switch"><input type="checkbox" checked={cfg.testMode} onChange={(e) => setS({ ...cur, pay: { ...cur.pay, testMode: e.target.checked } })} /><span /></label>
        </div>
      </Card>
      {PAYMENT_PROVIDERS.map((p) => (
        <ProviderRow key={p.id} p={p} on={!!cfg.methods[p.id]} testMode={cfg.testMode}
          onToggle={() => setMethods({ ...cfg.methods, [p.id]: !cfg.methods[p.id] })}
          open={openId === p.id} onOpen={() => setOpenId(openId === p.id ? null : p.id)}
          manualNum={p.kind === "manual" ? (cur.pay.manualNumbers?.[p.id] ?? "") : undefined}
          onManualNum={p.kind === "manual" ? (v) => setS({ ...cur, pay: { ...cur.pay, manualNumbers: { ...(cur.pay.manualNumbers ?? {}), [p.id]: v } } }) : undefined} />
      ))}
      <SaveBar dirty={!!dirty} onSave={() => void save()} onDiscard={() => { setS(base); }} />
    </div>
  );
}

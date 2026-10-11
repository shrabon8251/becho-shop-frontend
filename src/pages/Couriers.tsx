import { useState } from "react";
import { api } from "../api";
import { Card } from "../components/ui";
import { PageHeader, SaveBar, toast, Loading } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { COURIERS, courierSettings, type Courier } from "../lib/couriers";
import type { Settings } from "../types";

function CourierRow({ c, cfg, open, onOpen, onToggle, onCred }: {
  c: Courier; cfg: { on: boolean; creds: Record<string, string> }; open: boolean;
  onOpen(): void; onToggle(): void; onCred(key: string, v: string): void;
}) {
  const t = useT();
  const [testing, setTesting] = useState(false);
  const test = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 900));
    setTesting(false);
    const ok = c.fields.every((f) => (cfg.creds[f.key] ?? "").trim().length > 0);
    toast(ok ? t("Connection looks good (demo check).") : t("Fill in the credentials first."), !ok);
  };
  return (
    <Card>
      <div className="between" style={{ alignItems: "center" }}>
        <div className="row" style={{ alignItems: "center" }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: c.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
            {c.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <b>{c.name}</b>
            <div className="mu-t">{c.tagline}</div>
          </div>
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <span className={"badge " + (cfg.on ? "ok" : "mu")}>{cfg.on ? t("Connected") : t("Off")}</span>
          <button className="btn s" onClick={onOpen}>{open ? t("Hide setup") : t("Setup")}</button>
          <label className="switch"><input type="checkbox" checked={cfg.on} onChange={onToggle} /><span /></label>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <p className="mu-t">{t("Enter your courier API credentials. Real API calls run on your backend — these keys are stored for the backend to use and never exposed to shoppers.")}</p>
          <div className="grid2">
            {c.fields.map((f) => (
              <label key={f.key}>{f.label}
                <input type={f.secret ? "password" : "text"} value={cfg.creds[f.key] ?? ""} onChange={(e) => onCred(f.key, e.target.value)} placeholder="••••••" autoComplete="off" />
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn s" disabled={testing} onClick={() => void test()}>{testing ? t("Testing…") : t("Test connection")}</button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Couriers() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => api.settings.get(storeId), [storeId]);
  const [base, setBase] = useState<Settings | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!data) return <Loading />;
  const cur: Settings = s ?? data;
  if (!s) { setS(data); setBase(data); }
  const cfg = courierSettings(cur.couriers);
  const dirty = base && JSON.stringify(cur) !== JSON.stringify(base);
  const setCfg = (id: string, c: { on: boolean; creds: Record<string, string> }) =>
    setS({ ...cur, couriers: { ...cfg, [id]: c } });
  const save = async () => { await api.settings.save(storeId, cur); setBase(cur); toast(t("Settings saved")); };
  return (
    <div>
      <PageHeader title={t("Couriers")} />
      <p className="mu-t" style={{ marginTop: -8 }}>{t("Connect courier partners to create consignments and track deliveries right from your orders.")}</p>
      {COURIERS.map((c) => (
        <CourierRow key={c.id} c={c} cfg={cfg[c.id]}
          onToggle={() => setCfg(c.id, { ...cfg[c.id], on: !cfg[c.id].on })}
          onCred={(key, v) => setCfg(c.id, { ...cfg[c.id], creds: { ...cfg[c.id].creds, [key]: v } })}
          open={openId === c.id} onOpen={() => setOpenId(openId === c.id ? null : c.id)} />
      ))}
      <SaveBar dirty={!!dirty} onSave={() => void save()} onDiscard={() => { setS(base); }} />
    </div>
  );
}

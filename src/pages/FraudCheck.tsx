import { useState } from "react";
import { api } from "../api";
import { Card } from "../components/ui";
import { PageHeader } from "../components/polaris";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import { fraudHistory, mockIpInfo, RISK_META, saveFraudCheck, type FraudResult, type FraudRisk } from "../lib/fraud";

const RISK_LABEL: Record<FraudRisk, string> = { low: "Low risk", medium: "Medium risk", high: "High risk", unknown: "No history" };
const RISK_ICON: Record<FraudRisk, string> = { low: "✅", medium: "⚠️", high: "🚨", unknown: "❔" };

function RiskBadge({ risk }: { risk: FraudRisk }) {
  const t = useT();
  const m = RISK_META[risk];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontWeight: 700, fontSize: 13, color: m.color, background: m.bg }}>
      {RISK_ICON[risk]} {t(RISK_LABEL[risk])}
    </span>
  );
}

export function FraudResultCard({ r, compact }: { r: FraudResult; compact?: boolean }) {
  const t = useT();
  const ip = mockIpInfo(r.phone);
  const advice = r.risk === "low"
    ? t("Genuine customer — safe to ship with cash on delivery.")
    : r.risk === "medium"
      ? t("Call the customer to confirm before shipping. Consider advance payment.")
      : r.risk === "high"
        ? t("Do NOT ship COD without advance payment. High return/cancel history.")
        : t("No courier history for this number — verify by phone call or SMS code.");
  return (
    <Card>
      <div className="between" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div><b style={{ fontSize: 17 }}>📱 {r.phone}</b><div className="mu-t">{t("Checked just now")} · {r.couriers.join(", ") || t("No courier data")}</div></div>
        <RiskBadge risk={r.risk} />
      </div>
      {r.totalParcels > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, margin: "14px 0" }}>
            {[[t("Total parcels"), r.totalParcels, "#0f172a"], [t("Delivered"), r.delivered, "#166534"], [t("Cancelled"), r.cancelled, "#92400e"], [t("Returned"), r.returned, "#991b1b"]].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: "var(--bg-sub,#f8fafc)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: String(c) }}>{v}</div>
                <div className="mu-t">{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 6 }} className="between"><span className="mu-t">{t("Delivery success rate")}</span><b>{r.successRate}%</b></div>
          <div style={{ height: 10, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
            <div style={{ width: `${r.successRate}%`, height: "100%", borderRadius: 99, background: r.risk === "low" ? "#22c55e" : r.risk === "medium" ? "#f59e0b" : "#ef4444", transition: "width .6s" }} />
          </div>
          <p className="mu-t">{t("First seen")}: {r.firstSeen} · {t("Last seen")}: {r.lastSeen}</p>
        </>
      ) : (
        <p className="mu-t" style={{ margin: "12px 0" }}>{t("This number has no parcel history with connected couriers.")}</p>
      )}
      {!compact && (
        <>
          <div style={{ background: RISK_META[r.risk].bg, borderRadius: 10, padding: "10px 14px", margin: "10px 0", color: RISK_META[r.risk].color, fontWeight: 600, fontSize: 13 }}>
            💡 {advice}
          </div>
          <div className="mu-t">🌐 {t("Order IP")}: <b>{ip.ip}</b> ({ip.city}, {ip.country})
            {ip.vpn && <span style={{ color: "#991b1b", fontWeight: 700 }}> · ⚠️ {t("VPN detected")}</span>}
            {ip.ordersFromIp > 1 && <span> · {t("{n} orders from this IP").replace("{n}", String(ip.ordersFromIp))}</span>}
          </div>
        </>
      )}
    </Card>
  );
}

export default function FraudCheck() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<FraudResult | null>(null);
  const [live, setLive] = useState(false);
  const [hist, setHist] = useState<FraudResult[]>(() => fraudHistory());
  const [busy, setBusy] = useState(false);
  const run = async (p?: string) => {
    const num = (p ?? phone).replace(/\D/g, "");
    if (num.length < 10) return;
    setBusy(true);
    try {
      const { result: r, live: isLive } = await api.fraud.check(storeId, num);
      saveFraudCheck(r); setResult(r); setLive(isLive); setHist(fraudHistory());
    } catch { /* network error — keep old result */ }
    setBusy(false);
  };
  return (
    <div>
      <PageHeader title={t("Fraud check")} />
      <p className="mu-t" style={{ margin: "-8px 0 12px" }}>{t("Check a customer's courier delivery history before shipping COD orders.")}</p>
      <Card>
        <p className="mu-t" style={{ marginTop: 0 }}>{t("Enter the customer's phone number to see their parcel history across couriers.")}</p>
        {result && <p className="mu-t">{live
          ? <span className="ok-t">● {t("Live data from courier APIs")}</span>
          : <span>○ {t("Demo data — backend courier integration pending")}</span>}</p>}
        <div className="row">
          <input inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()} style={{ flex: 1 }} aria-label={t("Phone number")} />
          <button className="btn" disabled={busy || phone.replace(/\D/g, "").length < 10} onClick={() => void run()}>
            {busy ? t("Checking…") : `🔍 ${t("Check")}`}
          </button>
        </div>
      </Card>
      {result && <div style={{ marginTop: 14 }}><FraudResultCard r={result} /></div>}
      {hist.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ margin: "0 0 8px" }}>{t("Recent checks")}</h4>
          <Card>
            {hist.map((h) => (
              <div key={h.phone} className="between" style={{ padding: "8px 0", borderBottom: "1px solid var(--bd,#eef0f3)", cursor: "pointer" }} onClick={() => void run(h.phone)}>
                <span><b>{h.phone}</b> <span className="mu-t">· {h.totalParcels} {t("parcels")} · {h.successRate}%</span></span>
                <RiskBadge risk={h.risk} />
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { api } from "../../api";
import { shopStore, useShopData } from "../../lib/shop";
import { useT } from "../../lib/fx";
import { themeStyle } from "../../lib/theme";
import { Loading } from "../../components/polaris";
import type { TrackedOrder } from "../../types";

/** Ship Tracker app: branded order tracking page with timeline. */
export default function Track() {
  const t = useT();
  const d = useShopData();
  const [f, setF] = useState({ id: "", email: "" });
  const [o, setO] = useState<TrackedOrder | null>(null);
  const [err, setErr] = useState("");
  if (!d) return <Loading />;
  const branded = (d.apps.installed ?? []).includes("ship-tracker");
  const find = async () => {
    const id = Number(f.id.replace("#", ""));
    if (!Number.isInteger(id) || !f.email.includes("@")) return setErr(t("Enter your order number and email"));
    try { setO(await api.tracking.lookup(shopStore(), id, f.email)); setErr(""); } catch (e) { setO(null); setErr((e as Error).message); }
  };
  const steps: [string, boolean][] = o ? [[t("Order placed"), true], [t("Payment received"), o.pay === "Paid" || o.pay === "Refunded"], [t("Fulfilled"), o.ful === "Fulfilled"], [t("Delivered"), o.ful === "Fulfilled"]] : [];
  return (
    <div className={"page track-page" + (branded ? " branded" : "")} style={branded ? themeStyle(d.theme) : undefined}>
      {branded && <div className="track-brand"><b>{d.theme.logoText || d.settings.storeName}</b><span>{t("Order tracking")}</span></div>}
      <div className="card track-card">
        <h3>🚚 {t("Track your order")}</h3>
        <div className="track-form">
          <input placeholder={t("Order number (e.g. 1041)")} value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} />
          <input placeholder={t("Email used at checkout")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <button className="btn" onClick={find}>{t("Track")}</button>
        </div>
        {err && <p className="er-t">{err}</p>}
        {o && <div className="track-result">
          <b>Order #{o.id}</b>
          {o.pay === "Cancelled" ? <p className="er-t">{t("This order was cancelled.")}</p> : (
            <div className="track-timeline">
              {steps.map(([label, done], i) => (
                <div key={label} className={"track-step" + (done ? " done" : "")}>
                  <span className="track-dot">{done ? "✓" : "○"}</span>
                  <span>{label}</span>
                  {i < steps.length - 1 && <span className="track-line" />}
                </div>))}
            </div>)}
          <ul className="track-items">{o.items.map((i, k) => <li key={k}>{i.title} ({i.variant}) ×{i.qty}</li>)}</ul>
          {o.log.map((e, k) => <div key={k} className="between"><span>{e.text}</span><span className="mu-t">{new Date(e.at).toLocaleString()}</span></div>)}
        </div>}
      </div>
    </div>
  );
}

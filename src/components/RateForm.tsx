import { useState } from "react";
import { MOCK_CARRIERS } from "../lib/shipping";
import { Modal } from "./polaris";
import type { ShippingRate } from "../types";
import { useT } from "../lib/fx";

export default function RateForm({ initial, currency, onClose, onSave }: {
  initial: ShippingRate; currency: string; onClose(): void; onSave(r: ShippingRate): void;
}) {
  const t = useT();
  const [r, setR] = useState({
    name: initial.name, price: String(initial.price),
    kind: initial.carrier ? "carrier" : "flat",
    carrier: initial.carrier ?? MOCK_CARRIERS[0], perKg: String(initial.perKg ?? 0),
    minSubtotal: initial.minSubtotal !== undefined ? String(initial.minSubtotal) : "",
    maxSubtotal: initial.maxSubtotal !== undefined ? String(initial.maxSubtotal) : "",
    minWeight: initial.minWeight !== undefined ? String(initial.minWeight) : "",
    maxWeight: initial.maxWeight !== undefined ? String(initial.maxWeight) : "",
  });
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof r>) => setR({ ...r, ...p });
  const num = (v: string) => (v === "" ? undefined : +v);

  const save = () => {
    const price = +r.price, perKg = +r.perKg;
    if (!r.name.trim()) return setErr(t("Enter a rate name"));
    if (!(price >= 0)) return setErr(t("Enter a valid price"));
    if (r.kind === "carrier" && !(perKg >= 0)) return setErr(t("Enter a valid per-kg price"));
    for (const [k, v] of [["minSubtotal", r.minSubtotal], ["maxSubtotal", r.maxSubtotal], ["minWeight", r.minWeight], ["maxWeight", r.maxWeight]] as const) {
      if (v !== "" && !(+v >= 0)) return setErr(t(`Invalid ${k}`));
    }
    if (r.minSubtotal !== "" && r.maxSubtotal !== "" && +r.minSubtotal > +r.maxSubtotal) return setErr(t("Min subtotal cannot exceed max"));
    if (r.minWeight !== "" && r.maxWeight !== "" && +r.minWeight > +r.maxWeight) return setErr(t("Min weight cannot exceed max"));
    onSave({
      ...initial, name: r.name.trim(), price,
      carrier: r.kind === "carrier" ? r.carrier : undefined,
      perKg: r.kind === "carrier" ? perKg : undefined,
      minSubtotal: num(r.minSubtotal), maxSubtotal: num(r.maxSubtotal),
      minWeight: num(r.minWeight), maxWeight: num(r.maxWeight),
    });
  };

  return (
    <Modal open onClose={onClose} title={initial.id ? t("Edit rate") : t("Add rate")}
      footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" onClick={save}>{t("Save")}</button></>}>
      <label><span className="mu-t">{t("Rate name")}</span><input autoFocus placeholder="Standard" value={r.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <div className="seg" role="radiogroup" aria-label={t("Rate type")} style={{ margin: "8px 0" }}>
        {(["flat", "carrier"] as const).map((k) => (
          <button key={k} role="radio" aria-checked={r.kind === k} className={"btn s" + (r.kind === k ? " on" : "")} onClick={() => set({ kind: k })}>
            {k === "flat" ? t("Flat rate") : t("Carrier rate")}</button>))}
      </div>
      {r.kind === "flat" ? (
        <label><span className="mu-t">{t(`Price (${currency})`)}</span><input type="number" min={0} value={r.price} onChange={(e) => set({ price: e.target.value })} /></label>
      ) : (<>
        <div className="row">
          <label style={{ flex: 1 }}><span className="mu-t">{t("Carrier")}</span>
            <select value={r.carrier} onChange={(e) => set({ carrier: e.target.value })}>{MOCK_CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label style={{ flex: 1 }}><span className="mu-t">{t(`Base price (${currency})`)}</span><input type="number" min={0} value={r.price} onChange={(e) => set({ price: e.target.value })} /></label>
          <label style={{ flex: 1 }}><span className="mu-t">{t(`Per kg (${currency})`)}</span><input type="number" min={0} value={r.perKg} onChange={(e) => set({ perKg: e.target.value })} /></label>
        </div>
        <p className="hint">{t("Charged as base + per-kg × order weight (mock calculation).")}</p>
      </>)}
      <b style={{ display: "block", marginTop: 12 }}>{t("Conditions")} <span className="mu-t">{t("(optional)")}</span></b>
      <div className="row">
        <label style={{ flex: 1 }}><span className="mu-t">{t("Min subtotal")}</span><input type="number" min={0} placeholder="—" value={r.minSubtotal} onChange={(e) => set({ minSubtotal: e.target.value })} /></label>
        <label style={{ flex: 1 }}><span className="mu-t">{t("Max subtotal")}</span><input type="number" min={0} placeholder="—" value={r.maxSubtotal} onChange={(e) => set({ maxSubtotal: e.target.value })} /></label>
      </div>
      <div className="row">
        <label style={{ flex: 1 }}><span className="mu-t">{t("Min weight (kg)")}</span><input type="number" min={0} placeholder="—" value={r.minWeight} onChange={(e) => set({ minWeight: e.target.value })} /></label>
        <label style={{ flex: 1 }}><span className="mu-t">{t("Max weight (kg)")}</span><input type="number" min={0} placeholder="—" value={r.maxWeight} onChange={(e) => set({ maxWeight: e.target.value })} /></label>
      </div>
      {err && <p className="er-t">{err}</p>}
    </Modal>
  );
}

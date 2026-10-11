import { useState } from "react";
import { PageHeader } from "./polaris";
import { Card } from "./ui";
import type { DeliveryProfile, Product, ShippingZone } from "../types";
import { useT } from "../lib/fx";

export default function ProfileForm({ initial, products, zones, onSave, onBack }: {
  initial: DeliveryProfile; products: Product[]; zones: ShippingZone[];
  onSave(p: DeliveryProfile): void; onBack(): void;
}) {
  const t = useT();
  const [p, setP] = useState(initial);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const inIds = new Set(p.productIds);
  const results = q.trim()
    ? products.filter((x) => !inIds.has(x.id) && x.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const toggleZone = (id: string) =>
    setP({ ...p, zoneIds: p.zoneIds.includes(id) ? p.zoneIds.filter((z) => z !== id) : [...p.zoneIds, id] });
  const save = () => {
    if (!p.name.trim()) return setErr(t("Enter a profile name"));
    if (!p.zoneIds.length) return setErr(t("Select at least one zone"));
    onSave({ ...p, name: p.name.trim() });
  };
  return (
    <>
      <PageHeader title={p.name || t("New delivery profile")} back={onBack}
        actions={<button className="btn" onClick={save}>{t("Save")}</button>} />
      {err && <p className="er-t">{err}</p>}
      <div className="two">
        <div>
          <Card><label><b>{t("Profile name")}</b><input autoFocus value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder={t("e.g. Heavy items")} /></label></Card>
          <Card><b>{t("Products")} ({p.productIds.length})</b>
            <p className="hint">{t("Products not in any profile use the general shipping rates.")}</p>
            {products.filter((x) => inIds.has(x.id)).map((x) => (
              <div className="between line" key={x.id}><span className="prod">{x.images[0] ? <img className="tn" src={x.images[0]} alt="" /> : <span className="tn ph0" />}{x.title}</span>
                <button className="btn s" onClick={() => setP({ ...p, productIds: p.productIds.filter((id) => id !== x.id) })}>{t("Remove")}</button></div>))}
            <label style={{ marginTop: 8 }}><span className="mu-t">{t("Add products")}</span>
              <input type="search" placeholder={t("Search products…")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
            {results.map((x) => (
              <div className="between" key={x.id} style={{ padding: "4px 0" }}>
                <span className="prod">{x.images[0] ? <img className="tn" src={x.images[0]} alt="" /> : <span className="tn ph0" />}{x.title}</span>
                <button className="btn s" onClick={() => { setP({ ...p, productIds: [...p.productIds, x.id] }); setQ(""); }}>{t("Add")}</button>
              </div>))}
          </Card>
        </div>
        <div>
          <Card><b>{t("Shipping zones")}</b><p className="hint">{t("Orders containing these products can only ship to these zones.")}</p>
            {zones.map((z) => (
              <label className="check" key={z.id}>
                <input type="checkbox" checked={p.zoneIds.includes(z.id)} onChange={() => toggleZone(z.id)} />{z.name}
              </label>))}
          </Card>
        </div>
      </div>
    </>
  );
}

import { useState } from "react";
import { api } from "../api";
import { Badge, Card } from "../components/ui";
import { Confirm, EmptyState, Modal, PageHeader, SaveBar, toast, Loading } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Settings, TaxRegion } from "../types";

function RegionForm({ initial, onClose, onSave }: { initial: TaxRegion; onClose(): void; onSave(r: TaxRegion): void }) {
  const t = useT();
  const [r, setR] = useState(initial);
  const [err, setErr] = useState("");
  const save = () => {
    if (!r.name.trim()) return setErr(t("Region name is required"));
    if (!(r.rate >= 0) || r.rate > 100) return setErr(t("Rate must be between 0 and 100"));
    onSave({ ...r, name: r.name.trim() });
  };
  return (
    <Modal open onClose={onClose} title={initial.id ? t("Edit tax region") : t("Add tax region")}
      footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" onClick={save}>{t("Save")}</button></>}>
      <label><span className="mu-t">{t("Region name")}</span><input autoFocus value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder={t("e.g. California, EU, Dhaka")} /></label>
      <label><span className="mu-t">{t("Tax rate (%)")}</span><input type="number" min={0} max={100} step="any" value={r.rate} onChange={(e) => setR({ ...r, rate: +e.target.value })} /></label>
      {err && <p className="er-t">{err}</p>}
    </Modal>
  );
}

export default function Taxes() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => api.settings.get(storeId), [storeId]);
  const [base, setBase] = useState<Settings | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [form, setForm] = useState<TaxRegion | null>(null);
  const [confirm, setConfirm] = useState<TaxRegion | null>(null);
  if (!data) return <Loading />;
  const cur: Settings = s ?? data;
  if (!s) { setS(data); setBase(data); }
  const dirty = base && JSON.stringify(cur) !== JSON.stringify(base);
  const set = (p: Partial<Settings>) => { setS({ ...cur, ...p }); };
  const upZone = (id: string, p: object) => set({ zones: cur.zones.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const save = async () => {
    if (cur.tax.rate < 0 || cur.tax.rate > 100) return toast(t("Tax rate must be between 0 and 100"));
    if (cur.taxRegions.some((r) => !r.name.trim() || r.rate < 0 || r.rate > 100)) return toast(t("Check tax region names and rates"));
    if (cur.zones.some((z) => (z.duties?.rate ?? 0) < 0)) return toast(t("Duty rates must be 0 or more"));
    try { await api.settings.save(storeId, cur); setBase(cur); toast(t("Tax settings saved")); } catch (e) { toast((e as Error).message); }
  };
  const regions = cur.taxRegions;
  return (
    <>
      <PageHeader title={t("Taxes and duties")} actions={<button className="btn" onClick={() => setForm({ id: "", name: "", rate: 0 })}>{t("Add tax region")}</button>} />
      <p className="mu-t" style={{ margin: "-8px 0 16px" }}>{t("Set a default tax rate, add tax regions (nexus) with their own rates, and assign regions to shipping zones. Duties can be collected per zone for cross-border orders.")}</p>
      <Card><b>{t("Default tax")}</b>
        <label className="check"><input type="checkbox" checked={cur.tax.on} onChange={(e) => set({ tax: { ...cur.tax, on: e.target.checked } })} />{t("Collect tax")}</label>
        <label>{t("Default tax rate (%)")}<input type="number" min={0} max={100} step="any" value={cur.tax.rate} onChange={(e) => set({ tax: { ...cur.tax, rate: +e.target.value } })} /></label>
        <label className="check"><input type="checkbox" checked={cur.tax.inclusive} onChange={(e) => set({ tax: { ...cur.tax, inclusive: e.target.checked } })} />{t("All prices include tax")}</label>
      </Card>
      <Card><div className="between"><b>{t("Tax regions")}</b><Badge t={`${regions.length}`} /></div>
        {regions.length === 0 ? <EmptyState title={t("No tax regions yet")} text={t("Add one when you have tax nexus in another region.")} /> : (
          <table className="ptable"><thead><tr><th>{t("Region")}</th><th>{t("Rate")}</th><th></th></tr></thead>
            <tbody>{regions.map((r) => (
              <tr key={r.id}><td>{r.name}</td><td>{r.rate}%</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn s" onClick={() => setForm(r)}>{t("Edit")}</button>{" "}
                  <button className="btn s" onClick={() => setConfirm(r)}>{t("Delete")}</button>
                </td></tr>))}
            </tbody></table>)}
      </Card>
      <Card><b>{t("Zones: tax region & duties")}</b>
        <table className="ptable"><thead><tr><th>{t("Zone")}</th><th>{t("Tax region")}</th><th>{t("Collect duties")}</th><th>{t("Duty rate (%)")}</th></tr></thead>
          <tbody>{cur.zones.map((z) => (
            <tr key={z.id}>
              <td>{z.name}</td>
              <td><select aria-label={t(`Tax region for ${z.name}`)} value={z.taxRegionId ?? ""} onChange={(e) => upZone(z.id, { taxRegionId: e.target.value || undefined })}>
                <option value="">{t("Default rate")}</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.rate}%)</option>)}
              </select></td>
              <td><input type="checkbox" aria-label={t(`Collect duties for ${z.name}`)} checked={!!z.duties?.collect} onChange={(e) => upZone(z.id, { duties: { collect: e.target.checked, rate: z.duties?.rate ?? 0 } })} /></td>
              <td><input type="number" min={0} step="any" aria-label={t(`Duty rate for ${z.name}`)} value={z.duties?.rate ?? 0} disabled={!z.duties?.collect} onChange={(e) => upZone(z.id, { duties: { collect: true, rate: +e.target.value } })} /></td>
            </tr>))}
          </tbody></table>
        <p className="mu-t">{t("Duties are charged as a percentage of the discounted subtotal, on top of shipping and tax.")}</p>
      </Card>
      {form && (
        <RegionForm initial={form} onClose={() => setForm(null)}
          onSave={(r) => {
            const reg = r.id ? r : { ...r, id: crypto.randomUUID() };
            set({ taxRegions: r.id ? regions.map((x) => (x.id === r.id ? reg : x)) : [...regions, reg] });
            setForm(null);
          }} />
      )}
      {confirm && (
        <Confirm open title={t(`Delete tax region "${confirm.name}"?`)} message={t("Zones using this region will fall back to the default tax rate.")} onClose={() => setConfirm(null)}
          onConfirm={() => {
            set({ taxRegions: regions.filter((x) => x.id !== confirm.id), zones: cur.zones.map((z) => (z.taxRegionId === confirm.id ? { ...z, taxRegionId: undefined } : z)) });
            setConfirm(null);
          }} />
      )}
      {dirty ? <SaveBar dirty onSave={() => void save()} onDiscard={() => { setS(base); }} /> : null}
    </>
  );
}

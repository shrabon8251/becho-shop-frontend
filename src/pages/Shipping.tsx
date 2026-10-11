import { useState } from "react";
import { api } from "../api";
import ProfileForm from "../components/ProfileForm";
import RateForm from "../components/RateForm";
import { Confirm, EmptyState, IndexTable, Modal, Page, toast, Loading } from "../components/polaris";
import { Badge, Card } from "../components/ui";
import { zoneRates } from "../lib/shipping";
import { money } from "../lib/money";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { DeliveryProfile, Product, Settings, ShippingRate, ShippingZone } from "../types";

function condText(r: ShippingRate, cur: string): string {
  const parts: string[] = [];
  if (r.minSubtotal !== undefined || r.maxSubtotal !== undefined)
    parts.push(`order ${r.minSubtotal !== undefined ? money(r.minSubtotal, cur) : "0"}–${r.maxSubtotal !== undefined ? money(r.maxSubtotal, cur) : "∞"}`);
  if (r.minWeight !== undefined || r.maxWeight !== undefined)
    parts.push(`${r.minWeight ?? 0}–${r.maxWeight ?? "∞"} kg`);
  return parts.join(" · ");
}

function priceText(r: ShippingRate, cur: string): string {
  return r.carrier ? `${money(r.price, cur)} + ${money(r.perKg ?? 0, cur)}/kg` : money(r.price, cur);
}

function RatesTab({ settings, onSave }: { settings: Settings; onSave(s: Settings): void }) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const [zoneEdit, setZoneEdit] = useState<{ id: string; name: string; countries: string } | null>(null);
  const [rateEdit, setRateEdit] = useState<{ zoneId: string; rate: ShippingRate } | null>(null);
  const [confirmZone, setConfirmZone] = useState<ShippingZone | null>(null);
  const [confirmRate, setConfirmRate] = useState<{ zoneId: string; rate: ShippingRate } | null>(null);
  const [zerr, setZerr] = useState("");
  const cur = settings.currency;
  const patchZones = (zones: ShippingZone[]) => onSave({ ...settings, zones });

  const saveZone = () => {
    if (!zoneEdit!.name.trim()) return setZerr(t("Enter a zone name"));
    const zones = zoneEdit!.id
      ? settings.zones.map((z) => (z.id === zoneEdit!.id ? { ...z, name: zoneEdit!.name.trim(), countries: zoneEdit!.countries.trim() || undefined } : z))
      : [...settings.zones, { id: crypto.randomUUID(), name: zoneEdit!.name.trim(), countries: zoneEdit!.countries.trim() || undefined, rate: 0, rates: [] }];
    patchZones(zones); setZoneEdit(null); setZerr(""); toast(t("Zone saved"));
  };
  const deleteZone = async () => {
    if (!confirmZone) return;
    patchZones(settings.zones.filter((z) => z.id !== confirmZone.id));
    const profiles = await api.shippingProfiles.list(storeId);
    for (const p of profiles.filter((x) => x.zoneIds.includes(confirmZone.id)))
      await api.shippingProfiles.save(storeId, { ...p, zoneIds: p.zoneIds.filter((z) => z !== confirmZone.id) });
    setConfirmZone(null); toast(t("Zone deleted"));
  };
  const saveRate = (rate: ShippingRate) => {
    const zones = settings.zones.map((z) => {
      if (z.id !== rateEdit!.zoneId) return z;
      const rates = zoneRates(z);
      const next = rates.some((x) => x.id === rate.id) ? rates.map((x) => (x.id === rate.id ? rate : x)) : [...rates, rate];
      return { ...z, rates: next, rate: next.length ? Math.min(...next.map((x) => x.price)) : z.rate };
    });
    patchZones(zones); setRateEdit(null); toast(t("Rate saved"));
  };
  const deleteRate = () => {
    if (!confirmRate) return;
    const zones = settings.zones.map((z) => (z.id === confirmRate.zoneId ? { ...z, rates: zoneRates(z).filter((x) => x.id !== confirmRate.rate.id) } : z));
    patchZones(zones); setConfirmRate(null); toast(t("Rate deleted"));
  };

  return (
    <>
      <div style={{ marginBottom: 12 }}><button className="btn" onClick={() => setZoneEdit({ id: "", name: "", countries: "" })}>{t("Add zone")}</button></div>
      {settings.zones.map((z) => (
        <Card key={z.id}>
          <div className="between">
            <div><b>{z.name}</b>{z.countries && <span className="mu-t"> — {z.countries}</span>}</div>
            <span className="acts">
              <button className="btn s" onClick={() => setZoneEdit({ id: z.id, name: z.name, countries: z.countries ?? "" })}>{t("Edit")}</button>
              <button className="btn s" onClick={() => setConfirmZone(z)}>{t("Delete")}</button>
            </span>
          </div>
          <table style={{ marginTop: 8 }}><tbody>
            {zoneRates(z).map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b> {r.carrier && <Badge t={r.carrier} />}</td>
                <td className="mu-t">{condText(r, cur) || "—"}</td>
                <td style={{ textAlign: "right" }}>{priceText(r, cur)}</td>
                <td style={{ textAlign: "right" }}><span className="acts" style={{ justifyContent: "flex-end" }}>
                  <button className="btn s" onClick={() => setRateEdit({ zoneId: z.id, rate: r })}>{t("Edit")}</button>
                  <button className="btn s" onClick={() => setConfirmRate({ zoneId: z.id, rate: r })}>{t("Delete")}</button>
                </span></td>
              </tr>))}
          </tbody></table>
          <button className="btn s" style={{ marginTop: 8 }} onClick={() => setRateEdit({ zoneId: z.id, rate: { id: crypto.randomUUID(), name: "", price: 0 } })}>{t("Add rate")}</button>
        </Card>
      ))}
      <Modal open={!!zoneEdit} title={zoneEdit?.id ? t("Edit zone") : t("Add zone")} onClose={() => { setZoneEdit(null); setZerr(""); }}
        footer={<><button className="btn s" onClick={() => { setZoneEdit(null); setZerr(""); }}>{t("Cancel")}</button><button className="btn" onClick={saveZone}>{t("Save")}</button></>}>
        <label><span className="mu-t">{t("Zone name")}</span><input autoFocus value={zoneEdit?.name ?? ""} onChange={(e) => setZoneEdit({ ...zoneEdit!, name: e.target.value })} placeholder={t("Inside Dhaka")} /></label>
        <label><span className="mu-t">{t("Countries / regions")}</span><input value={zoneEdit?.countries ?? ""} onChange={(e) => setZoneEdit({ ...zoneEdit!, countries: e.target.value })} placeholder={t("Bangladesh")} /></label>
        {zerr && <p className="er-t">{zerr}</p>}
      </Modal>
      {rateEdit && <RateForm initial={rateEdit.rate} currency={cur} onClose={() => setRateEdit(null)} onSave={saveRate} />}
      <Confirm open={!!confirmZone} title={t(`Delete zone "${confirmZone?.name}"?`)} message={t("Its rates are removed too.")}
        onClose={() => setConfirmZone(null)} onConfirm={() => void deleteZone()} />
      <Confirm open={!!confirmRate} title={t(`Delete rate "${confirmRate?.rate.name}"?`)} message={t("This cannot be undone.")}
        onClose={() => setConfirmRate(null)} onConfirm={deleteRate} />
    </>
  );
}

function ProfilesTab({ profiles, products, settings, reload }: {
  profiles: DeliveryProfile[]; products: Product[]; settings: Settings; reload(): void;
}) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const [edit, setEdit] = useState<DeliveryProfile | null>(null);
  const [confirmDel, setConfirmDel] = useState<DeliveryProfile | null>(null);
  const save = async (p: DeliveryProfile) => { await api.shippingProfiles.save(storeId, p); setEdit(null); toast(t("Profile saved")); reload(); };
  if (edit) return <ProfileForm initial={edit} products={products} zones={settings.zones} onSave={(p) => void save(p)} onBack={() => setEdit(null)} />;
  return (
    <>
      <div style={{ marginBottom: 12 }}><button className="btn" onClick={() => setEdit({ id: crypto.randomUUID(), name: "", productIds: [], zoneIds: [] })}>{t("Create profile")}</button></div>
      <IndexTable items={profiles} id={(p) => p.id} onRow={(p) => setEdit(p)}
        search={(p) => p.name} searchPlaceholder={t("Search profiles")}
        empty={<EmptyState title={t("No delivery profiles")} text={t("Group products that ship with special rates or to limited zones.")} />}
        cols={[
          { h: t("Name"), cell: (p) => <b>{p.name}</b> },
          { h: t("Products"), right: true, cell: (p) => `${p.productIds.length}` },
          { h: t("Zones"), cell: (p) => <span className="mu-t">{p.zoneIds.map((z) => settings.zones.find((x) => x.id === z)?.name ?? "?").join(", ") || "—"}</span> },
          { h: "", right: true, cell: (p) => <span className="acts" style={{ justifyContent: "flex-end" }}>
            <button className="btn s" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }}>{t("Delete")}</button></span> },
        ]} />
      <Confirm open={!!confirmDel} title={t(`Delete profile "${confirmDel?.name}"?`)} message={t("Its products fall back to general rates.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return api.shippingProfiles.remove(storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Profile deleted")); reload(); }); }} />
    </>
  );
}

export default function Shipping() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([api.settings.get(storeId), api.shippingProfiles.list(storeId), api.products.list(storeId)]), [storeId]);
  const [tab, setTab] = useState<"rates" | "profiles">("rates");
  if (!data) return <Loading />;
  const [settings, profiles, products] = data;
  const saveSettings = async (s: Settings) => { await api.settings.save(storeId, s); reload(); };
  return (
    <Page title={t("Shipping and delivery")}
      actions={<div className="seg" role="tablist" aria-label={t("Shipping sections")}>
        {([ "rates", "profiles"] as const).map((t2) => (
          <button key={t2} role="tab" aria-selected={tab === t2} className={"btn s" + (tab === t2 ? " on" : "")} onClick={() => setTab(t2)}>
            {t2 === "rates" ? t("Shipping rates") : t(`Delivery profiles (${profiles.length})`)}</button>))}
      </div>}>
      {tab === "rates" && <RatesTab settings={settings} onSave={(s) => void saveSettings(s)} />}
      {tab === "profiles" && <ProfilesTab profiles={profiles} products={products} settings={settings} reload={reload} />}
    </Page>
  );
}

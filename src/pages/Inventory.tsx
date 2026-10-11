import { useState } from "react";
import { api } from "../api";
import { Confirm, EmptyState, IndexTable, Modal, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Location, Product, StockLevel, Variant } from "../types";

type Row = { p: Product; v: Variant };
const LOW = 5;

function StockTab({ products, locations, levels, reload }: {
  products: Product[]; locations: Location[]; levels: StockLevel[]; reload(): void;
}) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const activeLocs = locations.filter((l) => l.active);
  const locIds = new Set(locations.map((l) => l.id));
  const qtyOf = (variantId: string, locationId: string) => levels.find((x) => x.variantId === variantId && x.locationId === locationId)?.qty ?? 0;
  const totalOf = (variantId: string) => levels.filter((x) => x.variantId === variantId && locIds.has(x.locationId)).reduce((a, x) => a + x.qty, 0);
  const setStock = async (r: Row, locationId: string, qty: number) => {
    if (!Number.isFinite(qty) || qty < 0) return toast(t("Stock must be 0 or more"), true);
    try {
      await api.inventory.set(storeId, r.v.id, locationId, qty);
      const total = levels.filter((x) => x.variantId === r.v.id && x.locationId !== locationId && locIds.has(x.locationId)).reduce((a, x) => a + x.qty, 0) + qty;
      await api.products.save(storeId, { ...r.p, variants: r.p.variants.map((v) => (v.id === r.v.id ? { ...v, stock: total } : v)) });
      toast(t("Inventory updated")); reload();
    } catch (e) { toast((e as Error).message, true); }
  };
  const rows: Row[] = products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  return (
    <IndexTable items={rows} id={(r) => r.v.id} pageSize={25}
      tabs={[{ id: "all", label: t("All") }, { id: "low", label: t("Low stock") }, { id: "out", label: t("Out of stock") }]}
      filter={(r, t) => { const tot = totalOf(r.v.id); return t === "all" || (t === "out" && tot === 0) || (t === "low" && tot > 0 && tot <= LOW); }}
      search={(r) => `${r.p.title} ${r.v.name} ${r.v.sku}`} searchPlaceholder={t("Search inventory")}
      empty={<EmptyState title={t("No inventory")} text={t("Add products to start tracking stock.")} />}
      cols={[
        { h: t("Product"), cell: (r) => <b>{r.p.title}</b> },
        { h: t("Variant"), cell: (r) => r.v.name },
        { h: t("SKU"), cell: (r) => <span className="mu-t">{r.v.sku || t("No SKU")}</span> },
        ...activeLocs.map((l) => ({
          h: l.name + (l.isDefault ? " ★" : ""),
          right: true as const,
          cell: (r: Row) => {
            const q = qtyOf(r.v.id, l.id);
            return <input type="number" min={0} aria-label={t(`${l.name} stock for ${r.p.title} ${r.v.name}`)} key={r.v.id + l.id + ":" + q} defaultValue={q} style={{ width: 90 }}
              onBlur={(e) => { if (+e.target.value !== q) void setStock(r, l.id, +e.target.value); }} />;
          },
        })),
        { h: t("Total"), right: true, cell: (r) => <b>{totalOf(r.v.id)}</b> },
      ]} />
  );
}

function TransferModal({ products, locations, levels, onClose, onDone }: {
  products: Product[]; locations: Location[]; levels: StockLevel[]; onClose(): void; onDone(): void;
}) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const active = locations.filter((l) => l.active);
  const [fromId, setFromId] = useState(active[0]?.id ?? "");
  const [toId, setToId] = useState(active[1]?.id ?? "");
  const [items, setItems] = useState<{ variantId: string; qty: number }[]>([]);
  const [vid, setVid] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const vmap = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, { p, v }] as const)));
  const avail = (variantId: string) => levels.find((x) => x.variantId === variantId && x.locationId === fromId)?.qty ?? 0;
  const addItem = () => {
    if (!vid || items.some((i) => i.variantId === vid)) return;
    setItems([...items, { variantId: vid, qty: 1 }]); setVid("");
  };
  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      await api.inventory.transfer(storeId, fromId, toId, items.filter((i) => i.qty > 0));
      toast(t("Transfer completed")); onDone();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={t("Create transfer")} wide
      footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" disabled={busy || !fromId || !toId || !items.length} onClick={() => void submit()}>{busy ? t("Moving…") : t("Complete transfer")}</button></>}>
      <div className="row">
        <label style={{ flex: 1 }}>{t("From")}<select value={fromId} onChange={(e) => setFromId(e.target.value)}>{active.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <label style={{ flex: 1 }}>{t("To")}<select value={toId} onChange={(e) => setToId(e.target.value)}>{active.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      </div>
      {items.map((it, i) => {
        const e = vmap.get(it.variantId);
        return (
          <div className="between" key={it.variantId} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
            <span>{e ? `${e.p.title} — ${e.v.name}` : it.variantId} <span className="mu-t">({avail(it.variantId)} {t("available")})</span></span>
            <span className="row" style={{ alignItems: "center" }}>
              <input type="number" min={1} max={avail(it.variantId)} aria-label={t("Quantity")} value={it.qty} style={{ width: 80 }}
                onChange={(e2) => setItems(items.map((x, j) => (j === i ? { ...x, qty: +e2.target.value } : x)))} />
              <button className="btn s" onClick={() => setItems(items.filter((_, j) => j !== i))}>{t("Remove")}</button>
            </span>
          </div>);
      })}
      <div className="row" style={{ marginTop: 10 }}>
        <select aria-label={t("Variant to transfer")} value={vid} onChange={(e) => setVid(e.target.value)} style={{ flex: 1 }}>
          <option value="">{t("Select a variant…")}</option>
          {products.flatMap((p) => p.variants.filter((v) => !items.some((i) => i.variantId === v.id)).map((v) => (
            <option key={v.id} value={v.id}>{p.title} — {v.name} ({avail(v.id)} {t("at source")})</option>)))}
        </select>
        <button className="btn s" disabled={!vid} onClick={addItem}>{t("Add item")}</button>
      </div>
      {err && <p className="er-t">{err}</p>}
    </Modal>
  );
}

function TransfersTab({ products, locations, levels, reload }: {
  products: Product[]; locations: Location[]; levels: StockLevel[]; reload(): void;
}) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data: transfers } = useLoad(() => api.inventory.transfers(storeId), [storeId]);
  const [open, setOpen] = useState(false);
  const name = (id: string) => locations.find((l) => l.id === id)?.name ?? "—";
  const vmap = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, `${p.title} — ${v.name}`] as const)));
  if (!transfers) return <Loading />;
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <button className="btn" disabled={locations.filter((l) => l.active).length < 2} onClick={() => setOpen(true)}>{t("Create transfer")}</button>
        {locations.filter((l) => l.active).length < 2 && <p className="hint">{t("You need at least two active locations to transfer stock.")}</p>}
      </div>
      <IndexTable items={transfers} id={(t) => t.id} pageSize={15}
        empty={<EmptyState title={t("No transfers yet")} text={t("Move stock between your locations.")} />}
        cols={[
          { h: t("Date"), cell: (t) => new Date(t.createdAt).toLocaleDateString() },
          { h: t("From"), cell: (t) => name(t.fromId) },
          { h: t("To"), cell: (t) => name(t.toId) },
          { h: t("Items"), cell: (t) => t.items.map((i) => `${i.qty} × ${vmap.get(i.variantId) ?? i.variantId}`).join(", ") },
          { h: t("Status"), cell: (t) => <Badge t={t.status} /> },
        ]} />
      {open && <TransferModal products={products} locations={locations} levels={levels} onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />}
    </>
  );
}

function LocationsTab({ locations, reload }: { locations: Location[]; reload(): void }) {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Location | null>(null);
  const [confirmDel, setConfirmDel] = useState<Location | null>(null);
  const save = async (l: Location) => {
    for (const x of locations.filter((x) => x.isDefault && x.id !== l.id)) await api.locations.save(storeId, { ...x, isDefault: false });
    await api.locations.save(storeId, l);
    setOpen(false); setEdit(null); toast(t("Location saved")); reload();
  };
  const setDefault = async (l: Location) => {
    for (const x of locations.filter((x) => x.isDefault && x.id !== l.id)) await api.locations.save(storeId, { ...x, isDefault: false });
    await api.locations.save(storeId, { ...l, isDefault: true });
    toast(t(`"${l.name}" is now the default location`)); reload();
  };
  return (
    <>
      <div style={{ marginBottom: 12 }}><button className="btn" onClick={() => { setEdit({ id: crypto.randomUUID(), name: "", active: true }); setOpen(true); }}>{t("Add location")}</button></div>
      <IndexTable items={locations} id={(l) => l.id}
        empty={<EmptyState title={t("No locations")} text={t("Add your warehouses and stores.")} />}
        cols={[
          { h: t("Name"), cell: (l) => <b>{l.name}</b> },
          { h: t("Address"), cell: (l) => <span className="mu-t">{l.address || "—"}</span> },
          { h: t("Status"), cell: (l) => <Badge t={l.active ? t("Active") : t("Suspended")} /> },
          { h: t("Default"), cell: (l) => (l.isDefault ? <Badge t="Approved" /> : <button className="btn s" onClick={() => void setDefault(l)}>{t("Set as default")}</button>) },
          { h: "", right: true, cell: (l) => (<span className="row">
            <button className="btn s" onClick={() => { setEdit(l); setOpen(true); }}>{t("Edit")}</button>
            <button className="btn s" disabled={!!l.isDefault} title={l.isDefault ? t("The default location cannot be deleted") : ""} onClick={() => setConfirmDel(l)}>{t("Delete")}</button>
          </span>) },
        ]} />
      {open && edit && (
        <Modal open onClose={() => { setOpen(false); setEdit(null); }} title={locations.some((x) => x.id === edit.id) ? t("Edit location") : t("Add location")}
          footer={<><button className="btn s" onClick={() => { setOpen(false); setEdit(null); }}>{t("Cancel")}</button>
            <button className="btn" disabled={!edit.name.trim()} onClick={() => void save({ ...edit, name: edit.name.trim() })}>{t("Save")}</button></>}>
          <label><b>{t("Name")}</b><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder={t("e.g. Gulshan store")} /></label>
          <label><b>{t("Address")}</b><input value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} placeholder={t("Street, city")} /></label>
          <label className="check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />{t("Active — stock can be stored here")}</label>
          <label className="check"><input type="checkbox" checked={!!edit.isDefault} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} />{t("Default location")}</label>
        </Modal>
      )}
      <Confirm open={!!confirmDel} title={t(`Delete "${confirmDel?.name}"?`)} message={t("Its stock records will no longer be shown.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return api.locations.remove(storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Location deleted")); reload(); }); }} />
    </>
  );
}

export default function Inventory() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(async () => {
    const [products, locations, levels] = await Promise.all([api.products.list(storeId), api.locations.list(storeId), api.inventory.levels(storeId)]);
    return { products, locations, levels };
  }, [storeId]);
  const [tab, setTab] = useState<"stock" | "transfers" | "locations">("stock");
  if (!data) return <Loading />;
  return (
    <Page title={t("Inventory")}
      actions={<div className="seg" role="tablist" aria-label={t("Inventory sections")}>
        {(["stock", "transfers", "locations"] as const).map((t2) => (
          <button key={t2} role="tab" aria-selected={tab === t2} className={"btn s" + (tab === t2 ? " on" : "")} onClick={() => setTab(t2)}>
            {t2 === "stock" ? t("Stock") : t2 === "transfers" ? t("Transfers") : t("Locations")}</button>))}
      </div>}>
      {tab === "stock" && <StockTab products={data.products} locations={data.locations} levels={data.levels} reload={reload} />}
      {tab === "transfers" && <TransfersTab products={data.products} locations={data.locations} levels={data.levels} reload={reload} />}
      {tab === "locations" && <LocationsTab locations={data.locations} reload={reload} />}
    </Page>
  );
}

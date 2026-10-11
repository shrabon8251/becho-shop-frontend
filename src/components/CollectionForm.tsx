import { useState } from "react";
import { api } from "../api";
import { collectionProducts } from "../lib/collections";
import { PageHeader } from "./polaris";
import { Card } from "./ui";
import type { Collection, CollectionCondition, Product } from "../types";
import { useT } from "../lib/fx";

const FIELDS = [
  { id: "title", label: "Product title" },
  { id: "type", label: "Product type" },
  { id: "vendor", label: "Vendor" },
  { id: "tag", label: "Product tag" },
  { id: "price", label: "Price" },
] as const;
type FieldId = (typeof FIELDS)[number]["id"];
const TEXT_OPS = [{ id: "contains", label: "contains" }, { id: "equals", label: "is equal to" }];
const PRICE_OPS = [{ id: "gte", label: "is greater than" }, { id: "lte", label: "is less than" }, { id: "equals", label: "is equal to" }];
const opsFor = (f: FieldId) => (f === "price" ? PRICE_OPS : TEXT_OPS);
const condLabel = (c: CollectionCondition, t: (k: string) => string) =>
  `${FIELDS_T(t).find((f) => f.id === c.field)?.label} ${(c.field === "price" ? PRICE_OPS_T(t) : TEXT_OPS_T(t)).find((o) => o.id === c.op)?.label} "${c.value}"`;
const FIELDS_T = (t: (k: string) => string) => [
  { id: "title", label: t("Product title") },
  { id: "type", label: t("Product type") },
  { id: "vendor", label: t("Vendor") },
  { id: "tag", label: t("Product tag") },
  { id: "price", label: t("Price") },
] as const;
const TEXT_OPS_T = (t: (k: string) => string) => [{ id: "contains", label: t("contains") }, { id: "equals", label: t("is equal to") }];
const PRICE_OPS_T = (t: (k: string) => string) => [{ id: "gte", label: t("is greater than") }, { id: "lte", label: t("is less than") }, { id: "equals", label: t("is equal to") }];

export default function CollectionForm({ initial, products, storeId, onSave, onBack }: {
  initial: Collection; products: Product[]; storeId: string; onSave(c: Collection): void; onBack(): void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<Collection>(initial);
  const [q, setQ] = useState("");
  const [imgErr, setImgErr] = useState("");
  const kind = draft.kind ?? "manual";

  const setKind = (k: "manual" | "smart") => setDraft((d) => {
    if (k === "manual" && d.kind !== "manual")
      return { ...d, kind: k, productIds: collectionProducts({ ...d, kind: "smart" }, products).map((p) => p.id) };
    return { ...d, kind: k };
  });
  const conds = draft.conditions ?? [];
  const setCond = (i: number, patch: Partial<CollectionCondition>) =>
    setDraft((d) => ({ ...d, conditions: (d.conditions ?? []).map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const preview = kind === "smart" ? collectionProducts(draft, products) : [];

  const ids = draft.productIds ?? [];
  const chosen = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const results = products.filter((p) => !ids.includes(p.id) && p.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    const next = [...(d.productIds ?? [])]; const j = i + dir;
    if (j < 0 || j >= next.length) return d;
    [next[i], next[j]] = [next[j], next[i]];
    return { ...d, productIds: next };
  });

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
      if (file.size > 2_000_000) throw new Error("Image must be under 2 MB");
      const url = await api.uploads.image(storeId, file);
      setDraft((d) => ({ ...d, image: url }));
      setImgErr("");
    } catch (err) { setImgErr((err as Error).message); }
  };

  return (
    <>
      <PageHeader title={draft.name || t("New collection")} back={onBack}
        actions={<button className="btn" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>{t("Save")}</button>} />
      <div className="two">
        <div>
          <Card>
            <label><b>{t("Title")}</b><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t("e.g. Summer sale")} /></label>
            <b>{t("Image")}</b>
            {draft.image && <div className="thumb"><img src={draft.image} alt="" /></div>}
            <div className="row" style={{ alignItems: "center", marginTop: 8 }}>
              <input type="file" accept="image/*" onChange={(e) => void upload(e.target.files)} style={{ margin: 0 }} />
              {draft.image && <button className="btn s" onClick={() => setDraft({ ...draft, image: undefined })}>{t("Remove")}</button>}
            </div>
            {imgErr && <p className="er-t">{imgErr}</p>}
          </Card>
          <Card><b>{t("Collection type")}</b>
            <label className="check"><input type="radio" name="ckind" checked={kind === "manual"} onChange={() => setKind("manual")} />
              <span><b>{t("Manual")}</b><br /><span className="mu-t">{t("Hand-pick the products in this collection.")}</span></span></label>
            <label className="check"><input type="radio" name="ckind" checked={kind === "smart"} onChange={() => setKind("smart")} />
              <span><b>{t("Automated")}</b><br /><span className="mu-t">{t("Products are added automatically when they match your conditions.")}</span></span></label>
          </Card>
          {kind === "smart" ? (
            <Card>
              <div className="between"><b>{t("Conditions")}</b>
                <label className="mu-t" style={{ margin: 0 }}>{t("Products must match")}
                  <select className="mini-select" value={draft.matchAll === false ? "any" : "all"} onChange={(e) => setDraft({ ...draft, matchAll: e.target.value === "all" })}>
                    <option value="all">{t("all conditions")}</option><option value="any">{t("any condition")}</option>
                  </select></label></div>
              {conds.map((c, i) => (
                <div className="row" key={i} style={{ alignItems: "center" }}>
                  <select aria-label={t("Condition field")} value={c.field} style={{ flex: 1.2 }} onChange={(e) => { const f = e.target.value as FieldId; setCond(i, { field: f, op: opsFor(f)[0].id as CollectionCondition["op"] }); }}>
                    {FIELDS_T(t).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
                  <select aria-label={t("Condition operator")} value={c.op} style={{ flex: 1.2 }} onChange={(e) => setCond(i, { op: e.target.value as CollectionCondition["op"] })}>
                    {(c.field === "price" ? PRICE_OPS_T(t) : TEXT_OPS_T(t)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
                  <input aria-label={t("Condition value")} placeholder={t("Value")} value={c.value} style={{ flex: 1 }} onChange={(e) => setCond(i, { value: e.target.value })} />
                  <button className="btn s" aria-label={t("Remove condition")} onClick={() => setDraft({ ...draft, conditions: conds.filter((_, j) => j !== i) })}>✕</button>
                </div>))}
              <button className="btn s" style={{ marginTop: 8 }} onClick={() => setDraft({ ...draft, conditions: [...conds, { field: "title", op: "contains", value: "" }] })}>{t("Add condition")}</button>
              <div style={{ marginTop: 12 }}>
                <b>{preview.length} {t("products match")}</b>
                {conds.length > 0 && <p className="mu-t" style={{ margin: "4px 0" }}>{conds.filter((c) => c.value.trim()).map((c) => condLabel(c, t)).join(draft.matchAll === false ? "  OR  " : "  AND  ") || t("Add values to your conditions to preview.")}</p>}
                <div className="row" style={{ flexWrap: "wrap" }}>{preview.slice(0, 6).map((p) => (
                  <span key={p.id} className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title}</span>))}</div>
              </div>
            </Card>
          ) : (
            <Card>
              <b>{t("Products")} ({chosen.length})</b>
              <p className="hint">{t("Use ↑ ↓ to change the display order.")}</p>
              {chosen.map((p, i) => (
                <div className="between" key={p.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
                  <span className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title}</span>
                  <span className="row" style={{ alignItems: "center" }}>
                    <button className="btn s ico" aria-label={t("Move up")} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button className="btn s ico" aria-label={t("Move down")} disabled={i === chosen.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button className="btn s" onClick={() => setDraft({ ...draft, productIds: ids.filter((x) => x !== p.id) })}>{t("Remove")}</button>
                  </span>
                </div>))}
              <label style={{ marginTop: 12 }}><span className="mu-t">{t("Add products")}</span>
                <input type="search" placeholder={t("Search products…")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
              {q.trim() && results.map((p) => (
                <div className="between" key={p.id} style={{ padding: "4px 0" }}>
                  <span className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title}</span>
                  <button className="btn s" onClick={() => setDraft({ ...draft, productIds: [...ids, p.id] })}>{t("Add")}</button>
                </div>))}
              {q.trim() && results.length === 0 && <p className="mu-t">{t("No matching products.")}</p>}
            </Card>
          )}
        </div>
        <div>
          {kind === "smart" && (
            <Card><label><b>{t("Sort order")}</b>
              <select value={draft.sort ?? "manual"} onChange={(e) => setDraft({ ...draft, sort: e.target.value as Collection["sort"] })}>
                <option value="manual">{t("Featured")}</option><option value="newest">{t("Newest")}</option>
                <option value="price-asc">{t("Price: low to high")}</option><option value="price-desc">{t("Price: high to low")}</option>
                <option value="alpha">{t("Alphabetically, A–Z")}</option>
              </select></label></Card>
          )}
          <Card><b>{t("Summary")}</b>
            <p className="mu-t" style={{ margin: "4px 0" }}>{t("Type")}: {kind === "smart" ? t("Automated") : t("Manual")}</p>
            <p className="mu-t" style={{ margin: "4px 0" }}>{t("Products")}: {kind === "smart" ? preview.length : chosen.length}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

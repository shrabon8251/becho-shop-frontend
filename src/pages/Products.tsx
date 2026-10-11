import { useState } from "react";
import { api } from "../api";
import { ProductTools } from "../components/ProductTools";
import ProductForm from "../components/ProductForm";
import { Confirm, EmptyState, IndexTable, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { money } from "../lib/money";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Product } from "../types";
export default function Products() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => api.products.list(storeId), [storeId]);
  const { data: cols } = useLoad(() => api.collections.list(storeId), [storeId]);
  const [edit, setEdit] = useState<Product | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ ids: string[]; done: () => void } | null>(null);
  const [isNew, setIsNew] = useState(false);
  if (!data || !cols) return <Loading />;
  const bulk = async (ids: string[], done: () => void, fn: (p: Product) => Promise<unknown>) => { await Promise.all(data.filter((p) => ids.includes(p.id)).map(fn)); done(); toast(t(`${ids.length} product(s) updated`)); reload(); };
  // New products go through POST create (backend assigns the numeric id);
  // existing ones through PUT save. Never PUT a client-generated UUID id —
  // the real backend rejects it with 400 (@PathVariable Long id).
  const save = async (p: Product) => { await (isNew ? api.products.create(storeId, p) : api.products.save(storeId, p)); setEdit(null); setIsNew(false); toast(t("Product saved")); reload(); };
  if (edit) return <ProductForm initial={edit} collections={cols} storeId={storeId} onSave={(p) => void save(p)} onBack={() => { setEdit(null); setIsNew(false); }} />;
  const add = () => { setIsNew(true); setEdit({ id: crypto.randomUUID(), title: "New product", status: "Draft", collectionId: "", images: [], variants: [{ id: crypto.randomUUID(), name: "Default", price: 0, sku: "", stock: 0 }] }); };
  const addBtn = <button className="btn" onClick={add}>{t("Add product")}</button>;
  return (
    <Page title={t("Products")} actions={addBtn}>
      <ProductTools products={data} storeId={storeId} reload={reload} />
      <IndexTable items={data} id={(p) => p.id} onRow={(p) => setEdit(p)}
        tabs={[{ id: "all", label: t("All") }, { id: "Active", label: t("Active") }, { id: "Draft", label: t("Draft") }]}
        filter={(p, t) => t === "all" || p.status === t} search={(p) => p.title} searchPlaceholder={t("Search products")}
        empty={<EmptyState art="🏷️" title={t("Add your first product")} text={t("Products you add will show up here.")} action={addBtn} />}
        bulk={(ids, done) => (<>
          <button className="btn s" onClick={() => void bulk(ids, done, (p) => api.products.save(storeId, { ...p, status: "Active" }))}>{t("Set Active")}</button>
          <button className="btn s" onClick={() => void bulk(ids, done, (p) => api.products.save(storeId, { ...p, status: "Draft" }))}>{t("Set Draft")}</button>
          <button className="btn s" onClick={() => setConfirmDel({ ids, done })}>{t("Delete")}</button></>)}
        cols={[
          { h: t("Product"), cell: (p) => <div className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title}</div> },
          { h: t("Status"), cell: (p) => <Badge t={p.status} /> },
          { h: t("Inventory"), cell: (p) => `${p.variants.reduce((a, v) => a + v.stock, 0)} ${t("in stock")}` },
          { h: t("Variants"), cell: (p) => `${p.variants.length}` },
          { h: t("Price"), right: true, cell: (p) => `${t("from")} ${money(Math.min(...p.variants.map((v) => v.price)))}` },
        ]} />
      <Confirm open={!!confirmDel} title={t(`Delete ${confirmDel?.ids.length} product(s)?`)} message={t("This cannot be undone.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return bulk(confirmDel.ids, confirmDel.done, (p) => api.products.remove(storeId, p.id)).then(() => setConfirmDel(null)); }} />
    </Page>
  );
}

import { useState } from "react";
import { api } from "../api";
import CollectionForm from "../components/CollectionForm";
import { collectionCount } from "../lib/collections";
import { Confirm, EmptyState, IndexTable, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Collection } from "../types";
export default function Collections() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data: cols, reload } = useLoad(() => api.collections.list(storeId), [storeId]);
    const { data: products, reload: reloadProducts } = useLoad(() => api.products.list(storeId), [storeId]);
    const [edit, setEdit] = useState<Collection | null>(null);
    // BUG-33 fix: the product picker searched a list loaded when the page mounted —
    // products created afterwards were invisible ("No matching products"). Reload
    // whenever the editor opens so the picker always searches fresh data.
    const openEditor = (c: Collection | null) => { reloadProducts(); setEdit(c); };
    const [confirmDel, setConfirmDel] = useState<Collection | null>(null);
    if (!cols || !products) return <Loading />;
    const save = async (c: Collection) => { await api.collections.save(storeId, c); setEdit(null); toast(t("Collection saved")); reload(); };
    if (edit) return <CollectionForm initial={edit} products={products} storeId={storeId} onSave={(c) => void save(c)} onBack={() => setEdit(null)} />;
    const addBtn = <button className="btn" onClick={() => openEditor({ id: crypto.randomUUID(), name: "New collection", kind: "manual" })}>{t("Create collection")}</button>;
    return (
        <Page title={t("Collections")} actions={addBtn}>
            <IndexTable items={cols} id={(c) => c.id} onRow={(c) => openEditor(c)} search={(c) => c.name} searchPlaceholder={t("Search collections")}
                        empty={<EmptyState title={t("Group your products")} text={t("Manual collections are hand-picked; automated collections fill themselves by conditions.")} action={addBtn} />}
                        cols={[
                            { h: t("Title"), cell: (c) => <div className="prod">{c.image ? <img className="tn" src={c.image} alt="" /> : <span className="tn ph0" />}<b>{c.name}</b></div> },
                            { h: t("Type"), cell: (c) => <Badge t={c.kind === "smart" ? t("Automated") : t("Manual")} /> },
                            { h: t("Products"), cell: (c) => `${collectionCount(c, products)}` },
                            { h: "", right: true, cell: (c) => <button className="btn s" onClick={() => setConfirmDel(c)}>{t("Delete")}</button> },
                        ]} />
            <Confirm open={!!confirmDel} title={t(`Delete "${confirmDel?.name}"?`)} message={t("This cannot be undone. Products stay in your catalog.")}
                     onClose={() => setConfirmDel(null)}
                     onConfirm={() => { if (confirmDel) return api.collections.remove(storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Collection deleted")); reload(); }); }} />
        </Page>
    );
}

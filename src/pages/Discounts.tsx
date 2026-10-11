import { useState } from "react";
import { api } from "../api";
import DiscountForm from "../components/DiscountForm";
import { describeDiscount, discountStatus } from "../lib/discounts";
import { Confirm, EmptyState, IndexTable, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Discount } from "../types";

export default function Discounts() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([api.discounts.list(storeId), api.settings.get(storeId)]), [storeId]);
  const [edit, setEdit] = useState<Discount | null>(null);
  const [confirmDel, setConfirmDel] = useState<Discount | null>(null);
  if (!data) return <Loading />;
  const [discounts, settings] = data;
  const blank: Discount = { id: crypto.randomUUID(), code: "", type: "%", value: 10, active: true, used: 0 };
  const save = async (d: Discount) => { await api.discounts.save(storeId, d); setEdit(null); toast(t("Discount saved")); reload(); };
  const schedule = (d: Discount) => {
    if (!d.startsAt && !d.endsAt) return <span className="mu-t">{t("Always")}</span>;
    const f = (t?: number) => (t ? new Date(t).toLocaleDateString() : "…");
    return <span className="mu-t">{f(d.startsAt)} → {f(d.endsAt)}</span>;
  };
  if (edit) return <DiscountForm initial={edit} existing={discounts} currency={settings.currency} onSave={(d) => void save(d)} onBack={() => setEdit(null)} />;
  return (
    <Page title={t("Discounts")} actions={<button className="btn" onClick={() => setEdit(blank)}>{t("Create discount")}</button>}>
      <IndexTable items={[...discounts].reverse()} id={(d) => d.id} onRow={(d) => setEdit(d)}
        tabs={[{ id: "all", label: t("All") }, { id: "code", label: t("Codes") }, { id: "auto", label: t("Automatic") }, { id: "off", label: t("Inactive") }]}
        filter={(d, t) => t === "all" || (t === "code" && (d.kind ?? "code") === "code") || (t === "auto" && d.kind === "automatic") || (t === "off" && !d.active)}
        search={(d) => `${d.code} ${d.title ?? ""}`} searchPlaceholder={t("Search discounts")}
        empty={<EmptyState title={t("Discounts")} text={t("Codes customers type at checkout, and automatic discounts that just apply.")} />}
        cols={[
          { h: t("Name"), cell: (d) => <b>{(d.kind ?? "code") === "code" ? d.code : d.title || d.code}</b> },
          { h: t("Method"), cell: (d) => <Badge t={(d.kind ?? "code") === "code" ? t("Code") : t("Automatic")} /> },
          { h: t("Discount"), cell: (d) => describeDiscount(d) },
          { h: t("Status"), cell: (d) => <Badge t={discountStatus(d)} /> },
          { h: t("Used"), right: true, cell: (d) => d.usageLimit ? `${d.used}/${d.usageLimit}` : `${d.used}` },
          { h: t("Schedule"), cell: schedule },
          { h: "", right: true, cell: (d) => (
            <span className="acts" style={{ justifyContent: "flex-end" }}>
              <button className="btn s" onClick={(e) => { e.stopPropagation(); void (async () => { await api.discounts.save(storeId, { ...d, active: !d.active }); toast(d.active ? t("Discount disabled") : t("Discount enabled")); reload(); })(); }}>{d.active ? t("Disable") : t("Enable")}</button>
              <button className="btn s" onClick={(e) => { e.stopPropagation(); setConfirmDel(d); }}>{t("Delete")}</button>
            </span>) },
        ]} />
      <Confirm open={!!confirmDel} title={t(`Delete ${confirmDel?.code}?`)} message={t("Orders already placed keep their discount.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return api.discounts.remove(storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Discount deleted")); reload(); }); }} />
    </Page>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import SegmentForm from "../components/SegmentForm";
import { CustomerTools } from "../components/CustomerTools";
import { segmentMatches, type CustomerStats } from "../lib/segments";
import { Confirm, EmptyState, IndexTable, Modal, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { money } from "../lib/money";
import { orderTotal, priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { CustomerSegment } from "../types";

export default function Customers() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const nav = useNavigate();
  const { data, reload } = useLoad(() => Promise.all([
    api.customers.list(storeId), api.orders.list(storeId), api.products.list(storeId), api.segments.list(storeId), api.settings.get(storeId),
  ]), [storeId]);
  const [tab, setTab] = useState<"customers" | "segments">("customers");
  const [open, setOpen] = useState(false);
  const [editSeg, setEditSeg] = useState<CustomerSegment | null>(null);
  const [confirmDel, setConfirmDel] = useState<CustomerSegment | null>(null);
  const [f, setF] = useState({ name: "", email: "" });
  const [err, setErr] = useState("");
  const [sp, setSp] = useSearchParams();
  if (!data) return <Loading />;
  const [customers, orders, products, segments, settings] = data;
  const prices = priceMap(products);
  const statsOf = (id: string): CustomerStats => {
    const os = orders.filter((o) => o.customerId === id);
    return { ordersCount: os.length, totalSpent: os.filter((o) => o.pay === "Paid").reduce((a, o) => a + orderTotal(o, prices), 0) };
  };
  const close = () => { setOpen(false); setErr(""); setF({ name: "", email: "" }); };
  const add = async () => {
    if (!f.name.trim() || !f.email.includes("@")) return setErr(t("Enter a name and a valid email"));
    if (customers.some((c) => c.email.toLowerCase() === f.email.trim().toLowerCase())) return setErr(t("Email already exists"));
    await api.customers.save(storeId, { id: crypto.randomUUID(), name: f.name.trim(), email: f.email.trim(), addresses: [] });
    close(); toast(t("Customer added")); reload();
  };
  const saveSeg = async (s: CustomerSegment) => { await api.segments.save(storeId, s); setEditSeg(null); toast(t("Segment saved")); reload(); };
  const segFilter = segments.find((s) => s.id === sp.get("segment")) ?? null;
  const shown = segFilter ? customers.filter((c) => segmentMatches(c, statsOf(c.id), segFilter)) : customers;

  if (editSeg) return <SegmentForm initial={editSeg} customers={customers} statsOf={statsOf} currency={settings.currency} onSave={(s) => void saveSeg(s)} onBack={() => setEditSeg(null)} />;

  return (
    <Page title={t("Customers")}
      actions={<div className="seg" role="tablist" aria-label={t("Customer sections")}>
        {(["customers", "segments"] as const).map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} className={"btn s" + (tab === tb ? " on" : "")} onClick={() => setTab(tb)}>
            {tb === "customers" ? `${t("Customers")} (${customers.length})` : `${t("Segments")} (${segments.length})`}</button>))}
      </div>}>
      {tab === "customers" && (
        <>
          <div className="between" style={{ marginBottom: 4 }}>
            <span />
            <button className="btn" onClick={() => setOpen(true)}>{t("Add customer")}</button>
          </div>
          <CustomerTools customers={shown} statsOf={statsOf} currency={settings.currency} storeId={storeId} reload={reload} />
          {segFilter && (
            <p className="mu-t">{t("Showing members of")} <b>{segFilter.name}</b> <button className="btn s" onClick={() => setSp({})}>{t("Clear")}</button></p>
          )}
          <IndexTable items={shown} id={(c) => c.id} onRow={(c) => nav(`/admin/customers/${c.id}`)}
            search={(c) => `${c.name} ${c.email} ${(c.tags ?? []).join(" ")}`} searchPlaceholder={t("Search customers")}
            cols={[
              { h: t("Customer"), cell: (c) => <b>{c.name}</b> },
              { h: t("Email"), cell: (c) => <span className="mu-t">{c.email}</span> },
              { h: t("Tags"), cell: (c) => (c.tags ?? []).map((tg) => <Badge key={tg} t={tg} />) },
              { h: t("Orders"), cell: (c) => `${statsOf(c.id).ordersCount} ${t("orders")}` },
              { h: t("Total spent"), right: true, cell: (c) => money(statsOf(c.id).totalSpent) },
            ]} />
        </>
      )}
      {tab === "segments" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => setEditSeg({ id: crypto.randomUUID(), name: "", conditions: [] })}>{t("Create segment")}</button>
          </div>
          <IndexTable items={segments} id={(s) => s.id} onRow={(s) => setEditSeg(s)}
            search={(s) => s.name} searchPlaceholder={t("Search segments")}
            empty={<EmptyState art="👥" title={t("No segments yet")} text={t("Group customers by spend, order count, or tags.")} />}
            cols={[
              { h: t("Name"), cell: (s) => <b>{s.name}</b> },
              { h: "Conditions", cell: (s) => <span className="mu-t">{s.conditions.length} {t("conditions")}</span> },
              { h: t("Members"), right: true, cell: (s) => `${customers.filter((c) => segmentMatches(c, statsOf(c.id), s)).length}` },
              { h: "", right: true, cell: (s) => <span className="acts" style={{ justifyContent: "flex-end" }}>
                <Link to={`/admin/customers?segment=${s.id}`} className="btn s" onClick={(e) => e.stopPropagation()}>{t("View")}</Link>
                <button className="btn s" onClick={(e) => { e.stopPropagation(); setConfirmDel(s); }}>{t("Delete")}</button>
              </span> },
            ]} />
        </>
      )}
      <Modal open={open} title="Add customer" onClose={close} footer={<><button className="btn s" onClick={close}>Cancel</button><button className="btn" onClick={add}>Save</button></>}>
        <label>{t("Name")}<input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>{t("Email")}<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        {err && <p className="er-t">{err}</p>}
      </Modal>
      <Confirm open={!!confirmDel} title={`${t("Delete segment")} "${confirmDel?.name}"?`} message={t("Customers are not affected.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return api.segments.remove(storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Segment deleted")); reload(); }); }} />
    </Page>
  );
}

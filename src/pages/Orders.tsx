import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import DraftOrderForm from "../components/DraftOrderForm";
import { Confirm, EmptyState, IndexTable, Page, toast, Loading } from "../components/polaris";
import { Badge } from "../components/ui";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { orderTotal, priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { Customer, Discount, DraftOrder, Order, OrderReturn, Product, Settings } from "../types";

type Ctx = { storeId: string; customers: Customer[]; products: Product[]; settings: Settings; discounts: Discount[]; reload(): void };

function OrdersTab({ orders, ctx }: { orders: Order[]; ctx: Ctx }) {
  const t = useT();
  const nav = useNavigate();
  const prices = priceMap(ctx.products);
  const name = (id: string) => ctx.customers.find((c) => c.id === id)?.name ?? (id === "walkin" ? t("Walk-in") : "-");
  const act = async (id: number, patch: Partial<Order>, text: string) => { await api.orders.update(ctx.storeId, id, patch, text); toast(t(text)); ctx.reload(); };
  return (
    <IndexTable items={[...orders].reverse()} id={(o) => String(o.id)} onRow={(o) => nav(`/admin/orders/${o.id}`)}
      tabs={[{ id: "all", label: t("All") }, { id: "unf", label: t("Unfulfilled") }, { id: "unp", label: t("Unpaid") }, { id: "ful", label: t("Fulfilled") }]}
      filter={(o, t) => t === "all" || (t === "unf" && o.ful === "Unfulfilled" && o.pay !== "Cancelled") || (t === "unp" && o.pay === "Pending") || (t === "ful" && o.ful === "Fulfilled")}
      search={(o) => `${o.id} ${name(o.customerId)}`} searchPlaceholder={t("Search orders")}
      cols={[
        { h: t("Order"), cell: (o) => <b>#{o.id}</b> },
        { h: t("Customer"), cell: (o) => name(o.customerId) },
        { h: t("Payment"), cell: (o) => <Badge t={o.pay} /> },
        { h: t("Fulfillment"), cell: (o) => <Badge t={o.ful} /> },
        { h: t("Total"), right: true, cell: (o) => money(orderTotal(o, prices)) },
        { h: "", right: true, cell: (o) => (
          <span className="acts" style={{ justifyContent: "flex-end" }}>
            {o.pay === "Pending" && <button className="btn s" onClick={() => act(o.id, { pay: "Paid" }, "Marked as paid")}>{t("Mark paid")}</button>}
            {o.ful === "Unfulfilled" && o.pay !== "Cancelled" && <button className="btn s" onClick={() => act(o.id, { ful: "Fulfilled" }, "Marked as fulfilled")}>{t("Fulfill")}</button>}
            <Link to={`/admin/orders/${o.id}`} className="btn s">{t("View")}</Link>
          </span>) },
      ]} />
  );
}

function DraftsTab({ drafts, ctx, onEdit }: { drafts: DraftOrder[]; ctx: Ctx; onEdit(d: DraftOrder): void }) {
  const t = useT();
  const [confirmDel, setConfirmDel] = useState<DraftOrder | null>(null);
  const prices = priceMap(ctx.products);
  const name = (id?: string) => !id ? t("Walk-in") : ctx.customers.find((c) => c.id === id)?.name ?? "-";
  const complete = async (d: DraftOrder) => {
    try { const o = await api.draftOrders.complete(ctx.storeId, d.id); toast(`${t("Order")} #${o.id} ${t("created")}`); ctx.reload(); }
    catch (e) { toast((e as Error).message, true); }
  };
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <button className="btn" onClick={() => onEdit({ id: crypto.randomUUID(), items: [], status: "Open", createdAt: Date.now() })}>{t("Create draft order")}</button>
      </div>
      <IndexTable items={[...drafts].reverse()} id={(d) => d.id} onRow={onEdit}
        search={(d) => name(d.customerId)} searchPlaceholder={t("Search drafts")}
        empty={<EmptyState art="📝" title={t("No draft orders")} text={t("Drafts let you take phone or in-person orders.")} />}
        cols={[
          { h: t("Draft"), cell: (d) => <b>#{d.id.slice(0, 8)}</b> },
          { h: t("Customer"), cell: (d) => name(d.customerId) },
          { h: t("Items"), right: true, cell: (d) => d.items.reduce((a, i) => a + i.qty, 0) },
          { h: t("Total"), right: true, cell: (d) => money(calc(d.items, prices, d.zoneId, d.code, ctx.settings, ctx.discounts, taxOpts(ctx.products)).total, ctx.settings.currency) },
          { h: t("Status"), cell: (d) => <Badge t={d.status} /> },
          { h: "", right: true, cell: (d) => (
            <span className="acts" style={{ justifyContent: "flex-end" }}>
              <button className="btn s" onClick={() => void complete(d)}>{t("Complete")}</button>
              <button className="btn s" onClick={() => setConfirmDel(d)}>{t("Delete")}</button>
            </span>) },
        ]} />
      <Confirm open={!!confirmDel} title={t("Delete this draft order?")} message={t("This cannot be undone.")}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { if (confirmDel) return api.draftOrders.remove(ctx.storeId, confirmDel.id).then(() => { setConfirmDel(null); toast(t("Draft deleted")); ctx.reload(); }); }} />
    </>
  );
}

function ReturnsTab({ returns, ctx }: { returns: OrderReturn[]; ctx: Ctx }) {
  const t = useT();
  const vlabel = (variantId: string) => {
    const e = ctx.products.flatMap((p) => p.variants.map((v) => ({ p, v }))).find((x) => x.v.id === variantId);
    return e ? `${e.p.title} — ${e.v.name}` : variantId;
  };
  const setStatus = async (r: OrderReturn, status: OrderReturn["status"]) => {
    try { await api.returns.setStatus(ctx.storeId, r.id, status); toast(`${t("Return")} ${status.toLowerCase()}`); ctx.reload(); }
    catch (e) { toast((e as Error).message, true); }
  };
  return (
    <IndexTable items={returns} id={(r) => r.id} pageSize={15}
      tabs={[{ id: "all", label: t("All") }, { id: "req", label: t("Requested") }, { id: "app", label: t("Approved") }, { id: "done", label: t("Completed") }]}
      filter={(r, t) => t === "all" || (t === "req" && r.status === "Requested") || (t === "app" && r.status === "Approved") || (t === "done" && r.status === "Completed")}
      empty={<EmptyState art="↩️" title={t("No returns")} text={t("Return requests from the order page will show up here.")} />}
      cols={[
        { h: t("Order"), cell: (r) => <Link to={`/admin/orders/${r.orderId}`}><b>#{r.orderId}</b></Link> },
        { h: t("Items"), cell: (r) => r.items.map((i) => `${i.qty} × ${vlabel(i.variantId)}${i.reason ? ` (${i.reason})` : ""}`).join(", ") },
        { h: t("Refund"), right: true, cell: (r) => r.refundAmount > 0 ? money(r.refundAmount, ctx.settings.currency) : <span className="mu-t">—</span> },
        { h: t("Status"), cell: (r) => <Badge t={r.status} /> },
        { h: "", right: true, cell: (r) => (
          <span className="acts" style={{ justifyContent: "flex-end" }}>
            {r.status === "Requested" && <><button className="btn s" onClick={() => void setStatus(r, "Approved")}>{t("Approve")}</button><button className="btn s" onClick={() => void setStatus(r, "Declined")}>{t("Decline")}</button></>}
            {r.status === "Approved" && <button className="btn s" onClick={() => void setStatus(r, "Completed")}>{t("Complete return")}</button>}
          </span>) },
      ]} />
  );
}

export default function Orders() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([
    api.orders.list(storeId), api.customers.list(storeId), api.products.list(storeId),
    api.settings.get(storeId), api.discounts.list(storeId), api.draftOrders.list(storeId), api.returns.list(storeId),
  ]), [storeId]);
  const [tab, setTab] = useState<"orders" | "drafts" | "returns">("orders");
  const [editDraft, setEditDraft] = useState<DraftOrder | null>(null);
  if (!data) return <Loading />;
  const [orders, customers, products, settings, discounts, drafts, returns] = data;
  const ctx: Ctx = { storeId, customers, products, settings, discounts, reload };
  const saveDraft = async (d: DraftOrder) => { await api.draftOrders.save(storeId, d); setEditDraft(null); toast(t("Draft saved")); reload(); };
  if (editDraft) return <DraftOrderForm initial={editDraft} customers={customers} products={products} settings={settings} discounts={discounts} onSave={(d) => void saveDraft(d)} onBack={() => setEditDraft(null)} />;
  return (
    <Page title={t("Orders")}
      actions={<div className="seg" role="tablist" aria-label={t("Order sections")}>
        {(["orders", "drafts", "returns"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={"btn s" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
            {k === "orders" ? `${t("Orders")} (${orders.length})` : k === "drafts" ? `${t("Drafts")} (${drafts.length})` : `${t("Returns")} (${returns.filter((r) => r.status === "Requested").length})`}</button>))}
      </div>}>
      {tab === "orders" && <OrdersTab orders={orders} ctx={ctx} />}
      {tab === "drafts" && <DraftsTab drafts={drafts} ctx={ctx} onEdit={setEditDraft} />}
      {tab === "returns" && <ReturnsTab returns={returns} ctx={ctx} />}
    </Page>
  );
}

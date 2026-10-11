import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Confirm, PageHeader, SaveBar, toast, Loading } from "../components/polaris";
import { Badge, Card } from "../components/ui";
import { segmentMatches, type CustomerStats } from "../lib/segments";
import { money } from "../lib/money";
import { orderTotal, priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { Customer, CustomerSegment, Order } from "../types";

function Form({ initial, orders, prices, segments, stats, storeId }: {
  initial: Customer; orders: Order[]; prices: Map<string, number>; segments: CustomerSegment[]; stats: CustomerStats; storeId: string;
}) {
  const t = useT();
  const nav = useNavigate();
  const [base, setBase] = useState(initial);
  const [c, setC] = useState(initial);
  const [addr, setAddr] = useState("");
  const [tag, setTag] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const msgKey = `msgs:${storeId}:${initial.id}`;
  const [msgs, setMsgs] = useState<{ at: number; from: string; text: string }[]>(() => { try { return JSON.parse(localStorage.getItem(msgKey) ?? "[]"); } catch { return []; } });
  const [draft, setDraft] = useState("");
  const sendMsg = () => {
    if (!draft.trim()) return;
    const next = [...msgs, { at: Date.now(), from: t("Staff"), text: draft.trim() }];
    setMsgs(next); setDraft("");
    try { localStorage.setItem(msgKey, JSON.stringify(next)); } catch { /* ignore */ }
    toast(t("Message saved"));
  };
  const [creditAmt, setCreditAmt] = useState("");
  const adjCredit = async (delta: number) => {
    if (!delta || !isFinite(delta)) return;
    try {
      const next = { ...c, credit: Math.max(0, (c.credit ?? 0) + delta) };
      await api.customers.save(storeId, next);
      setC(next); setBase(next); setCreditAmt("");
      toast(t("Store credit updated"));
    } catch (e) { toast((e as Error).message, true); }
  };
  const dirty = JSON.stringify(c) !== JSON.stringify(base);
  const paid = orders.filter((o) => o.pay === "Paid");
  const spent = paid.reduce((a, o) => a + orderTotal(o, prices), 0);
  const set = (p: Partial<Customer>) => setC({ ...c, ...p });
  const save = async () => {
    if (!c.name.trim() || !c.email.includes("@")) return toast(t("Enter a name and a valid email"), true);
    try { await api.customers.save(storeId, c); setBase(c); toast(t("Customer saved")); } catch (e) { toast((e as Error).message, true); }
  };
  const memberOf = segments.filter((s) => segmentMatches(c, stats, s));
  const timeline = orders.flatMap((o) => [
    { at: o.createdAt, text: `${t("Order")} #${o.id} ${t("placed")} — ${money(orderTotal(o, prices))}` },
    ...o.log.map((e) => ({ at: e.at, text: `#${o.id}: ${e.text}` })),
  ]).sort((a, b) => b.at - a.at);
  return (
    <>
      <PageHeader title={c.name || t("Customer")} back={() => nav("/admin/customers")}
        actions={<button className="btn s" onClick={() => setConfirmDel(true)}>{t("Delete")}</button>} />
      {memberOf.length > 0 && <p style={{ margin: "-8px 0 16px" }}>{memberOf.map((s) => <Badge key={s.id} t={s.name} />)}</p>}
      <div className="two">
        <div>
          <Card><div className="stats">{([[t("Amount spent"), money(spent)], [t("Orders"), String(orders.length)], [t("Average order"), money(paid.length ? spent / paid.length : 0)]] as const).map(([k, v]) => <div key={k}><div className="mu-t">{k}</div><div className="big">{v}</div></div>)}</div></Card>
          <div className="card flush"><div className="ch"><b>{t("Orders")}</b></div>
            {orders.length ? <table><tbody>{[...orders].reverse().map((o) => (
              <tr key={o.id} className="click" tabIndex={0} onClick={() => nav(`/admin/orders/${o.id}`)} onKeyDown={(e) => e.key === "Enter" && nav(`/admin/orders/${o.id}`)}>
                <td><Link to={`/admin/orders/${o.id}`}>#{o.id}</Link></td><td>{money(orderTotal(o, prices))}</td><td><Badge t={o.pay} /></td><td><Badge t={o.ful} /></td></tr>))}</tbody></table>
              : <p className="mu-t ch">{t("No orders yet.")}</p>}</div>
          <Card><b>{t("Timeline")}</b>
            {timeline.length ? timeline.map((e, i) => <div key={i} className="tl"><span>{e.text}</span><span className="mu-t">{new Date(e.at).toLocaleString()}</span></div>)
              : <p className="mu-t">{t("No activity yet.")}</p>}
          </Card>
          <Card><b>{t("Messages")}</b>
            <p className="mu-t">{t("Marketing emails sent to this customer will appear here.")}</p>
            {msgs.length ? msgs.map((m, i) => <div key={i} className="tl"><span><b>{m.from}:</b> {m.text}</span><span className="mu-t">{new Date(m.at).toLocaleString()}</span></div>)
              : <p className="mu-t">{t("No messages yet.")}</p>}
            <label><span className="mu-t">{t("Send a message")}</span><textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Type a message to the customer…")} /></label>
            <button className="btn s" disabled={!draft.trim()} onClick={sendMsg}>{t("Send")}</button>
          </Card>
        </div>
        <div>
          <Card><b>{t("Customer")}</b>
            <label>{t("Name")}<input value={c.name} onChange={(e) => set({ name: e.target.value })} /></label>
            <label>{t("Email")}<input type="email" value={c.email} onChange={(e) => set({ email: e.target.value })} /></label>
            <label>{t("Phone")}<input value={c.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></label></Card>
          <Card><b>{t("Tags")}</b>
            <div style={{ marginBottom: 8 }}>{(c.tags ?? []).map((tg) => <span key={tg} className="tagchip">{tg}<button aria-label={`${t("Remove tag")} ${tg}`} onClick={() => set({ tags: (c.tags ?? []).filter((x) => x !== tg) })}>✕</button></span>)}</div>
            <div className="row"><input aria-label={t("New tag")} placeholder={t("Add a tag")} value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tag.trim()) { set({ tags: [...(c.tags ?? []), tag.trim()] }); setTag(""); } }} /><button className="btn s" onClick={() => { if (tag.trim()) { set({ tags: [...(c.tags ?? []), tag.trim()] }); setTag(""); } }}>{t("Add")}</button></div>
          </Card>
          <Card><b>{t("Store credit")}</b>
            <div className="big">{money(c.credit ?? 0)}</div>
            <div className="row">
              <input type="number" min={0} step="any" aria-label={t("Amount")} placeholder={t("Amount")} value={creditAmt} onChange={(e) => setCreditAmt(e.target.value)} />
              <button className="btn s" onClick={() => void adjCredit(+creditAmt)}>{t("Add")}</button>
              <button className="btn s" onClick={() => void adjCredit(-(+creditAmt))}>{t("Remove")}</button>
            </div>
            <p className="hint">{t("Customers can spend store credit at checkout.")}</p>
          </Card>
          <Card><b>{t("Addresses")}</b>
            {c.addresses.map((a, i) => <div className="between line" key={i}><span>{a}</span><button className="btn s" onClick={() => set({ addresses: c.addresses.filter((_, j) => j !== i) })}>{t("Remove")}</button></div>)}
            <div className="row"><input aria-label={t("New address")} placeholder={t("Add an address")} value={addr} onChange={(e) => setAddr(e.target.value)} /><button className="btn s" onClick={() => { if (addr.trim()) { set({ addresses: [...c.addresses, addr.trim()] }); setAddr(""); } }}>{t("Add")}</button></div></Card>
          <Card><label><b>{t("Notes")}</b><textarea rows={3} value={c.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} /></label></Card>
        </div>
      </div>
      <SaveBar dirty={dirty} onSave={() => void save()} onDiscard={() => { setC(base); setAddr(""); setTag(""); }} />
      <Confirm open={confirmDel} title={`${t("Delete")} ${c.name}?`} message={t("Their orders are kept.")}
        onClose={() => setConfirmDel(false)}
        onConfirm={() => api.customers.remove(storeId, c.id).then(() => { toast(t("Customer deleted")); nav("/admin/customers"); })} />
    </>
  );
}
export default function CustomerDetail() {
  const { id } = useParams();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => Promise.all([api.customers.list(storeId), api.orders.list(storeId), api.products.list(storeId), api.segments.list(storeId)]), [storeId]);
  const tt = useT();
  if (!data) return <Loading />;
  const [customers, orders, products, segments] = data;
  const c = customers.find((x) => x.id === id);
  if (!c) return <p>{tt("Customer not found.")} <Link to="/admin/customers">{tt("Back")}</Link></p>;
  const custOrders = orders.filter((o) => o.customerId === c.id);
  const prices = priceMap(products);
  const stats: CustomerStats = { ordersCount: custOrders.length, totalSpent: custOrders.filter((o) => o.pay === "Paid").reduce((a, o) => a + orderTotal(o, prices), 0) };
  return <Form initial={c} orders={custOrders} prices={prices} segments={segments} stats={stats} storeId={storeId} />;
}

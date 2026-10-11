import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Breakdown } from "../components/Breakdown";
import PrintDoc from "../components/PrintDocs";
import { Confirm, Modal, PageHeader, toast, Loading } from "../components/polaris";
import { Badge, Card } from "../components/ui";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { MOCK_CARRIERS, zoneRates } from "../lib/shipping";
import { enabledCouriers, courierById, mockConsign, mockTrackingTimeline } from "../lib/couriers";
import { RISK_META, saveFraudCheck, type FraudResult } from "../lib/fraud";
import { dispatchNotifications } from "../lib/notify";
import { variantIndex } from "../lib/shop";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { ReturnItem, Order, Settings } from "../types";

function CourierAssign({ o, settings, run }: {
    o: Order; settings: Settings; run: (fn: () => Promise<unknown>, ok: string) => Promise<void>;
}) {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const [cid, setCid] = useState(o.courierId ?? "");
    const [busy, setBusy] = useState(false);
    const [showTl, setShowTl] = useState(false);
    const couriers = enabledCouriers(settings.couriers);
    const cur = courierById(o.courierId);
    const assign = async () => {
        if (!cid) return;
        const c = courierById(cid);
        if (!c) return;
        setBusy(true);
        try {
            const { trackingId } = await mockConsign(cid, o.id);
            await run(
                () => api.orders.update(storeId, o.id,
                    { courierId: cid, tracking: { carrier: c.name, number: trackingId, url: `https://track.example/${trackingId}` } },
                    `Consignment created with ${c.name} (${trackingId})`),
                "Courier assigned",
            );
        } finally { setBusy(false); }
    };
    return (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--bd)", paddingTop: 12 }}>
            <b>{t("Courier")}</b>
            {cur && o.tracking ? (
                <div style={{ marginTop: 8 }}>
                    <div className="between">
                        <span><span className="badge" style={{ background: cur.color }}>{cur.name}</span></span>
                        <b>{o.tracking.number}</b>
                    </div>
                    <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn s" onClick={() => setShowTl(!showTl)}>{showTl ? t("Hide tracking") : t("View tracking")}</button>
                    </div>
                    {showTl && (
                        <div style={{ marginTop: 8 }}>
                            {mockTrackingTimeline(o.tracking.number).map((e, i) => (
                                <div key={i} className="tl"><span>{e.text}</span><span className="mu-t">{new Date(e.at).toLocaleString()}</span></div>
                            ))}
                        </div>
                    )}
                </div>
            ) : couriers.length === 0 ? (
                <p className="mu-t" style={{ margin: "8px 0 0" }}>{t("No couriers connected.")} <Link to="/admin/couriers">{t("Connect a courier")}</Link></p>
            ) : (
                <div className="row" style={{ marginTop: 8 }}>
                    <select aria-label={t("Choose courier")} value={cid} onChange={(e) => setCid(e.target.value)} style={{ flex: 1 }}>
                        <option value="">{t("Choose courier…")}</option>
                        {couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="btn s" disabled={!cid || busy} onClick={() => void assign()}>{busy ? t("Creating…") : t("Create consignment")}</button>
                </div>
            )}
        </div>
    );
}

function FraudPanel({ phone, storeId }: { phone?: string; storeId: string }) {
    const t = useT();
    const [r, setR] = useState<FraudResult | null>(null);
    const [live, setLive] = useState(false);
    const [busy, setBusy] = useState(false);
    const run = async () => {
        if (!phone) return;
        setBusy(true);
        try {
            const { result: res, live: isLive } = await api.fraud.check(storeId, phone);
            saveFraudCheck(res); setR(res); setLive(isLive);
        } catch { /* keep old */ }
        setBusy(false);
    };
    const m = r ? RISK_META[r.risk] : null;
    if (!phone) return (
        <Card>
            <div className="between" style={{ alignItems: "center" }}>
                <b>🛡️ {t("Fraud check")}</b>
                <Link className="btn s plain" to="/admin/fraud-check">{t("Check manually")}</Link>
            </div>
            <p className="mu-t" style={{ margin: "8px 0 0" }}>{t("No phone number on this order.")}</p>
        </Card>
    );
    return (
        <Card>
            <div className="between" style={{ alignItems: "center" }}>
                <b>🛡️ {t("Fraud check")}</b>
                {r && m ? (
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12, color: m.color, background: m.bg }}>
            {r.risk === "low" ? t("Low risk") : r.risk === "medium" ? t("Medium risk") : r.risk === "high" ? t("High risk") : t("No history")} · {r.successRate}%
          </span>
                ) : (
                    <button className="btn s" disabled={busy} onClick={() => void run()}>{busy ? t("Checking…") : t("Check customer")}</button>
                )}
            </div>
            {r && (
                <div style={{ marginTop: 8 }}>
                    <div className="mu-t">{t("{d} delivered of {t} parcels").replace("{d}", String(r.delivered)).replace("{t}", String(r.totalParcels))}{r.totalParcels > 0 && ` · ${t("couriers")}: ${r.couriers.join(", ")}`}</div>
                    <div className="mu-t" style={{ marginTop: 4 }}>{live ? <span className="ok-t">● {t("Live courier data")}</span> : <span>○ {t("Demo data")}</span>}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn s plain" onClick={() => void run()}>{t("Re-check")}</button>
                        <Link className="btn s plain" to="/admin/fraud-check">{t("Full report")}</Link>
                    </div>
                </div>
            )}
        </Card>
    );
}

function ReturnModal({ orderId, items, onClose, onDone }: {
    orderId: number; items: { variantId: string; label: string; max: number }[]; onClose(): void; onDone(): void;
}) {  const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const [sel, setSel] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");
    const toggle = (variantId: string) => setSel((s) => s.some((x) => x.variantId === variantId) ? s.filter((x) => x.variantId !== variantId) : [...s, { variantId, qty: 1, reason }]);
    const submit = async () => {
        try { await api.returns.create(storeId, { orderId, items: sel.map((x) => ({ ...x, reason: reason || undefined })) }); onDone(); }
        catch (e) { setErr((e as Error).message); }
    };
    return (
        <Modal open onClose={onClose} title={`${t("Request return")} — #${orderId}`}
               footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" disabled={!sel.length} onClick={() => void submit()}>{t("Submit request")}</button></>}>
            {items.map((it) => {
                const on = sel.find((x) => x.variantId === it.variantId);
                return (
                    <div className="between" key={it.variantId} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
                        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={!!on} onChange={() => toggle(it.variantId)} />{it.label} <span className="mu-t">({t("max")} {it.max})</span></label>
                        {on && <input type="number" min={1} max={it.max} aria-label={`${t("Return quantity for")} ${it.label}`} value={on.qty} style={{ width: 70 }}
                                      onChange={(e) => setSel(sel.map((x) => x.variantId === it.variantId ? { ...x, qty: Math.min(it.max, Math.max(1, +e.target.value)) } : x))} />}
                    </div>);
            })}
            <label style={{ marginTop: 10 }}><span className="mu-t">{t("Reason")}</span>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("e.g. Wrong size")} /></label>
            {err && <p className="er-t">{err}</p>}
        </Modal>
    );
}

function TrackingModal({ initial, onClose, onSave }: {
    initial: { carrier: string; number: string; url?: string }; onClose(): void; onSave(t: { carrier: string; number: string; url?: string }): void;
}) {
    const tt = useT();
    const [t, setT] = useState(initial);
    const [err, setErr] = useState("");
    const save = () => {
        if (!t.number.trim()) return setErr(tt("Enter a tracking number"));
        onSave({ carrier: t.carrier, number: t.number.trim(), url: t.url?.trim() || undefined });
    };
    return (
        <Modal open onClose={onClose} title={tt("Tracking information")}
               footer={<><button className="btn s" onClick={onClose}>Cancel</button><button className="btn" onClick={save}>Save</button></>}>
            <label><span className="mu-t">{tt("Carrier")}</span>
                <select value={t.carrier} onChange={(e) => setT({ ...t, carrier: e.target.value })}>{MOCK_CARRIERS.map((c) => <option key={c}>{c}</option>)}<option>{tt("Other")}</option></select></label>
            <label><span className="mu-t">{tt("Tracking number")}</span><input autoFocus value={t.number} onChange={(e) => setT({ ...t, number: e.target.value })} placeholder="TRK123456" /></label>
            <label><span className="mu-t">{tt("Tracking URL (optional)")}</span><input value={t.url ?? ""} onChange={(e) => setT({ ...t, url: e.target.value })} placeholder="https://…" /></label>
            {err && <p className="er-t">{err}</p>}
        </Modal>
    );
}

export default function OrderDetail() {
    const t = useT();
    const { id } = useParams();
    const nav = useNavigate();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, reload } = useLoad(() => Promise.all([api.orders.list(storeId), api.customers.list(storeId), api.products.list(storeId), api.settings.get(storeId), api.discounts.list(storeId), api.returns.list(storeId)]), [storeId]);
    const [amt, setAmt] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState("");
    const [retOpen, setRetOpen] = useState(false);
    const [trackOpen, setTrackOpen] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [doc, setDoc] = useState<null | "invoice" | "packing" | "label">(null);
    if (!data) return <Loading />;
    const [orders, customers, products, settings, discounts, returns] = data;
    const o = orders.find((x) => String(x.id) === id);
    if (!o) return <p>{t("Order not found.")} <Link to="/admin/orders">{t("Back")}</Link></p>;
    if (doc) return <PrintDoc kind={doc} order={o} products={products} settings={settings} discounts={discounts} onDone={() => setDoc(null)} />;
    const cur = settings.currency;
    const idx = variantIndex(products);
    const c = calc(o.items, priceMap(products), o.zoneId, o.code, settings, discounts, taxOpts(products));
    const remaining = c.total - o.refunded;
    const cust = customers.find((x) => x.id === o.customerId);
    const orderReturns = returns.filter((r) => r.orderId === o.id);
    const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setErr(""); setAmt(""); setNote(""); toast(t(ok)); reload(); } catch (e) { setErr((e as Error).message); } };
    const events = [{ at: o.createdAt, text: t("Order placed") }, ...o.log];
    const addNote = () => { if (!note.trim()) return; void run(() => api.orders.update(storeId, o.id, {}, `${t("Note")}: ${note.trim()}`), "Note added"); };
    const actions = (<>
        <button className="btn s" onClick={() => setDoc("invoice")}>{t("Print invoice")}</button>
        <button className="btn s" onClick={() => setDoc("packing")}>{t("Packing slip")}</button>
        {o.pay === "Pending" && o.ful === "Unfulfilled" && <button className="btn s" onClick={() => setConfirmCancel(true)}>{t("Cancel order")}</button>}
        {o.pay === "Paid" && <button className="btn s" onClick={() => void run(() => api.orders.refund(storeId, o.id, Math.round(remaining * 100)), "Refunded")}>{t("Refund all")}</button>}
        {o.pay === "Pending" && <button className="btn" onClick={() => void run(() => api.orders.update(storeId, o.id, { pay: "Paid" }, "Marked as paid"), "Marked as paid")}>{t("Mark as paid")}</button>}
        {o.ful === "Unfulfilled" && o.pay !== "Cancelled" && o.pay !== "Refunded" && <button className="btn" onClick={() => void run(async () => {
            // Real fulfill endpoint: persists fulfillment AND converts reserved
            // stock to sold server-side. (The old PATCH {ful} path only echoed
            // "Fulfilled" in the response without persisting or touching inventory.)
            await api.orders.fulfill(storeId, o.id);
            const vars = { name: cust?.name ?? "", order_id: "#" + o.id, tracking_link: o.tracking?.url ?? "", store: settings.storeName, amount: "" };
            const sent = dispatchNotifications(settings, "order_shipped", vars, { email: cust?.email, phone: cust?.phone });
            if (sent.length) toast("📧📱 " + t("Notifications sent") + " (" + sent.map((x) => x.channel).join(" + ") + ", demo)");
        }, "Marked as fulfilled")}>{t("Fulfill items")}</button>}
        {o.pay !== "Cancelled" && o.pay !== "Refunded" && <button className="btn s" onClick={() => setRetOpen(true)}>{t("Request return")}</button>}
    </>);
    return (
        <>
            <PageHeader back={() => nav("/admin/orders")} title={<>#{o.id} <Badge t={o.pay} /> <Badge t={o.ful} /></>} actions={actions} />
            <p className="mu-t" style={{ margin: "-8px 0 16px" }}>{new Date(o.createdAt).toLocaleString()}</p>
            {err && <p className="er-t">{err}</p>}
            <div className="two">
                <div>
                    <Card><div className="between"><b>{t("Items")}</b><Badge t={o.ful} /></div>
                        {o.items.map((i) => { const r = idx.get(i.variantId); return (
                            <div className="prod line" key={i.variantId}>
                                {r?.p.images[0] ? <img className="tn" src={r.p.images[0]} alt="" /> : <span className="tn ph0" />}
                                <div style={{ flex: 1 }}>{r ? r.p.title : t("Deleted item")}<div className="mu-t">{r?.v.name}</div></div>
                                <span className="mu-t">{money(r?.v.price ?? 0, cur)} × {i.qty}</span><b>{money((r?.v.price ?? 0) * i.qty, cur)}</b>
                            </div>); })}
                    </Card>
                    <Card><div className="between"><b>{t("Payment")}</b><Badge t={o.pay} /></div>
                        <Breakdown c={c} cur={cur} gift={o.giftApplied} />
                        {o.refunded > 0 && <p className="mu-t">{t("Refunded so far:")} {money(o.refunded, cur)}</p>}
                        {o.pay === "Paid" && <div className="row"><input type="number" min={0} aria-label={t("Partial refund amount")} placeholder={t("Partial refund amount")} value={amt} onChange={(e) => setAmt(e.target.value)} /><button className="btn s" onClick={() => void run(() => api.orders.refund(storeId, o.id, Math.round(+amt * 100)), "Refunded")}>{t("Refund")}</button></div>}
                    </Card>
                    {orderReturns.length > 0 && (
                        <Card><b>{t("Returns")}</b>{orderReturns.map((r) => (
                            <div className="between" key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
                                <span>{r.items.map((i) => { const v = idx.get(i.variantId); return `${i.qty} × ${v ? v.p.title + " — " + v.v.name : i.variantId}`; }).join(", ")}</span>
                                <Badge t={r.status} />
                            </div>))}
                        </Card>
                    )}
                    <Card><b>{t("Timeline")}</b>
                        {events.map((e, i) => <div key={i} className="tl"><span>{e.text}</span><span className="mu-t">{new Date(e.at).toLocaleString()}</span></div>)}
                        <div className="row" style={{ marginTop: 10 }}>
                            <input aria-label={t("Add a note")} placeholder={t("Add a note to the timeline…")} value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1 }} />
                            <button className="btn s" disabled={!note.trim()} onClick={addNote}>{t("Add note")}</button>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card><b>{t("Customer")}</b><p style={{ margin: "8px 0 0" }}>{cust ? <Link to={`/admin/customers/${cust.id}`}>{cust.name}</Link>  : o.customerId === "walkin" ? t("Walk-in") : "-"}</p>{cust && <p className="mu-t" style={{ margin: 0 }}>{cust.email}</p>}</Card>
                    <FraudPanel phone={cust?.phone} storeId={storeId} />
                    <Card><div className="between"><b>{t("Shipping")}</b>{o.ful === "Fulfilled" && <Badge t={t("Shipped")} />}</div>
                        {(() => {
                            const z = settings.zones.find((x) => x.id === o.zoneId);
                            const r = z ? zoneRates(z).find((x) => x.id === o.rateId) : undefined;
                            return z ? <p className="mu-t" style={{ margin: "8px 0" }}>{z.name}{r ? ` · ${r.name}` : ""}</p> : <p className="mu-t">{t("No shipping zone.")}</p>;
                        })()}
                        {o.tracking ? (
                            <div>
                                <div className="between"><span>{o.tracking.carrier}</span><b>{o.tracking.number}</b></div>
                                {o.tracking.url && <a href={o.tracking.url} target="_blank" rel="noreferrer" className="mu-t">{t("Track package")}</a>}
                                <div className="row" style={{ marginTop: 8 }}>
                                    <button className="btn s" onClick={() => setTrackOpen(true)}>{t("Edit tracking")}</button>
                                    <button className="btn s" onClick={() => setDoc("label")}>{t("Print label")}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="row" style={{ marginTop: 4 }}>
                                <button className="btn s" onClick={() => setTrackOpen(true)}>{t("Add tracking")}</button>
                                {o.ful === "Fulfilled" && (
                                    <button className="btn s" onClick={() => {
                                        const number = "MOCK-" + Math.random().toString(36).slice(2, 10).toUpperCase();
                                        void run(() => api.orders.update(storeId, o.id, { tracking: { carrier: MOCK_CARRIERS[0], number, labelReady: true } }, `Shipping label purchased (${number})`), "Label ready").then(() => setDoc("label"));
                                    }}>Buy shipping label</button>
                                )}
                            </div>
                        )}
                        <CourierAssign o={o} settings={settings} run={run} />
                    </Card>
                </div>
            </div>
            {retOpen && (
                <ReturnModal orderId={o.id}
                             items={o.items.map((i) => { const r = idx.get(i.variantId); return { variantId: i.variantId, label: r ? `${r.p.title} — ${r.v.name}` : i.variantId, max: i.qty }; })}
                             onClose={() => setRetOpen(false)}
                             onDone={() => { setRetOpen(false); toast(t("Return requested")); reload(); }} />
            )}
            {trackOpen && (
                <TrackingModal initial={o.tracking ?? { carrier: MOCK_CARRIERS[0], number: "" }}
                               onClose={() => setTrackOpen(false)}
                               onSave={(tr) => { setTrackOpen(false); void run(() => api.orders.update(storeId, o.id, { tracking: tr }, `${t("Tracking")} ${tr.number} ${t("added")}`), "Tracking saved"); }} />
            )}
            <Confirm open={confirmCancel} title={`${t("Cancel order")} #${o.id}?`} message={t("This cannot be undone.")}
                     onClose={() => setConfirmCancel(false)}
                     onConfirm={() => run(() => api.orders.cancel(storeId, o.id), "Order cancelled").then(() => setConfirmCancel(false))} />
        </>
    );
}

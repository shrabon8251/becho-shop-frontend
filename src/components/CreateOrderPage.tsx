import { useState } from "react";
import { api } from "../api";
import { PageHeader } from "./polaris";
import { toast } from "../components/polaris";
import { useT } from "../lib/fx";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { Card } from "./ui";
import type { Customer, Discount, Order, OrderItem, Product, Settings } from "../types";

/**
 * Manual order form — creates a real order directly (no draft in between).
 * Uses api.orders.createManual (POST /stores/{id}/orders).
 */
export default function CreateOrderPage({ storeId, customers, products, settings, discounts, onBack, onDone }: {
    storeId: string; customers: Customer[]; products: Product[]; settings: Settings; discounts: Discount[];
    onBack(): void; onDone(o: Order, paid: boolean): void;
}) {
    const t = useT();
    const [items, setItems] = useState<OrderItem[]>([]);
    const [q, setQ] = useState("");
    const [custs, setCusts] = useState<Customer[]>(customers);
    const [customerId, setCustomerId] = useState("");
    const [showNewCust, setShowNewCust] = useState(false);
    const [nc, setNc] = useState({ name: "", phone: "", email: "" });
    const [payMethod, setPayMethod] = useState("cod");
    const [payStatus, setPayStatus] = useState<"Pending" | "Paid">("Pending");
    const [zoneId, setZoneId] = useState("");
    const [code, setCode] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const vmap = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, { p, v }] as const)));
    const c = calc(items, priceMap(products), zoneId || undefined, code || undefined, settings, discounts, taxOpts(products));
    const cur = settings.currency;

    const results = q.trim()
        ? products.flatMap((p) => p.variants.map((v) => ({ p, v })))
            .filter(({ p, v }) => !items.some((i) => i.variantId === v.id) && `${p.title} ${v.name} ${v.sku}`.toLowerCase().includes(q.trim().toLowerCase()))
            .slice(0, 8)
        : [];
    const setQty = (variantId: string, qty: number) => setItems((list) =>
        qty <= 0 ? list.filter((i) => i.variantId !== variantId) : list.map((i) => (i.variantId === variantId ? { ...i, qty } : i)));

    const addCustomer = async () => {
        if (!nc.name.trim() || !nc.phone.trim()) { toast(t("Name and phone are required"), true); return; }
        try {
            const created = await api.customers.save(storeId, { id: crypto.randomUUID(), name: nc.name.trim(), email: nc.email.trim(), phone: nc.phone.trim(), addresses: [] });
            setCusts((list) => [...list, created]);
            setCustomerId(created.id);
            setShowNewCust(false);
            setNc({ name: "", phone: "", email: "" });
            toast(t("Customer added"));
        } catch (e) { toast((e as Error).message, true); }
    };

    const submit = async () => {
        if (!items.length || saving) return;
        setSaving(true);
        try {
            const cust = custs.find((x) => x.id === customerId);
            const o = await api.orders.createManual(storeId, {
                customerId: customerId || undefined,
                email: cust?.email, phone: cust?.phone,
                items, payMethod,
                discountCode: code.trim() || undefined,
                notes: note.trim() || undefined,
            });
            if (payStatus === "Paid") await api.orders.update(storeId, o.id, { pay: "Paid" }, "Marked as paid");
            onDone(o, payStatus === "Paid");
        } catch (e) { toast((e as Error).message, true); setSaving(false); }
    };

    return (
        <>
            <PageHeader title={t("Create order")} back={onBack}
                        actions={<button className="btn" disabled={!items.length || saving} onClick={() => void submit()}>{t("Create order")}</button>} />
            <div className="two">
                <div>
                    <Card><b>{t("Add products")}</b>
                        <label style={{ marginTop: 8 }}><input type="search" placeholder={t("Search products")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
                        {results.map(({ p, v }) => (
                            <div className="between" key={v.id} style={{ padding: "4px 0" }}>
                                <span className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title} — {v.name} <span className="mu-t">({v.stock} {t("in stock")})</span></span>
                                <button className="btn s" onClick={() => { setItems((list) => [...list, { variantId: v.id, qty: 1 }]); setQ(""); }}>{t("Add")}</button>
                            </div>))}
                        {items.map((i) => {
                            const e = vmap.get(i.variantId);
                            return (
                                <div className="between" key={i.variantId} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
                                    <span className="prod">{e?.p.images[0] ? <img className="tn" src={e.p.images[0]} alt="" /> : <span className="tn ph0" />}{e ? `${e.p.title} — ${e.v.name}` : i.variantId}</span>
                                    <span className="row" style={{ alignItems: "center" }}>
                                        <button type="button" className="btn s" onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                                        <input type="number" min={0} aria-label={t("Quantity")} value={i.qty} style={{ width: 60 }} onChange={(e2) => setQty(i.variantId, +e2.target.value)} />
                                        <button type="button" className="btn s" onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                                        <b>{money((e?.v.price ?? 0) * i.qty, cur)}</b>
                                        <button className="btn s" onClick={() => setQty(i.variantId, 0)}>{t("Remove")}</button>
                                    </span>
                                </div>);
                        })}
                        {items.length === 0 && <p className="mu-t">{t("Search and add products to this order.")}</p>}
                    </Card>
                    <Card><label><b>{t("Note")}</b><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("Internal note…")} rows={2} /></label></Card>
                </div>
                <div>
                    <Card><label><b>{t("Customer")}</b>
                        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                            <option value="">{t("Walk-in")}</option>
                            {custs.map((c2) => <option key={c2.id} value={c2.id}>{c2.name}{c2.phone ? ` — ${c2.phone}` : ""}</option>)}
                        </select></label>
                        {!showNewCust
                            ? <button type="button" className="btn s" onClick={() => setShowNewCust(true)}>+ {t("Add new customer")}</button>
                            : <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                                <input placeholder={t("Name")} value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
                                <input placeholder={t("Phone")} value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} />
                                <input placeholder={t("Email (optional)")} value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} />
                                <span className="row"><button type="button" className="btn s" onClick={() => void addCustomer()}>{t("Save customer")}</button>
                                <button type="button" className="btn s" onClick={() => setShowNewCust(false)}>{t("Cancel")}</button></span>
                            </div>}
                        <label><b>{t("Discount code")}</b><input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("Optional")} /></label>
                        <label><b>{t("Shipping zone")}</b>
                            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                                <option value="">{t("No shipping")}</option>
                                {settings.zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {money(z.rate, cur)}</option>)}
                            </select></label>
                    </Card>
                    <Card><b>{t("Payment")}</b>
                        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {([["cod", "Cash on Delivery"], ["bkash", "bKash"], ["nagad", "Nagad"], ["card", "Card"]] as const).map(([v, label]) => (
                                <button key={v} type="button" className={"btn s" + (payMethod === v ? " on" : "")} onClick={() => setPayMethod(v)}>{label}</button>))}
                        </div>
                        <label style={{ marginTop: 10 }}><b>{t("Payment status")}</b>
                            <select value={payStatus} onChange={(e) => setPayStatus(e.target.value as "Pending" | "Paid")}>
                                <option value="Pending">{t("Pending")}</option>
                                <option value="Paid">{t("Paid")}</option>
                            </select></label>
                    </Card>
                    <Card><b>{t("Summary")}</b>
                        <div className="between mu-t"><span>{t("Subtotal")}</span><span>{money(c.sub, cur)}</span></div>
                        {c.disc > 0 && <div className="between mu-t"><span>{t("Discount")}</span><span>−{money(c.disc, cur)}</span></div>}
                        <div className="between mu-t"><span>{t("Delivery")}</span><span>{money(c.ship, cur)}</span></div>
                        {c.tax > 0 && <div className="between mu-t"><span>{t("Tax")}</span><span>{money(c.tax, cur)}</span></div>}
                        <div className="between"><b>{t("Total")}</b><b>{money(c.total, cur)}</b></div>
                    </Card>
                </div>
            </div>
        </>
    );
}

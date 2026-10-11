import { useState } from "react";
import { PageHeader, Loading, Modal } from "../components/polaris";
import { api } from "../api";
import { Breakdown } from "../components/Breakdown";
import { Card } from "../components/ui";
import { calc, taxOpts } from "../lib/calc";
import { findCode } from "../lib/discounts";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { variantIndex } from "../lib/shop";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Order, OrderItem } from "../types";

type Method = "cash" | "card" | "mobile";
const METHODS: { id: Method; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "mobile", label: "Mobile banking" },
];

export default function POS() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([api.products.list(storeId), api.customers.list(storeId), api.settings.get(storeId), api.discounts.list(storeId), api.locations.list(storeId)]), [storeId]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cust, setCust] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [tendered, setTendered] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<{ order: Order; tendered: number; change: number; method: Method } | null>(null);
  const [branch, setBranch] = useState("");
  if (!data) return <Loading />;
  const [products, customers, settings, discounts, locations] = data;
  const cur = settings.currency;
  const idx = variantIndex(products);
  const live = products.filter((p) => p.status === "Active");
  const activeLocs = locations.filter((l) => l.active);
  const branchId = branch || activeLocs.find((l) => l.isDefault)?.id || activeLocs[0]?.id;
  const codeUp = code.trim().toUpperCase();
  const found = findCode(discounts, codeUp || undefined);
  const codeErr = codeUp && !found ? t("Code not valid") : "";
  const c = calc(cart, priceMap(products), undefined, found?.code, settings, discounts, taxOpts(products));
  const change = method === "cash" && tendered !== "" ? +tendered - c.total : 0;
  const add = (id: string, stock: number) => { const ex = cart.find((i) => i.variantId === id); if ((ex?.qty ?? 0) >= stock) return; setMsg(""); setCart(ex ? cart.map((i) => (i.variantId === id ? { ...i, qty: i.qty + 1 } : i)) : [...cart, { variantId: id, qty: 1 }]); };
  const chg = (id: string, d: number, stock: number) => setCart(cart.map((i) => (i.variantId === id ? { ...i, qty: Math.min(i.qty + d, stock) } : i)).filter((i) => i.qty > 0));
  const charge = async () => {
    if (!cart.length) return;
    if (codeErr) return setErr(t("Fix the discount code first"));
    if (method === "cash" && !(+tendered >= c.total)) return setErr(t("Tendered amount must cover the total"));
    try {
      const o = await api.pos.sale(storeId, { customerId: cust || undefined, items: cart, code: found?.code, method });
      const finalOrder = branchId ? await api.orders.update(storeId, o.id, { locationId: branchId }) : o;
      setReceipt({ order: finalOrder, tendered: method === "cash" ? +tendered : c.total, change: method === "cash" ? +tendered - c.total : 0, method });
      setCart([]); setCode(""); setTendered(""); setErr(""); setMsg(`${t("Sale complete.")} ${t("Order")} #${o.id}`); reload();
    } catch (e) { setErr((e as Error).message); }
  };
  const availCodes = discounts.filter((x) => x.active && (x.kind ?? "code") === "code" && x.code);
  return (
    <>
      <PageHeader title={t("POS")} />
      <div className="two">
        <div className="pgrid" style={{ alignContent: "start" }}>{live.flatMap((p) => p.variants.map((v) => (
          <div key={v.id} className="card pcard" style={{ cursor: v.stock ? "pointer" : "not-allowed", opacity: v.stock ? 1 : 0.5, padding: 10 }} onClick={() => add(v.id, v.stock)}>
            <div>{p.title}</div><div className="mu-t">{v.name}</div><b>{money(v.price, cur)}</b><div className="mu-t">{v.stock} {t("left")}</div></div>)))}</div>
        <Card><b>{t("Current sale")}</b>
          {!cart.length && <p className="mu-t">{t("Tap a product to add it.")}</p>}
          {cart.map((i) => { const r = idx.get(i.variantId); if (!r) return null; return (
            <div className="between" key={i.variantId} style={{ margin: "6px 0" }}><span>{r.p.title} ({r.v.name})</span>
              <span><button className="btn s" onClick={() => chg(i.variantId, -1, r.v.stock)}>-</button> {i.qty} <button className="btn s" onClick={() => chg(i.variantId, 1, r.v.stock)}>+</button></span></div>); })}
          {activeLocs.length > 1 && (
            <label><span className="mu-t">{t("Branch")}</span>
              <select value={branchId} onChange={(e) => setBranch(e.target.value)}>{activeLocs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            </label>)}
          <select value={cust} onChange={(e) => setCust(e.target.value)}><option value="">{t("Walk-in customer")}</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <label><span className="mu-t">{t("Discount")}</span>
            <input placeholder={t("Discount code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            {codeErr && <span className="er-t">{codeErr}</span>}
            {found && <span className="ok-t">✓ {found.code} {t("applied")}</span>}
            {!!availCodes.length && <div style={{ marginTop: 4 }}>{availCodes.slice(0, 6).map((x) => (
              <button key={x.id} className={"btn s" + (codeUp === x.code ? " on" : "")} style={{ marginRight: 4, marginBottom: 4 }} onClick={() => setCode(x.code ?? "")}>{x.code}</button>))}</div>}
          </label>
          <label><span className="mu-t">{t("Payment method")}</span>
            <div className="row" role="radiogroup" aria-label={t("Payment method")}>
              {METHODS.map((m) => (
                <button key={m.id} role="radio" aria-checked={method === m.id} className={"btn s" + (method === m.id ? " on" : "")} onClick={() => setMethod(m.id)}>{t(m.label)}</button>))}
            </div></label>
          {method === "mobile" && <p className="mu-t">{t("Collect payment via bKash / Nagad / Rocket, then complete the sale.")}</p>}
          {method === "cash" && (
            <label><span className="mu-t">{t("Cash tendered")} ({cur})</span>
              <input type="number" min={0} step="any" value={tendered} onChange={(e) => setTendered(e.target.value)} />
              {tendered !== "" && <span className={change >= 0 ? "ok-t" : "er-t"}>{t("Change due:")} {money(Math.max(0, change), cur)}</span>}
            </label>)}
          <Breakdown c={c} cur={cur} />
          <button className="btn" style={{ width: "100%" }} disabled={!cart.length} onClick={charge}>{t("Charge")} {money(c.total, cur)}</button>
          {err && <p className="er-t">{err}</p>}{msg && <p className="ok-t">{msg}</p>}</Card>
      </div>
      {receipt && (
        <Modal open title={`${t("Receipt")} #${receipt.order.id}`} onClose={() => setReceipt(null)}
          footer={<><button className="btn s" onClick={() => window.print()}>{t("Print receipt")}</button>{" "}<button className="btn s" onClick={() => setReceipt(null)}>{t("New sale")}</button></>}>
          <div className="print-doc" style={{ padding: 8 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <b>{settings.storeName}</b>
              <div className="mu-t">{new Date(receipt.order.createdAt).toLocaleString()}</div>
              <div className="mu-t">{t("Order")} #{receipt.order.id} · {t(METHODS.find((m) => m.id === receipt.method)?.label ?? "")}</div>
            </div>
            <table className="ptable"><tbody>
              {receipt.order.items.map((i, k) => { const r = idx.get(i.variantId); return (
                <tr key={k}><td>{r ? `${r.p.title} (${r.v.name})` : "Item"} × {i.qty}</td>
                  <td style={{ textAlign: "right" }}>{money((r?.v.price ?? 0) * i.qty, cur)}</td></tr>); })}
            </tbody></table>
            <Breakdown c={calc(receipt.order.items, priceMap(products), undefined, receipt.order.code, settings, discounts, taxOpts(products))} cur={cur} />
            {receipt.method === "cash" && (
              <div className="between"><span className="mu-t">{t("Tendered")}</span><span>{money(receipt.tendered, cur)}</span></div>)}
            {receipt.method === "cash" && (
              <div className="between"><b>{t("Change")}</b><b>{money(receipt.change, cur)}</b></div>)}
            <p className="mu-t" style={{ textAlign: "center", marginTop: 12 }}>{t("Thank you for shopping with us!")}</p>
          </div>
        </Modal>
      )}
    </>
  );
}

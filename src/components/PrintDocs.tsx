import { useEffect } from "react";
import { useT } from "../lib/fx";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { variantIndex } from "../lib/shop";
import type { Discount, Order, Product, Settings } from "../types";

/** Print-friendly invoice / packing slip / shipping label. Renders alone and triggers window.print() on mount. */
export default function PrintDoc({ kind, order, products, settings, discounts, onDone }: {
  kind: "invoice" | "packing" | "label"; order: Order; products: Product[]; settings: Settings; discounts: Discount[]; onDone(): void;
}) {
  const t = useT();
  const idx = variantIndex(products);
  const c = calc(order.items, priceMap(products), order.zoneId, order.code, settings, discounts, taxOpts(products));
  const cur = settings.currency;
  useEffect(() => {
    const done = () => onDone();
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 50);
    return () => { window.removeEventListener("afterprint", done); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (kind === "label") {
    return (
      <div className="print-doc">
        <h1 style={{ margin: "0 0 4px" }}>{settings.storeName}</h1>
        <p className="mu-t">{t("Shipping label — order")} #{order.id}</p>
        <div className="two" style={{ margin: "16px 0" }}>
          <div><b>{t("From")}</b><p className="mu-t">{settings.storeName}</p></div>
          <div><b>{t("To")}</b><p className="mu-t">{order.customerId === "walkin" ? t("Walk-in customer") : `Customer ${order.customerId}`}</p></div>
        </div>
        <table className="ptable">
          <thead><tr><th>{t("Item")}</th><th style={{ textAlign: "right" }}>{t("Qty")}</th></tr></thead>
          <tbody>
            {order.items.map((i) => { const r = idx.get(i.variantId); return (
              <tr key={i.variantId}><td>{r ? `${r.p.title} — ${r.v.name}` : t("Deleted item")}</td><td style={{ textAlign: "right" }}>{i.qty}</td></tr>); })}
          </tbody>
        </table>
        {order.tracking && (<>
          <p><b>{t("Carrier:")}</b> {order.tracking.carrier}</p>
          <p style={{ fontSize: 28, letterSpacing: 4, fontFamily: "monospace", margin: "8px 0" }}>{order.tracking.number}</p>
        </>)}
      </div>
    );
  }
  return (
    <div className="print-doc">
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 4px" }}>{settings.storeName}</h1>
          <p className="mu-t" style={{ margin: 0 }}>{kind === "invoice" ? t("Invoice") : t("Packing slip")} #{order.id}</p>
        </div>
        <p className="mu-t" style={{ margin: 0 }}>{new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <table className="ptable">
        <thead><tr><th>{t("Item")}</th><th>SKU</th><th style={{ textAlign: "right" }}>{t("Qty")}</th>{kind === "invoice" && <><th style={{ textAlign: "right" }}>{t("Price")}</th><th style={{ textAlign: "right" }}>{t("Total")}</th></>}</tr></thead>
        <tbody>
          {order.items.map((i) => {
            const r = idx.get(i.variantId);
            return (
              <tr key={i.variantId}>
                <td>{r ? `${r.p.title} — ${r.v.name}` : t("Deleted item")}</td>
                <td className="mu-t">{r?.v.sku || "—"}</td>
                <td style={{ textAlign: "right" }}>{i.qty}</td>
                {kind === "invoice" && <>
                  <td style={{ textAlign: "right" }}>{money(r?.v.price ?? 0, cur)}</td>
                  <td style={{ textAlign: "right" }}>{money((r?.v.price ?? 0) * i.qty, cur)}</td>
                </>}
              </tr>);
          })}
        </tbody>
      </table>
      {kind === "invoice" && (
        <table className="ptotals">
          <tbody>
            <tr><td>{t("Subtotal")}</td><td style={{ textAlign: "right" }}>{money(c.sub, cur)}</td></tr>
            {c.disc > 0 && <tr><td>{t("Discount")}</td><td style={{ textAlign: "right" }}>−{money(c.disc, cur)}</td></tr>}
            <tr><td>{t("Shipping")}</td><td style={{ textAlign: "right" }}>{money(c.ship, cur)}</td></tr>
            {c.tax > 0 && <tr><td>{t("Tax")}</td><td style={{ textAlign: "right" }}>{money(c.tax, cur)}</td></tr>}
            <tr><td><b>{t("Total")}</b></td><td style={{ textAlign: "right" }}><b>{money(c.total, cur)}</b></td></tr>
            {order.refunded > 0 && <tr><td>{t("Refunded")}</td><td style={{ textAlign: "right" }}>{money(order.refunded, cur)}</td></tr>}
          </tbody>
        </table>
      )}
      <p className="mu-t">{t("Payment:")} {t(order.pay)} · {t("Fulfillment:")} {t(order.ful)}</p>
    </div>
  );
}

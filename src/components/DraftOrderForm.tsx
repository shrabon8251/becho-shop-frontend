import { useState } from "react";
import { calc, taxOpts } from "../lib/calc";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { PageHeader } from "./polaris";
import { useT } from "../lib/fx";
import { Card } from "./ui";
import type { Customer, Discount, DraftOrder, Product, Settings } from "../types";

export default function DraftOrderForm({ initial, customers, products, settings, discounts, onSave, onBack }: {
  initial: DraftOrder; customers: Customer[]; products: Product[]; settings: Settings; discounts: Discount[];
  onSave(d: DraftOrder): void; onBack(): void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<DraftOrder>(initial);
  const [q, setQ] = useState("");
  const vmap = new Map(products.flatMap((p) => p.variants.map((v) => [v.id, { p, v }] as const)));
  const c = calc(draft.items, priceMap(products), draft.zoneId, draft.code, settings, discounts, taxOpts(products));
  const cur = settings.currency;

  const results = q.trim()
    ? products.flatMap((p) => p.variants.map((v) => ({ p, v })))
      .filter(({ p, v }) => !draft.items.some((i) => i.variantId === v.id) && `${p.title} ${v.name} ${v.sku}`.toLowerCase().includes(q.trim().toLowerCase()))
      .slice(0, 8)
    : [];
  const setQty = (variantId: string, qty: number) => setDraft((d) => ({
    ...d, items: qty <= 0 ? d.items.filter((i) => i.variantId !== variantId) : d.items.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
  }));

  return (
    <>
      <PageHeader title={draft.id ? t("Draft order") : t("New draft order")} back={onBack}
        actions={<button className="btn" disabled={!draft.items.length} onClick={() => onSave(draft)}>{t("Save draft")}</button>} />
      <div className="two">
        <div>
          <Card><b>{t("Items")} ({draft.items.length})</b>
            {draft.items.map((i) => {
              const e = vmap.get(i.variantId);
              return (
                <div className="between" key={i.variantId} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
                  <span className="prod">{e?.p.images[0] ? <img className="tn" src={e.p.images[0]} alt="" /> : <span className="tn ph0" />}{e ? `${e.p.title} — ${e.v.name}` : i.variantId}</span>
                  <span className="row" style={{ alignItems: "center" }}>
                    <input type="number" min={0} aria-label={t("Quantity")} value={i.qty} style={{ width: 70 }} onChange={(e2) => setQty(i.variantId, +e2.target.value)} />
                    <b>{money((e?.v.price ?? 0) * i.qty, cur)}</b>
                    <button className="btn s" onClick={() => setQty(i.variantId, 0)}>{t("Remove")}</button>
                  </span>
                </div>);
            })}
            <label style={{ marginTop: 12 }}><span className="mu-t">{t("Add items")}</span>
              <input type="search" placeholder={t("Search variants…")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
            {results.map(({ p, v }) => (
              <div className="between" key={v.id} style={{ padding: "4px 0" }}>
                <span className="prod">{p.images[0] ? <img className="tn" src={p.images[0]} alt="" /> : <span className="tn ph0" />}{p.title} — {v.name} <span className="mu-t">({v.stock} {t("in stock")})</span></span>
                <button className="btn s" onClick={() => { setDraft((d) => ({ ...d, items: [...d.items, { variantId: v.id, qty: 1 }] })); setQ(""); }}>{t("Add")}</button>
              </div>))}
          </Card>
          <Card><label><b>{t("Note")}</b><textarea value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={t("Internal note…")} rows={2} /></label></Card>
        </div>
        <div>
          <Card><label><b>{t("Customer")}</b>
            <select value={draft.customerId ?? ""} onChange={(e) => setDraft({ ...draft, customerId: e.target.value || undefined })}>
              <option value="">{t("Walk-in")}</option>
              {customers.map((c2) => <option key={c2.id} value={c2.id}>{c2.name} — {c2.email}</option>)}
            </select></label>
            <label><b>{t("Discount code")}</b><input value={draft.code ?? ""} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder={t("Optional")} /></label>
            <label><b>{t("Shipping zone")}</b>
              <select value={draft.zoneId ?? ""} onChange={(e) => setDraft({ ...draft, zoneId: e.target.value || undefined })}>
                <option value="">{t("No shipping")}</option>
                {settings.zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {money(z.rate, cur)}</option>)}
              </select></label>
          </Card>
          <Card><b>{t("Total")}</b>
            <div className="between mu-t"><span>{t("Subtotal")}</span><span>{money(c.sub, cur)}</span></div>
            {c.disc > 0 && <div className="between mu-t"><span>{t("Discount")}</span><span>−{money(c.disc, cur)}</span></div>}
            <div className="between mu-t"><span>{t("Shipping")}</span><span>{money(c.ship, cur)}</span></div>
            {c.tax > 0 && <div className="between mu-t"><span>{t("Tax")}</span><span>{money(c.tax, cur)}</span></div>}
            <div className="between"><b>{t("Total")}</b><b>{money(c.total, cur)}</b></div>
          </Card>
        </div>
      </div>
    </>
  );
}

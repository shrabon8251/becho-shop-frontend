import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { Breakdown } from "../../components/Breakdown";
import { calc, taxOpts } from "../../lib/calc";
import { findCode } from "../../lib/discounts";
import { useFx, useT } from "../../lib/fx";
import { priceMap } from "../../lib/orderTotal";
import { applicableRates, availableZones, cartWeight, rateCost } from "../../lib/shipping";
import { shopStore, useShopData, variantIndex } from "../../lib/shop";
import { useCart } from "../../store/cart";
import { useShopper } from "../../store/shopper";
import { Loading } from "../../components/polaris";
import { PayGateway, PayMethodPicker } from "../../components/PaymentSheet";
import { manualNumber, paymentsConfig } from "../../lib/payments";
import { trackEvent } from "../../lib/tracking";
import { dispatchNotifications } from "../../lib/notify";
import { toast } from "../../components/polaris";
import type { LoyaltySettings, TrackedOrder } from "../../types";

const LAST_ORDER_KEY = "shop-last-order";

export function Done() {
  const { id } = useParams();
  const t = useT();
  const [o, setO] = useState<TrackedOrder | null>(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? "{}");
        if (saved.id === Number(id) && saved.email) {
          const found = await api.tracking.lookup(shopStore(), Number(id), saved.email);
          if (live) setO(found);
        }
      } catch { /* confirmation-only view */ }
      if (live) setTried(true);
      try {
        const saved2 = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? "{}");
        if (saved2.id === Number(id) && saved2.total != null) {
          trackEvent("Purchase", { value: saved2.total, currency: saved2.currency });
          saved2.total = null;
          localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(saved2));
        }
      } catch { /* tracking is best-effort */ }
    })();
    return () => { live = false; };
  }, [id]);
  const steps: [string, boolean][] = o ? [
    [t("Order placed"), true],
    [t("Payment received"), o.pay === "Paid" || o.pay === "Refunded"],
    [t("Fulfilled"), o.ful === "Fulfilled"],
  ] : [];
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3>{t("Thank you!")} 🎉</h3>
      <p>{t("Your order")} <b>#{id}</b> {t("has been placed.")}</p>
      {o && (
        <div style={{ marginTop: 12 }}>
          <b>{t("Order status")}</b>
          {steps.map(([label, done]) => <div key={label} className={done ? "ok-t" : "mu-t"}>{done ? "✓" : "○"} {label}</div>)}
          <ul>{o.items.map((i, k) => <li key={k}>{i.title} ({i.variant}) × {i.qty}</li>)}</ul>
          <p className="mu-t">{t("We'll email you updates as your order ships.")} <Link to="/shop/track">{t("Track order")}</Link></p>
        </div>
      )}
      {tried && !o && <p className="mu-t"><Link to="/shop/track">{t("Track your order")}</Link> {t("with your order number and email.")}</p>}
      <Link to="/shop" className="btn">{t("Continue shopping")}</Link>
    </div>
  );
}

export default function Checkout() {
  const d = useShopData();
  const fx = useFx(d?.settings);
  const t = useT();
  const { items, code, clear } = useCart();
  const nav = useNavigate();
  const shopper = useShopper((s) => s.customer);
  const [f, setF] = useState({ name: shopper?.name ?? "", email: shopper?.email ?? "", phone: shopper?.phone ?? "", zone: "", pay: "" });
  const [rateId, setRateId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState<{ code: string; balance: number } | null>(null);
  const [giftIn, setGiftIn] = useState("");
  const [giftErr, setGiftErr] = useState("");
  const [note, setNote] = useState("");
  const [gw, setGw] = useState(false);
  useEffect(() => {
    if (d && items.length > 0) {
      const prices = new Map(d.products.flatMap((x) => x.variants.map((v) => [v.id, v.price] as const)));
      const value = items.reduce((a, i) => a + (prices.get(i.variantId) ?? 0) * i.qty, 0);
      trackEvent("InitiateCheckout", { value, currency: d.settings.currency, num_items: items.reduce((a, i) => a + i.qty, 0) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);
  const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
  const [redeem, setRedeem] = useState(false);
  const [useCredit, setUseCredit] = useState(false);
  const setShopper = useShopper((s) => s.set);
  useEffect(() => { api.loyalty.get(shopStore()).then(setLoyalty).catch(() => { /* loyalty off */ }); }, []);
  if (!d) return <Loading />;
  const idx = variantIndex(d.products);
  const lines = items.filter((i) => idx.has(i.variantId));
  if (!lines.length) return <p className="mu-t">{t("Your cart is empty")}. <Link to="/shop">{t("Continue shopping")}</Link></p>;
  const weights = new Map(d.products.flatMap((p) => p.variants.map((v) => [v.id, v.weight ?? 0] as const)));
  const zones = availableZones(d.settings.zones, d.profiles, lines, d.products);
  const zone = zones.find((z) => z.id === f.zone);
  const validCode = findCode(d.discounts, code)?.code;
  const c = calc(lines, priceMap(d.products), f.zone || undefined, validCode, d.settings, d.discounts, { rateId: rateId || undefined, weights, ...taxOpts(d.products) });
  const weightKg = cartWeight(lines, weights);
  const rates = zone ? applicableRates(zone, c.sub - c.disc, weightKg).sort((a, b) => rateCost(a, weightKg) - rateCost(b, weightKg)) : [];
  const giftUsed = gift ? Math.min(gift.balance, c.total) : 0;
  const pts = shopper?.points ?? 0;
  const redeemAvail = loyalty?.enabled && loyalty.redeemPoints > 0 && loyalty.redeemValue > 0
    ? Math.floor(pts / loyalty.redeemPoints) * loyalty.redeemValue : 0;
  const redeemWanted = redeem ? Math.min(redeemAvail, c.total) : 0;
  const ptsSpent = redeemWanted > 0 && loyalty ? Math.ceil(redeemWanted / loyalty.redeemValue) * loyalty.redeemPoints : 0;
  const creditAvail = Math.max(0, shopper?.credit ?? 0);
  const creditWanted = useCredit ? Math.min(creditAvail, c.total - redeemWanted) : 0;
  const grand = Math.max(0, c.total - redeemWanted - creditWanted);
  const pickZone = (zoneId: string) => { setF({ ...f, zone: zoneId }); setRateId(""); };
  const orderInput = (paymentMethod: string, giftCode?: string, trxId?: string) => ({
    customer: { name: f.name, email: f.email, phone: f.phone.trim() || undefined },
    items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
    zoneId: f.zone, rateId: rateId || undefined, code: validCode, paymentMethod, giftCode,
    note: note.trim() || undefined, trxId,
    loyaltyPoints: ptsSpent > 0 ? ptsSpent : undefined,
    customerId: shopper?.id ? Number(shopper.id) : undefined,
  });
  const afterOrder = async (orderId: number) => {
    try { localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: orderId, email: f.email, total: grand, currency: d.settings.currency })); } catch { /* ignore */ }
    // Demo notifications: show what the backend would send via the merchant's channels
    try {
      const vars = { name: f.name, order_id: "#" + orderId, tracking_link: "", store: d.settings.storeName, amount: fx.fmt(grand) };
      const sent = [
        ...dispatchNotifications(d.settings, "order_placed", vars, { email: f.email, phone: f.phone.trim() || undefined }),
        ...dispatchNotifications(d.settings, "new_order", vars, { email: d.settings.notifications?.newOrderEmail }),
      ];
      if (sent.length) toast("📧📱 " + t("Notifications sent") + " (" + sent.map((x) => x.channel).join(" + ") + ", demo)");
    } catch { /* notifications are best-effort */ }
    // Loyalty points are now handled atomically by the backend in OrderService.create().
    // Credit deduction still happens here (best-effort).
    if (shopper && creditWanted > 0) {
      try {
        const updated = await api.customers.save(shopStore(), { ...shopper, credit: Math.max(0, (shopper.credit ?? 0) - creditWanted) });
        setShopper(updated);
      } catch { /* credit is best-effort */ }
    }
  };
  const placeOrder = async (paymentMethod: string, giftCode?: string, trxId?: string) => {
    // Public checkout endpoint (no auth, rate-limited, prices validated server-side).
    const o = await api.checkout.createOrder(shopStore(), orderInput(paymentMethod, giftCode, trxId));
    await afterOrder(o.id);
    clear(); nav(`/shop/done/${o.id}`);
  };
  /** SSLCommerz: create a pending order, secure the gateway intent, then redirect. */
  const sslcommerzFlow = async () => {
    const o = await api.checkout.createOrder(shopStore(), orderInput("sslcommerz", gift?.code));
    // Secure the intent BEFORE any side effects. afterOrder (loyalty/credit/
    // notifications) runs only after the gateway confirms payment — see
    // PaymentSuccess. If the intent fails here, nothing was deducted and the
    // shopper can retry safely (no double deduction).
    const intent = await api.payments.createIntent(shopStore(), o.id, "sslcommerz");
    try {
      sessionStorage.setItem("becho-pending-payment", JSON.stringify({
        storeId: shopStore(), orderId: o.id, email: f.email,
        // Deferred post-payment actions, executed by PaymentSuccess on "paid".
        pendingAfterOrder: {
          name: f.name, phone: f.phone.trim() || undefined,
          total: grand, currency: d.settings.currency, storeName: d.settings.storeName,
          ptsSpent, creditWanted,
          earnPer: loyalty?.enabled ? loyalty.earnPer : 0,
          earnPoints: loyalty?.enabled ? loyalty.earnPoints : 0,
          shopperId: shopper?.id,
        },
      }));
    } catch { /* ignore */ }
    // Full redirect: the gateway (or the demo page) brings the shopper back to /payment/success.
    // The cart is cleared on the success page so a failed payment keeps the cart for retry.
    window.location.href = intent.redirectUrl;
  };
  const place = async () => {
    if (!f.name.trim() || !f.email.includes("@")) return setErr(t("Enter your name and a valid email"));
    if (d.settings.checkout?.guestCheckout === false && !shopper) return setErr(t("Please log in to complete checkout"));
    if (!f.zone) return setErr(t("Choose a shipping zone"));
    if (!f.pay && giftUsed + redeemWanted + creditWanted < c.total - 0.005) return setErr(t("Choose a payment method"));
    setBusy(true); setErr("");
    const pay = f.pay || "cod";
    if (pay === "cod") { try { await placeOrder("cod", gift?.code); } catch (e) { setErr((e as Error).message); setBusy(false); } }
    else if (pay === "sslcommerz") { try { await sslcommerzFlow(); } catch (e) { setErr((e as Error).message); setBusy(false); } }
    else { setGw(true); setBusy(false); }
  };
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3>{t("Checkout")}</h3>
      <input placeholder={t("Name")} aria-label={t("Name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input placeholder={t("Email")} aria-label={t("Email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input placeholder={t("Phone (for SMS updates)")} aria-label={t("Phone")} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <select value={f.zone} aria-label={t("Shipping zone")} onChange={(e) => pickZone(e.target.value)}><option value="">{t("Shipping zone")}</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
      {zone && rates.length > 1 && (
        <div role="radiogroup" aria-label={t("Shipping method")}>
          {rates.map((r) => (
            <label className="check" key={r.id}>
              <input type="radio" name="rate" checked={(rateId || rates[0].id) === r.id} onChange={() => setRateId(r.id)} />
              {r.name}{r.carrier ? ` · ${r.carrier}` : ""} — {fx.fmt(rateCost(r, weightKg))}
            </label>))}
        </div>)}
      {zone && rates.length === 1 && (
        <p className="mu-t">{rates[0].name}{rates[0].carrier ? ` · ${rates[0].carrier}` : ""} — {fx.fmt(rateCost(rates[0], weightKg))}</p>)}
      <PayMethodPicker pay={d.settings.pay} value={f.pay} onChange={(id) => setF({ ...f, pay: id })} />
      {gw && <PayGateway providerId={f.pay} amount={grand} fmt={fx.fmt} testMode={paymentsConfig(d.settings.pay).testMode} manualNumber={manualNumber(d.settings.pay, f.pay)} onClose={() => setGw(false)} onDone={(trxId) => { setGw(false); setBusy(true); placeOrder(f.pay, gift?.code, trxId).catch((e) => { setErr((e as Error).message); setBusy(false); }); }} />}
      {fx.cur !== d.settings.currency && <p className="mu-t">{t("Prices shown in")} {fx.cur}. {t("You will be charged in")} {d.settings.currency}.</p>}
      <div className="row"><input placeholder={t("Gift card code")} aria-label={t("Gift card code")} value={giftIn} onChange={(e) => setGiftIn(e.target.value.toUpperCase())} />
        <button className="btn s" onClick={async () => { try { const g = await api.giftCards.check(shopStore(), giftIn); setGift({ code: giftIn.trim(), balance: g.balance }); setGiftErr(""); } catch (e) { setGift(null); setGiftErr((e as Error).message); } }}>{t("Apply")}</button></div>
      {giftErr && <p className="er-t">{giftErr}</p>}
      {d.settings.checkout?.orderNotes && <textarea placeholder={t("Order notes (optional)")} aria-label={t("Order notes")} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />}
      {loyalty?.enabled && shopper && redeemAvail > 0 && (
        <label className="check"><input type="checkbox" checked={redeem} onChange={(e) => setRedeem(e.target.checked)} />
          {t("Redeem {p} points").replace("{p}", String(ptsSpent || Math.floor(pts / loyalty.redeemPoints) * loyalty.redeemPoints))} (−{fx.fmt(redeemWanted || Math.min(redeemAvail, c.total))})</label>)}
      {shopper && creditAvail > 0 && (
        <label className="check"><input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
          {t("Use store credit")} (−{fx.fmt(creditWanted || Math.min(creditAvail, c.total))})</label>)}
      <Breakdown c={c} cur={fx.cur} fmt={fx.fmt} gift={giftUsed} />
      {(redeemWanted > 0 || creditWanted > 0) && (
        <div style={{ margin: "10px 0" }}>
          {redeemWanted > 0 && <div className="between"><span className="mu-t">{t("Loyalty points")}</span><span>−{fx.fmt(redeemWanted)}</span></div>}
          {creditWanted > 0 && <div className="between"><span className="mu-t">{t("Store credit")}</span><span>−{fx.fmt(creditWanted)}</span></div>}
          <div className="between" style={{ fontWeight: 700 }}><span>{t("Total")}</span><span>{fx.fmt(grand)}</span></div>
        </div>)}
      {err && <p className="er-t">{err}</p>}
      <button className="btn" disabled={busy} onClick={place}>{t("Place order")}</button>
    </div>
  );
}

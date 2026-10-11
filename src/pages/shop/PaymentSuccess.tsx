import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { useCart } from "../../store/cart";
import { useShopper } from "../../store/shopper";
import { dispatchNotifications } from "../../lib/notify";
import { money } from "../../lib/money";
import { useT } from "../../lib/fx";

interface PendingAfterOrder {
  name: string; phone?: string;
  total: number; currency: string; storeName: string;
  ptsSpent: number; creditWanted: number;
  earnPer: number; earnPoints: number;
  shopperId?: string;
}
interface PendingPayment {
  storeId?: string; orderId?: number; email?: string;
  pendingAfterOrder?: PendingAfterOrder;
}

/**
 * Shopper landing page after a successful gateway payment.
 * The server-to-server callback is what actually marks the order paid;
 * this page polls the (public) order tracking endpoint a few times so the
 * confirmation reflects the real state, then clears the cart.
 */
export default function PaymentSuccess() {
  const t = useT();
  const [q] = useSearchParams();
  const orderId = Number(q.get("order"));
  const clear = useCart((s) => s.clear);
  const shopper = useShopper((s) => s.customer);
  const setShopper = useShopper((s) => s.set);
  const [status, setStatus] = useState<"checking" | "paid" | "unknown">("checking");

  /**
   * Post-payment side effects for the SSLCommerz flow: order confirmation
   * record, notifications, loyalty/credit adjustments. These run ONLY after
   * the gateway confirms payment (never before — see Checkout.sslcommerzFlow).
   */
  const runPendingAfterOrder = async (saved: PendingPayment | null) => {
    const p = saved?.pendingAfterOrder;
    if (!p || !saved?.orderId || !saved?.storeId || !saved?.email) return;
    const oid = saved.orderId;
    try { localStorage.setItem("shop-last-order", JSON.stringify({ id: oid, email: saved.email, total: p.total, currency: p.currency })); } catch { /* ignore */ }
    try {
      const settings = await api.settings.get(saved.storeId).catch(() => null);
      if (settings) {
        const vars = { name: p.name, order_id: "#" + oid, tracking_link: "", store: p.storeName, amount: money(p.total, p.currency) };
        dispatchNotifications(settings, "order_placed", vars, { email: saved.email, phone: p.phone });
        dispatchNotifications(settings, "new_order", vars, { email: settings.notifications?.newOrderEmail });
      }
    } catch { /* notifications are best-effort */ }
    if (p.shopperId && shopper && shopper.id === p.shopperId) {
      try {
        let updated = shopper;
        if (p.ptsSpent > 0) updated = await api.loyalty.adjust(saved.storeId, updated.id, -p.ptsSpent, `Redeemed on order #${oid}`);
        if (p.creditWanted > 0) updated = await api.customers.save(saved.storeId, { ...updated, credit: Math.max(0, (updated.credit ?? 0) - p.creditWanted) });
        if (p.earnPer > 0) {
          const earned = Math.floor(p.total / p.earnPer) * p.earnPoints;
          if (earned > 0) updated = await api.loyalty.adjust(saved.storeId, updated.id, earned, `Earned on order #${oid}`);
        }
        setShopper(updated);
      } catch { /* loyalty/credit are best-effort */ }
    }
  };

  useEffect(() => {
    let alive = true;
    let tries = 0;
    let saved: PendingPayment | null = null;
    try { saved = JSON.parse(sessionStorage.getItem("becho-pending-payment") || "null"); } catch { /* ignore */ }
    const poll = async () => {
      if (!alive) return;
      try {
        if (saved?.storeId && saved?.email && orderId) {
          const o = await api.tracking.lookup(saved.storeId, orderId, saved.email);
          if (o.pay === "Paid") {
            if (alive) {
              await runPendingAfterOrder(saved);
              try { sessionStorage.removeItem("becho-pending-payment"); } catch { /* ignore */ }
              setStatus("paid"); clear();
            }
            return;
          }
        }
      } catch { /* keep polling — the callback may still be in flight */ }
      if (++tries < 6) setTimeout(poll, 2000);
      else if (alive) setStatus("unknown");
    };
    if (!orderId) setStatus("unknown");
    else poll();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gw-wrap">
      <div className="gw" role="dialog" aria-label={t("Payment result")}>
        <div className="gw-body" style={{ padding: 36, textAlign: "center" }}>
          {status === "checking" && (<><div className="gw-spin" /><p className="mu-t">{t("Confirming your payment...")}</p></>)}
          {status === "paid" && (<div className="gw-ok">
            <div className="tick">✓</div>
            <b>{t("Payment successful!")}</b>
            <p className="mu-t">{t("Order")} #{orderId} {t("is confirmed. We've sent the details to your email.")}</p>
          </div>)}
          {status === "unknown" && (<>
            <b>{t("Payment received")}</b>
            <p className="mu-t">{t("We're confirming order")} #{orderId || ""} {t("— this usually takes a moment. You can also track it below.")}</p>
          </>)}
          {status !== "checking" && (
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <Link className="btn s" to="/shop/track">{t("Track order")}</Link>
              <Link className="btn s plain" to="/shop">{t("Continue shopping")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

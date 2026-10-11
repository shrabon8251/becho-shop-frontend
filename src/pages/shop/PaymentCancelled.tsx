import { Link, useSearchParams } from "react-router-dom";
import { useT } from "../../lib/fx";

export default function PaymentCancelled() {
  const t = useT();
  const [q] = useSearchParams();
  const orderId = q.get("order");
  return (
    <div className="gw-wrap">
      <div className="gw" role="dialog" aria-label={t("Payment cancelled")}>
        <div className="gw-body" style={{ padding: 36, textAlign: "center" }}>
          <b>{t("Payment cancelled")}</b>
          <p className="mu-t">
            {t("You cancelled the payment.")}{" "}
            {orderId ? <>{t("Order")} #{orderId} {t("is still pending and your cart is saved.")}</> : t("Your cart is saved.")}
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <Link className="btn s" to="/shop/checkout">{t("Back to checkout")}</Link>
            <Link className="btn s plain" to="/shop">{t("Continue shopping")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

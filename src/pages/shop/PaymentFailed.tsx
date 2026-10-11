import { Link, useSearchParams } from "react-router-dom";
import { useT } from "../../lib/fx";

export default function PaymentFailed() {
  const t = useT();
  const [q] = useSearchParams();
  const orderId = q.get("order");
  return (
    <div className="gw-wrap">
      <div className="gw" role="dialog" aria-label={t("Payment failed")}>
        <div className="gw-body" style={{ padding: 36, textAlign: "center" }}>
          <div className="tick" style={{ background: "#DC2626" }}>!</div>
          <b>{t("Payment failed")}</b>
          <p className="mu-t">
            {t("Your payment didn't go through.")}{" "}
            {orderId ? <>{t("Order")} #{orderId} {t("is still pending — no money was charged.")}</> : t("No money was charged.")}
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <Link className="btn s" to="/shop/checkout">{t("Try again")}</Link>
            <Link className="btn s plain" to="/shop">{t("Continue shopping")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

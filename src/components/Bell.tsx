import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Product } from "../types";
export function Bell() {
  const t = useT();
  const user = useAuth((s) => s.user);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const storeId = user?.storeId;
  const canStock = user?.staffRole !== "Support";
  const { data } = useLoad(async () => {
    if (!storeId) return { orders: [], products: [] as Product[] };
    const [orders, products] = await Promise.all([api.orders.list(storeId), canStock ? api.products.list(storeId) : Promise.resolve<Product[]>([])]);
    return { orders, products };
  }, [storeId, pathname]);
  const items: { text: string; to: string }[] = [];
  if (data) {
    const toFulfill = data.orders.filter((o) => o.ful === "Unfulfilled" && o.pay !== "Refunded" && o.pay !== "Cancelled").length;
    const pending = data.orders.filter((o) => o.pay === "Pending").length;
    if (toFulfill) items.push({ text: `${toFulfill} ${t("order(s) waiting to be fulfilled")}`, to: "/admin/orders" });
    if (pending) items.push({ text: `${pending} ${t("order(s) with pending payment")}`, to: "/admin/orders" });
    for (const p of data.products) for (const v of p.variants) if (v.stock < 5) items.push({ text: `${p.title} (${v.name}) ${t("low stock:")} ${v.stock}`, to: "/admin/inventory" });
  }
  return (
    <div style={{ textAlign: "right", marginBottom: 8 }}>
      <button className="btn s" onClick={() => setOpen(!open)} aria-label={t("Notifications")}>{t("Alerts")} ({items.length})</button>
      {open && <div className="card" style={{ textAlign: "left", marginTop: 8 }}><b>{t("Notifications")}</b>
        {!items.length && <p className="mu-t">{t("All caught up.")}</p>}
        {items.map((n, i) => <div key={i} className="between" style={{ padding: "4px 0" }}><span>{n.text}</span><Link to={n.to} className="btn s" onClick={() => setOpen(false)}>{t("View")}</Link></div>)}</div>}
    </div>
  );
}

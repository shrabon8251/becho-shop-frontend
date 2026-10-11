import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFx, useT } from "../lib/fx";
import { type useShopData, variantIndex } from "../lib/shop";
import { useCart } from "../store/cart";
export function CartDrawer({ d }: { d: NonNullable<ReturnType<typeof useShopData>> }) {
  const { items, open, setOpen, setQty, remove } = useCart();
  const fx = useFx(d.settings), t = useT(), { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, setOpen]);
  if (!open) return null;
  const idx = variantIndex(d.products);
  const lines = items.filter((i) => idx.has(i.variantId));
  const sub = lines.reduce((a, i) => a + idx.get(i.variantId)!.v.price * i.qty, 0);
  return (
    <div className="drawer-bg" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t("Cart")}>
        <div className="drawer-h"><b>{t("Cart")}</b><button className="dclose" aria-label="Close cart" onClick={() => setOpen(false)}>✕</button></div>
        {d.settings.freeOver > 0 && lines.length > 0 && (
          <div className="shipbar">
            {sub >= d.settings.freeOver ? <p>🎉 {t("You've unlocked FREE shipping!")}</p> : (
              <p>{t("Add")} <b>{fx.fmt(d.settings.freeOver - sub)}</b> {t("more for FREE shipping")}</p>)}
            <div className="shipbar-t"><div style={{ width: Math.min(100, (sub / d.settings.freeOver) * 100) + "%" }} /></div>
          </div>)}
        {lines.length === 0 ? (
          <div className="drawer-b empty"><p>{t("Your cart is empty")}</p><Link to="/shop/products" className="btn" onClick={() => setOpen(false)}>{t("Continue shopping")}</Link></div>
        ) : (<>
          <div className="drawer-b">{lines.map((i) => { const { p, v } = idx.get(i.variantId)!; return (
            <div className="dline" key={v.id}>
              {p.images[0] ? <img loading="lazy" src={p.images[0]} alt="" /> : <div className="ph dph">{p.title[0]}</div>}
              <div style={{ flex: 1 }}>
                <Link to={`/shop/product/${p.id}`}>{p.title}</Link>
                {p.variants.length > 1 && <div className="mu-t">{v.name}</div>}
                <div className="mu-t">{fx.fmt(v.price)}</div>
                <div className="qty sm"><button aria-label="Decrease quantity" onClick={() => setQty(v.id, i.qty - 1, v.stock)}>−</button><span>{i.qty}</span><button aria-label="Increase quantity" onClick={() => setQty(v.id, i.qty + 1, v.stock)}>+</button>
                  <button className="link" onClick={() => remove(v.id)}>{t("Remove")}</button></div>
              </div>
              <b>{fx.fmt(v.price * i.qty)}</b>
            </div>); })}
          </div>
          <div className="drawer-f">
            <div className="between"><b>{t("Subtotal")}</b><b>{fx.fmt(sub)}</b></div>
            <p className="mu-t">{t("Shipping and taxes are calculated at checkout.")}</p>
            <Link to="/shop/checkout" className="btn wide">{t("Checkout")}</Link>
            <Link to="/shop/cart" className="btn s wide">{t("View cart")}</Link>
          </div>
        </>)}
      </aside>
    </div>
  );
}

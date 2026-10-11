import { Link } from "react-router-dom";
import { Breakdown } from "../../components/Breakdown";
import { calc } from "../../lib/calc";
import { useFx, useT } from "../../lib/fx";
import { priceMap } from "../../lib/orderTotal";
import { useShopData, variantIndex } from "../../lib/shop";
import { useCart } from "../../store/cart";
import { Loading } from "../../components/polaris";
export default function CartPage() {
  const d = useShopData();
  const fx = useFx(d?.settings);
  const t = useT();
  const { items, code, setQty, remove, setCode } = useCart();
  if (!d) return <Loading />;
  const idx = variantIndex(d.products);
  const lines = items.filter((i) => idx.has(i.variantId));
  if (!lines.length) return <p className="mu-t">{t("Your cart is empty")}. <Link to="/shop">{t("Continue shopping")}</Link></p>;
  const c = calc(lines, priceMap(d.products), undefined, code.trim().toUpperCase(), d.settings, d.discounts);
  return (
    <>
      <h2>{t("Cart")}</h2>
      <div className="card"><table><tbody>{lines.map((i) => { const { p, v } = idx.get(i.variantId)!; return (
        <tr key={i.variantId}><td>{p.title} ({v.name})</td>
          <td><input type="number" min={1} max={v.stock} value={i.qty} style={{ width: 70 }} onChange={(e) => setQty(v.id, +e.target.value, v.stock)} /></td>
          <td>{fx.fmt(v.price * i.qty)}</td><td><button className="btn s" onClick={() => remove(v.id)}>{t("Remove")}</button></td></tr>); })}</tbody></table></div>
      <div className="card">
        <input placeholder={t("Discount code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        {code && c.disc === 0 && <p className="mu-t">{t("Code not valid")}</p>}
        <Breakdown c={c} cur={fx.cur} fmt={fx.fmt} /><p className="mu-t">{t("Shipping is added at checkout.")}</p>
        <Link to="/shop/checkout" className="btn">{t("Checkout")}</Link>
      </div>
    </>
  );
}

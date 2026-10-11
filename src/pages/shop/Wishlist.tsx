import { Link } from "react-router-dom";
import { api } from "../../api";
import { ProductCard } from "../../components/ProductCard";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { shopStore, useShopData } from "../../lib/shop";
import { useShopper } from "../../store/shopper";
import { Loading } from "../../components/polaris";

export default function Wishlist() {
  const d = useShopData();
  const t = useT();
  const fx = useFx(d?.settings);
  const shopper = useShopper((s) => s.customer);
  const setShopper = useShopper((s) => s.set);
  useSeo("Wishlist", undefined, d?.settings.storeName);
  if (!d) return <Loading />;
  if (!shopper) return <p>{t("Sign in to see your wishlist.")} <Link to="/shop/account">{t("Go to account")}</Link></p>;
  const items = (shopper.wishlist ?? []).map((id) => d.products.find((p) => p.id === id)).filter((p) => p !== undefined);
  const remove = async (id: string) => {
    setShopper(await api.account.update(shopStore(), { ...shopper, wishlist: (shopper.wishlist ?? []).filter((x) => x !== id) }));
  };
  return (
    <>
      <h1 className="sec-t">{t("Wishlist")}</h1>
      {items.length > 0 ? (
        <div className="pgrid">
          {items.map((p) => (
            <div key={p.id} className="wish-c">
              <ProductCard p={p} fmt={fx.fmt} />
              <button className="wish-x" aria-label={t("Remove")} onClick={() => void remove(p.id)}>✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-art">♡</div>
          <h3>{t("Your wishlist is empty")}</h3>
          <p className="mu-t">{t("Tap ♡ on any product to save it here.")}</p>
          <Link to="/shop/products" className="btn">{t("Discover products")}</Link>
        </div>
      )}
    </>
  );
}

import { Link } from "react-router-dom";
import { useT } from "../../lib/fx";
import type { AppsConfig, Product } from "../../types";

/** Instagram Feed app: shoppable gallery on the homepage, managed by the merchant. */
export function InstaFeedSection({ apps, products }: { apps: AppsConfig; products: Product[] }) {
  const t = useT();
  const cfg = apps.instaFeed;
  if (!cfg.on || !cfg.images.length) return null;
  return (
    <div className="app-insta">
      <div className="sec-h"><h3>📸 {t("Shop our Instagram")}</h3><span className="mu-t">@shop</span></div>
      <div className="app-insta-grid">
        {cfg.images.slice(0, 6).map((im, i) => {
          const p = im.productId ? products.find((x) => x.id === im.productId) : undefined;
          const inner = (<><img src={im.src} alt="" loading="lazy" /><span className="app-insta-tag">◎</span></>);
          return p ? <Link key={i} to={`/shop/product/${p.id}`} className="app-insta-item">{inner}</Link>
            : <div key={i} className="app-insta-item">{inner}</div>;
        })}
      </div>
    </div>
  );
}

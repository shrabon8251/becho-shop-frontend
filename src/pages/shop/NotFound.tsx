import { Link } from "react-router-dom";
import { useT } from "../../lib/fx";
export default function ShopNotFound() {
  const t = useT();
  return <div className="card"><h3>{t("Page not found")}</h3><p className="mu-t">{t("The page you are looking for does not exist.")}</p><Link to="/shop" className="btn">{t("Back to shop")}</Link></div>;
}

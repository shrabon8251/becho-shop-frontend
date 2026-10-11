import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "../../components/ProductCard";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { useShopData } from "../../lib/shop";
import { Loading } from "../../components/polaris";

export default function Search() {
  const d = useShopData();
  const fx = useFx(d?.settings);
  const t = useT();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  useSeo("Search", undefined, d?.settings.storeName);
  if (!d) return <Loading />;
  const query = (sp.get("q") ?? "").trim().toLowerCase();
  const results = query
    ? d.products.filter((p) => [p.title, p.vendor ?? "", p.productType ?? "", ...(p.tags ?? [])].join(" ").toLowerCase().includes(query))
    : [];
  return (
    <>
      <h1 className="sec-t">{t("Search")}</h1>
      <form className="row" style={{ maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); setSp(q.trim() ? { q: q.trim() } : {}); }}>
        <input type="search" aria-label={t("Search products")} placeholder={t("Search products")} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" type="submit">{t("Search")}</button>
      </form>
      {query && <p className="mu-t">{results.length} {t("results for")} “{sp.get("q")}”</p>}
      <div className="pgrid">{results.map((p) => <ProductCard key={p.id} p={p} fmt={fx.fmt} />)}</div>
      {query && !results.length && <p className="mu-t">{t("No products matched. Try a different keyword.")}</p>}
    </>
  );
}

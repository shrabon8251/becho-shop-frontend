import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { ProductCard } from "../../components/ProductCard";
import { useFx, useT } from "../../lib/fx";
import { useSeo } from "../../lib/seo";
import { shopStore, useShopData } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { collectionProducts } from "../../lib/collections";
import type { Product } from "../../types";
import { Loading } from "../../components/polaris";
const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
const stock = (p: Product) => p.variants.reduce((a, v) => a + v.stock, 0);
export default function Catalog() {
  const d = useShopData();
  const fx = useFx(d?.settings);
  const t = useT();
  const { data: cols } = useLoad(() => api.collections.list(shopStore()), []);
  const [sp] = useSearchParams();
  const [cid, setCid] = useState(sp.get("c") ?? "all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [inStock, setInStock] = useState(false);
  useSeo("Shop", d?.settings.seoDescription, d?.settings.storeName);
  if (!d || !cols) return <Loading />;
  const col = cols.find((c) => c.id === cid);
  const inCol = cid === "all" ? null : new Set((col ? collectionProducts(col, d.products) : d.products.filter((p) => p.collectionId === cid)).map((p) => p.id));
  const rate = fx.rate || 1;
  const list = d.products.filter((p) => (!inCol || inCol.has(p.id)) && p.title.toLowerCase().includes(q.toLowerCase())
    && (!inStock || stock(p) > 0) && (min === "" || minPrice(p) * rate >= +min) && (max === "" || minPrice(p) * rate <= +max));
  const cmp: Record<string, (a: Product, b: Product) => number> = { "price-asc": (a, b) => minPrice(a) - minPrice(b), "price-desc": (a, b) => minPrice(b) - minPrice(a), name: (a, b) => a.title.localeCompare(b.title) };
  const shown = sort in cmp ? [...list].sort(cmp[sort]) : list;
  const title = cid === "all" ? t("Products") : cols.find((c) => c.id === cid)?.name ?? t("Products");
  return (
    <>
      <h1 className="sec-t">{title}</h1>
      <div className="cat">
        <aside className="filters" aria-label={t("Filter")}>
          <input type="search" aria-label={t("Search products")} placeholder={t("Search products")} value={q} onChange={(e) => setQ(e.target.value)} />
          <details open><summary>{t("Availability")}</summary><label className="check"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />{t("In stock only")}</label></details>
          <details open><summary>{t("Price")} ({fx.cur})</summary>
            <div className="row"><input type="number" min={0} aria-label={t("Minimum price")} placeholder={t("From")} value={min} onChange={(e) => setMin(e.target.value)} /><input type="number" min={0} aria-label={t("Maximum price")} placeholder={t("To")} value={max} onChange={(e) => setMax(e.target.value)} /></div></details>
          <details open><summary>{t("Collection")}</summary>{[{ id: "all", name: t("All products") }, ...cols].map((c) => <button key={c.id} className={"flink" + (cid === c.id ? " on" : "")} onClick={() => setCid(c.id)}>{c.name}</button>)}</details>
        </aside>
        <section>
          <div className="between cat-bar"><span className="mu-t">{shown.length} {t("products")}</span>
            <label className="sortl">{t("Sort by")} <select className="mini-select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">{t("Featured")}</option><option value="price-asc">{t("Price: low to high")}</option><option value="price-desc">{t("Price: high to low")}</option><option value="name">{t("Alphabetically, A-Z")}</option></select></label></div>
          <div className="pgrid">{shown.map((p) => <ProductCard key={p.id} p={p} fmt={fx.fmt} />)}</div>
          {!shown.length && <p className="mu-t">{t("No products found. Try removing some filters.")}</p>}
        </section>
      </div>
    </>
  );
}

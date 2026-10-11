import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import { useCart } from "../store/cart";
import { trackEvent } from "../lib/tracking";
import type { Product } from "../types";

const COLOR_HEX: Record<string, string> = {
  red: "#e31e24", blue: "#1b6ebb", black: "#1a1a1a", white: "#ffffff", green: "#2e9e5b",
  yellow: "#f5a623", pink: "#f26d8d", purple: "#7c3aed", orange: "#f97316", gray: "#9ca3af",
  grey: "#9ca3af", navy: "#1a2a5e", brown: "#8b5a2b", gold: "#c9a227", silver: "#c0c0c0",
  beige: "#e8dcc8", teal: "#14b8a6", maroon: "#7f1d1d", olive: "#808000",
};

export function ProductCard({ p, fmt }: { p: Product; fmt(n: number): string }) {
  const t = useT();
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const prices = p.variants.map((v) => v.price), min = Math.min(...prices);
  const soldOut = p.variants.every((v) => v.stock < 1) && !p.preorder;
  const v0 = p.variants[0];
  const cmp = v0?.compareAt;
  const hasDeal = !!cmp && cmp > min;
  const pct = hasDeal ? Math.round((1 - min / cmp!) * 100) : 0;
  const isNew = (p.tags || []).some((x) => x.toLowerCase() === "new");
  const colors = [...new Set(p.variants.map((v) => v.optionValues?.Color).filter(Boolean))] as string[];
  const totalStock = p.variants.reduce((a, v) => a + v.stock, 0);
  const lowStock = !soldOut && totalStock > 0 && totalStock < 30;
  const quick = (e: React.MouseEvent) => { e.preventDefault(); if (v0 && (v0.stock > 0 || p.preorder)) { add(v0.id, 1, v0.stock); trackEvent("AddToCart", { content_ids: [v0.id], content_name: p.title, value: v0.price, num_items: 1 }); setOpen(true); } };
  return (
    <div className="pcard">
      <Link to={`/shop/product/${p.id}`} className="card pcard">
        <div className="pimg">
          {p.images[0] ? <><img loading="lazy" src={p.images[0]} alt={p.title} className="pimg-main" onError={(e) => { const t = e.currentTarget; if (p.images[1] && t.src !== p.images[1]) t.src = p.images[1]; }} />{p.images[1] && <img loading="lazy" src={p.images[1]} alt="" className="pimg-alt" aria-hidden />}</> : <div className="ph">{p.title[0]}</div>}
          {soldOut && <span className="soldout">{t("Sold out")}</span>}
          <div className="pbadges">
            {hasDeal && <span className="pbadge deal">-{pct}%</span>}
            {isNew && !hasDeal && <span className="pbadge new">{t("New")}</span>}
            {isNew && hasDeal && <span className="pbadge new">{t("New")}</span>}
          </div>
          {!soldOut && <button className="qadd" onClick={quick}>{t("Quick add")}</button>}
          <span className="qview" aria-hidden>👁</span>
        </div>
        <div className="pcbody">
          <div className="ptitle">{p.title}</div>
          <div className="pprice">
            <b className="pp-now">{Math.max(...prices) > min ? t("From") + " " : ""}{fmt(min)}</b>
            {hasDeal && <s className="pp-was">{fmt(cmp!)}</s>}
          </div>
          {colors.length > 0 && <div className="pswatches">{colors.slice(0, 5).map((c) => <i key={c} title={c} style={{ background: COLOR_HEX[c.toLowerCase()] || "#ccc" }} />)}</div>}
          {lowStock && (
            <div className="pstock">
              <div className="pstock-bar"><i style={{ width: Math.min(100, (totalStock / 30) * 100) + "%" }} /></div>
              <span>{t("Only")} {totalStock} {t("left")}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

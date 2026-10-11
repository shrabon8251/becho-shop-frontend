import { useParams, Link, useNavigate, Outlet, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { api } from "../api";
import { useT } from "../lib/fx";
import { THEMES, themeStyle } from "../lib/theme";
import type { Theme } from "../types";
import { HomeSections } from "../components/HomeSections";
import { useLoad } from "../lib/useLoad";
import { nichePhoto, NICHE_HERO } from "../lib/previewPhotos";
import type { Product } from "../types";
import "../landing.css";

export type PreviewCtx = {
  themeId: string;
  theme: Theme;
  products: Product[];
  themeWithPhotos: Theme;
};

const PREVIEW_NAMES = ["Classic Sneakers", "Leather Wallet", "Everyday Tote", "Denim Jacket", "Ceramic Mug", "Cotton Tee", "Canvas Backpack", "Sunglasses"];
const PREVIEW_PRICES = [8690, 3850, 3190, 13200, 1980, 2750, 9680, 6050];
const PREVIEW_COMPARE = [10890, null, null, 16500, null, 3520, 12100, 7700] as (number | null)[];

function usePreviewData(themeId: string | undefined) {
  const { data: demoData } = useLoad(
    () => api.platform.demoThemes.list().catch(() => ({ themes: [] as any[] })),
    []
  );
  const demo = demoData?.themes?.find((d: any) => d.id === themeId);
  const def = THEMES.find((x) => x.id === themeId);

  const demoProducts = demo?.products ?? [];
  const products: Product[] = (demoProducts.length ? demoProducts : PREVIEW_NAMES.map((title, i) => ({
    id: `preview-${themeId}-${i}`,
    title,
    price: PREVIEW_PRICES[i],
    compareAt: PREVIEW_COMPARE[i],
    images: [nichePhoto(themeId!, i) ?? ""],
  }))).map((p: any, i: number) => ({
    id: p.id ?? `preview-${i}`,
    title: p.title,
    status: "Active",
    images: p.images ?? [],
    variants: [{ id: `${p.id}-v1`, name: "Default", price: p.price ?? 0, compareAt: p.compareAt ?? undefined, sku: "", stock: 10 }],
  }));

  let themeWithPhotos: Theme | null = null;
  let theme: Theme | null = null;
  if (def) {
    theme = def.theme;
    const twp: Theme = JSON.parse(JSON.stringify(def.theme));
    const heroSection = twp.sections?.find((s: any) => s.type === "hero");
    if (heroSection?.slides) {
      heroSection.slides = heroSection.slides.map((slide: any, i: number) => ({
        ...slide,
        img: demo?.heroImage ?? (NICHE_HERO[themeId!] ?? nichePhoto(themeId!, i + 4) ?? slide.img),
      }));
    }
    themeWithPhotos = twp;
  }
  return { def, demo, products, theme, themeWithPhotos };
}

/**
 * Full working live theme preview with in-preview navigation.
 * /preview/:themeId → home, /preview/:themeId/products, /preview/:themeId/product/:pid, /preview/:themeId/faq
 */
export function PreviewLayout() {
  const { themeId } = useParams();
  const nav = useNavigate();
  const t = useT();
  const { def, products, theme, themeWithPhotos } = usePreviewData(themeId);
  const [mobile, setMobile] = useState(false);

  if (!def || !theme || !themeWithPhotos) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>{t("Theme not found")}</h2>
        <Link to="/">{t("Back to home")}</Link>
      </div>
    );
  }

  const ctx: PreviewCtx = { themeId: themeId!, theme: themeWithPhotos, products, themeWithPhotos };

  return (
    <div>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#1a1a2e", color: "#fff",
        padding: "10px 20px", display: "flex",
        alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => nav("/")} style={{ background: "transparent", border: "1px solid #555", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
            ← {t("All themes")}
          </button>
          <span>{t("Previewing")}: <b>{def.name}</b></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="seg" role="group" aria-label={t("Preview size")}>
            <button className={"btn s" + (!mobile ? " on" : "")} onClick={() => setMobile(false)}>{t("Desktop")}</button>
            <button className={"btn s" + (mobile ? " on" : "")} onClick={() => setMobile(true)}>{t("Mobile")}</button>
          </div>
          <Link
            to={`/signup?theme=${def.id}`}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "#fff", borderRadius: 8, padding: "10px 24px",
              fontWeight: 700, textDecoration: "none",
            }}
          >
            {t("Use this theme")}
          </Link>
        </div>
      </div>

      <div className={"shop preview tpl-" + theme.template} style={themeStyle(themeWithPhotos)}>
        <div className="shopw" style={mobile ? { maxWidth: 400, margin: "0 auto" } : undefined}>
          <PreviewNav />
          <Outlet context={ctx} />
          <PreviewFooter />
        </div>
      </div>
    </div>
  );
}

function PreviewNav() {
  const { themeId } = useParams();
  const t = useT();
  const base = `/preview/${themeId}`;
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" }}>
      <Link to={base} style={{ fontWeight: 800, fontSize: 18, textDecoration: "none", color: "inherit" }}>Demo Store</Link>
      <div style={{ display: "flex", gap: 16 }}>
        <Link to={base} style={{ textDecoration: "none", color: "inherit" }}>{t("Home")}</Link>
        <Link to={`${base}/products`} style={{ textDecoration: "none", color: "inherit" }}>{t("Shop")}</Link>
        <Link to={`${base}/faq`} style={{ textDecoration: "none", color: "inherit" }}>FAQ</Link>
      </div>
    </nav>
  );
}

function PreviewFooter() {
  const t = useT();
  return (
    <footer style={{ marginTop: 40, padding: "24px 0", borderTop: "1px solid #eee", textAlign: "center", color: "#888" }}>
      <p>© {new Date().getFullYear()} Demo Store. {t("This is a preview")}.</p>
    </footer>
  );
}

export function usePreview(): PreviewCtx {
  return useOutletContext<PreviewCtx>();
}

/** Preview home page */
export function PreviewHome() {
  const { products, themeWithPhotos } = usePreview();
  const settings = { storeName: "Demo Store", currency: "BDT" } as any;
  return <HomeSections theme={themeWithPhotos} settings={settings} products={products} cols={[]} />;
}

/** Preview product listing */
export function PreviewCatalog() {
  const { products } = usePreview();
  const { themeId } = useParams();
  const t = useT();
  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  return (
    <div style={{ padding: "20px 0" }}>
      <h2>{t("All products")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginTop: 16 }}>
        {products.map((p) => (
          <Link key={p.id} to={`/preview/${themeId}/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
              {p.images[0] && <img src={p.images[0]} alt={p.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} loading="lazy" />}
              <div style={{ padding: 10 }}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={{ marginTop: 4 }}>
                  <b>{fmt(p.variants[0]?.price ?? 0)}</b>
                  {p.variants[0]?.compareAt && <s style={{ color: "#999", marginLeft: 6 }}>{fmt(p.variants[0].compareAt)}</s>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Preview product detail */
export function PreviewProduct() {
  const { products } = usePreview();
  const { pid } = useParams();
  const t = useT();
  const p = products.find((x) => x.id === pid);
  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  if (!p) return <div style={{ padding: 40 }}>{t("Product not found")}</div>;
  const v = p.variants[0];
  return (
    <div style={{ padding: "20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        {p.images[0] && <img src={p.images[0]} alt={p.title} style={{ width: "100%", borderRadius: 12 }} />}
      </div>
      <div>
        <h2>{p.title}</h2>
        <div style={{ fontSize: 22, margin: "12px 0" }}>
          <b>{fmt(v?.price ?? 0)}</b>
          {v?.compareAt && <s style={{ color: "#999", marginLeft: 8 }}>{fmt(v.compareAt)}</s>}
        </div>
        <Link to={`/signup?theme=${useParams().themeId}`} className="btn" style={{ display: "inline-block", marginTop: 12, background: "#7c3aed", color: "#fff", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
          {t("Use this theme to sell")}
        </Link>
        <h3 style={{ marginTop: 24 }}>{t("Related products")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 8 }}>
          {products.filter((x) => x.id !== p.id).slice(0, 3).map((r) => (
            <Link key={r.id} to={`/preview/${useParams().themeId}/product/${r.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              {r.images[0] && <img src={r.images[0]} alt={r.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} loading="lazy" />}
              <div style={{ fontSize: 13, marginTop: 4 }}>{r.title}</div>
              <b style={{ fontSize: 13 }}>{fmt(r.variants[0]?.price ?? 0)}</b>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Preview FAQ page */
export function PreviewFaq() {
  const t = useT();
  const faqs = [
    { q: "How long is delivery?", a: "Delivery takes 2-4 working days inside the city." },
    { q: "What is the return policy?", a: "Easy 30-day returns on all products." },
    { q: "Which payment methods do you accept?", a: "COD, bKash, Nagad, Rocket and cards via SSLCommerz." },
  ];
  return (
    <div style={{ padding: "20px 0", maxWidth: 640 }}>
      <h2>FAQ</h2>
      {faqs.map((f, i) => (
        <div key={i} style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}>
          <b>{f.q}</b>
          <p style={{ color: "#666", marginTop: 8 }}>{f.a}</p>
        </div>
      ))}
      <p className="mu-t" style={{ marginTop: 16 }}>{t("This is a preview")}.</p>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { useFx, useLocale, useT } from "../../lib/fx";
import { shopStore, useShopData } from "../../lib/shop";
import { themeStyle } from "../../lib/theme";
import { useLoad } from "../../lib/useLoad";
import { useAuth } from "../../store/auth";
import { useShopper } from "../../store/shopper";
import { CartDrawer } from "../../components/CartDrawer";
import { NewsletterPopup } from "../../components/NewsletterPopup";
import { LiveChatBubble } from "../../components/apps/LiveChatBubble";
import { useCart } from "../../store/cart";
import { initTracking, trackEvent } from "../../lib/tracking";
function SearchBox({ products, fx, base }: { products: { id: string; title: string; images: string[]; variants: { price: number }[] }[]; fx: { fmt(n: number): string }; base: string }) {
    const t = useT();
    const nav = useNavigate();
    const [q, setQ] = useState("");
    const [focus, setFocus] = useState(false);
    const box = useRef<HTMLDivElement>(null);
    const res = q.trim() ? products.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
    const go = (id: string) => { setQ(""); setFocus(false); nav(`${base}/product/${id}`); };
    return (
        <div className="sbox sara-search" ref={box}>
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setQ(""); setFocus(false); nav(`${base}/search?q=${encodeURIComponent(q.trim())}`); } }}>
                <input type="search" name="q" aria-label={t("Search products")} placeholder={t("I'm shopping for…")} value={q}
                       onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)}
                       onBlur={() => setTimeout(() => setFocus(false), 150)} />
                <button type="submit" className="sara-search-btn" aria-label={t("Search")}>🔍</button>
            </form>
            {focus && res.length > 0 && (
                <div className="sbox-drop">
                    {res.map((p) => (
                        <button key={p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => go(p.id)}>
                            {p.images[0] ? <img src={p.images[0]} alt="" /> : <div className="ph sph">{p.title[0]}</div>}
                            <span style={{ flex: 1, textAlign: "left" }}>{p.title}</span>
                            <b>{fx.fmt(Math.min(...p.variants.map((v) => v.price)))}</b>
                        </button>))}
                    <button className="sbox-all" onMouseDown={(e) => e.preventDefault()} onClick={() => { setFocus(false); nav(`${base}/search?q=${encodeURIComponent(q.trim())}`); }}>
                        {t("See all results")} →</button>
                </div>)}
        </div>
    );
}
export default function ShopLayout() {
    const { slug } = useParams<{ slug: string }>();
    const base = slug ? `/shop/${slug}` : "/shop";
    const n = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
    const setOpen = useCart((s) => s.setOpen);
    const user = useAuth((s) => s.user);
    const shopper = useShopper((s) => s.customer);
    const d = useShopData();
    const t = useT();
    const fx = useFx(d?.settings);
    const { lang, setLang, setCurrency } = useLocale();
    const { data: posts } = useLoad(() => api.posts.list(shopStore()), []);
    const { data: cols } = useLoad(() => api.storefront.collections(shopStore()), []);
    const [dark, setDark] = useState(() => { try { return localStorage.getItem("shop-dark") === "1"; } catch { return false; } });
    const [catOpen, setCatOpen] = useState(false);
    const [errAck, setErrAck] = useState(false);
    useEffect(() => { setErrAck(false); }, [d?.error]);
    useEffect(() => {
        if (d?.settings) { initTracking(d.settings.tracking); trackEvent("PageView"); }
    }, [d?.settings.tracking]);
    const toggleDark = () => { const v = !dark; setDark(v); try { localStorage.setItem("shop-dark", v ? "1" : "0"); } catch { /* noop */ } };
    const pages = (posts ?? []).filter((p) => p.type === "page" && p.published);
    const currencies = d ? Array.from(new Set([d.settings.currency, ...Object.keys(d.settings.rates ?? {})])) : [];
    return (
        <div className={"shop" + (d?.theme.template ? " tpl-" + d.theme.template : "") + (dark ? " dark" : "")} style={d ? themeStyle(d.theme) : undefined}>
            {d?.apps.bar.on && (d.apps.bar.text.length > 60 ? (
                <div className="announce marq" aria-label={d.apps.bar.text}><span aria-hidden>{d.apps.bar.text}&nbsp;&nbsp;•&nbsp;&nbsp;{d.apps.bar.text}&nbsp;&nbsp;•&nbsp;&nbsp;</span></div>
            ) : (
                <div className="announce">{d.apps.bar.text}</div>
            ))}
            <header className="shead sara-h">
                <div className="sara-h-main">
                    <Link to={base} className="logo sara-logo">{d?.theme.logoText || d?.settings.storeName || "Shop"}</Link>
                    {d && <SearchBox products={d.products} fx={fx} base={base} />}
                    <div className="sara-h-icons">
                        <button className="iconbtn" aria-label={t("Toggle dark mode")} onClick={toggleDark}>{dark ? "☀️" : "🌙"}</button>
                        {user && <Link to="/admin" className="mu-t">Admin</Link>}
                        <Link to={`${base}/wishlist`} className="sara-ic" aria-label={t("Wishlist")}>♡</Link>
                        <Link to={`${base}/account`} className="sara-ic sara-acc" aria-label={t("Account")}>{shopper ? `👤 ${shopper.name.split(" ")[0]}` : <>{t("Account")}</>}</Link>
                        <select className="mini-select" aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as "en" | "bn")}>{(d?.settings.publishedLangs ?? ["en", "bn"]).map((l) => <option key={l} value={l}>{l === "bn" ? "বাংলা" : "EN"}</option>)}</select>
                        {d?.apps.currency.on && currencies.length > 1 && <select className="mini-select" value={fx.cur} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((c) => <option key={c}>{c}</option>)}</select>}
                        <button className="sara-cart" onClick={() => setOpen(true)} aria-label={t("Cart")}>🛒{n > 0 && <i>{n}</i>}</button>
                    </div>
                </div>
                <nav className="sara-nav">
                    <div className="catmenu" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
                        <button className="catmenu-btn" aria-expanded={catOpen}>☰ {t("Shop by category")}</button>
                        {catOpen && (cols?.length ?? 0) > 0 && (
                            <div className="catmenu-drop">
                                {(cols ?? []).map((c) => (
                                    <Link key={c.id} to={`${base}/products?c=${c.id}`} onClick={() => setCatOpen(false)}>
                                        {c.image ? <img src={c.image} alt="" /> : <span className="ph sph">{c.name[0]}</span>}
                                        {c.name}
                                    </Link>))}
                            </div>)}
                    </div>
                    <div className="sara-nav-links">
                        <Link to={base}>{t("Home")}</Link>
                        <Link to={`${base}/products`}>{t("Shop")}</Link>
                        <Link to={`${base}/bundles`}>{t("Bundles")}</Link>
                        <Link to={`${base}/collections`}>{t("Collections")}</Link>
                        <Link to={`${base}/blog`}>{t("Blog")}</Link>
                        <Link to={`${base}/gift-cards`}>{t("Gift cards")}</Link>
                        {pages.map((p) => <Link key={p.id} to={`${base}/page/${p.slug}`}>{p.title}</Link>)}
                    </div>
                    <Link to={`${base}/track`} className="sara-nav-right">📦 {t("Order tracking")}</Link>
                </nav>
            </header>
            {d?.error && !errAck && (
                <div role="alert" style={{ background: "#fff7e6", borderBottom: "1px solid #f0d48a", color: "#7a4d00", padding: "8px 16px", display: "flex", gap: 12, alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                    <span>⚠️ {d.error}</span>
                    <button onClick={() => setErrAck(true)} aria-label={t("Dismiss")} style={{ border: "1px solid #e0b84f", background: "#fff", borderRadius: 6, padding: "2px 10px", cursor: "pointer" }}>✕</button>
                </div>)}
            <nav className="mnav" aria-label={t("Shop")}>
                <Link to={`${base}/products`}>🛍<span>{t("Shop")}</span></Link>
                <Link to={`${base}/search`}>🔍<span>{t("Search")}</span></Link>
                <Link to={`${base}/wishlist`}>♡<span>{t("Wishlist")}</span></Link>
                <button onClick={() => setOpen(true)}>🛒<span>{t("Cart")} ({n})</span></button>
                <Link to={`${base}/account`}>👤<span>{shopper ? shopper.name.split(" ")[0] : t("Account")}</span></Link>
            </nav>
            <div className="shopw"><Outlet /></div>
            <footer className="sfoot sara-f">
                <div className="fcols">
                    <div className="fbrand">
                        <b className="flogo">{d?.theme.logoText || d?.settings.storeName || "Shop"}</b>
                        <p className="mu-t">{d?.settings.seoDescription || t("Quality products, delivered to your door.")}</p>
                        <div className="fsocial"><span aria-label="Facebook">f</span><span aria-label="Instagram">◎</span><span aria-label="YouTube">▶</span><span aria-label="TikTok">♪</span></div>
                    </div>
                    <div><b>{t("Shop")}</b><Link to={`${base}/products`}>{t("All products")}</Link><Link to={`${base}/collections`}>{t("Collections")}</Link><Link to={`${base}/bundles`}>{t("Bundles")}</Link><Link to={`${base}/gift-cards`}>{t("Gift cards")}</Link></div>
                    <div><b>{t("Customer care")}</b><Link to={`${base}/track`}>{t("Track order")}</Link><Link to={`${base}/blog`}>{t("Blog")}</Link><Link to={`${base}/account`}>{t("Account")}</Link><Link to={`${base}/wishlist`}>{t("Wishlist")}</Link></div>
                    {pages.length > 0 && <div><b>Information</b>{pages.map((p) => <Link key={p.id} to={`${base}/page/${p.slug}`}>{p.title}</Link>)}</div>}
                    {(d?.theme.footer?.links?.length ?? 0) > 0 && <div><b>{t("Links")}</b>{d!.theme.footer!.links!.filter((l) => l.label.trim()).map((l, i) => l.href.startsWith("http") ? <a key={i} href={l.href} target="_blank" rel="noreferrer">{l.label}</a> : <Link key={i} to={l.href || base}>{l.label}</Link>)}</div>}
                </div>
                {d?.theme.footer?.showPayments !== false && <div className="payicons"><span>VISA</span><span>MC</span><span>AMEX</span><span>bKash</span><span>Nagad</span><span>Rocket</span><span>COD</span></div>}
                <div className="fbot">{(d?.theme.footer?.text || "© {year} {store}. All rights reserved.").replace("{year}", String(new Date().getFullYear())).replace("{store}", d?.settings.storeName || "Shop")}</div>
            </footer>
            {d && <CartDrawer d={d} />}
            {d && <NewsletterPopup store={shopStore()} apps={d.apps} />}
            {d && <LiveChatBubble apps={d.apps} />}
        </div>
    );
}

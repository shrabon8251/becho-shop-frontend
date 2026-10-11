import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import Photo from "./Photo";
import { useFx, useT } from "../lib/fx";
import { shopStore } from "../lib/shop";
import type { Collection, HeroSlide, Product, Settings, Theme, ThemeSection } from "../types";

function Newsletter() {
    const t = useT();
    const [email, setEmail] = useState("");
    const [ok, setOk] = useState(false);
    return (
        <div className="card nl"><b>{t("Join our newsletter")}</b>
            <p className="mu-t">{t("Get 10% off your first order.")}</p>
            {ok ? <p className="mu-t">{t("Thank you for subscribing!")}</p> : (
                <div className="row"><input placeholder={t("Email")} aria-label={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
                    <button className="btn" onClick={() => email.includes("@") && setOk(true)}>{t("Subscribe")}</button></div>)}
        </div>
    );
}

/** Split hero: main slider (2/3) + 3 stacked promo banners (1/3), Sara-style. */
function Hero({ s, settings }: { s: ThemeSection; settings?: Settings }) {
    const t = useT();
    const fx = useFx(settings);
    const slides: HeroSlide[] = s.slides?.length ? s.slides : [{ title: s.title, sub: s.sub, btnText: s.btnText, btnLink: s.btnLink }];
    const legacyBg = !s.slides?.length && s.bg ? s.bg : undefined;
    const promos = s.promos ?? [];
    const [i, setI] = useState(0);
    const n = slides.length;
    useEffect(() => {
        if (n < 2) return;
        const id = setInterval(() => setI((x) => (x + 1) % n), 5000);
        return () => clearInterval(id);
    }, [n]);
    const cur = slides[i % n];
    const storeName = settings?.storeName ?? "";
    const freeOver = settings?.freeOver ?? 0;
    return (
        <div className={"hero-split" + (promos.length ? " has-promos" : "")}>
            <div className="hero" style={legacyBg ? { background: legacyBg } : undefined}>
                {cur.video ? (
                    <video className="hero-bg" src={cur.video} autoPlay muted loop playsInline />
                ) : cur.photo || cur.img ? (
                    <Photo className="hero-bg" src={cur.photo ?? null} fallback={cur.img ?? ""} alt="" />
                ) : null}
                <div className="hero-ov" />
                <div className="hero-in">
                    <h2>{cur.title || `${t("Welcome to")} ${storeName}`}</h2>
                    <div>{cur.sub || (freeOver > 0 ? `${t("Free shipping over")} ${fx.fmt(freeOver)}` : t("Shop our latest products"))}</div>
                    {cur.btnText && <Link to={cur.btnLink || "/shop/products"} className="btn hero-cta">{cur.btnText}</Link>}
                </div>
                {n > 1 && (
                    <>
                        <button className="hero-arrow l" aria-label={t("Previous")} onClick={() => setI((i - 1 + n) % n)}>‹</button>
                        <button className="hero-arrow r" aria-label={t("Next")} onClick={() => setI((i + 1) % n)}>›</button>
                        <div className="hero-dots">{slides.map((_, d) => <button key={d} aria-label={`${t("Slide")} ${d + 1}`} className={d === i % n ? "on" : ""} onClick={() => setI(d)} />)}</div>
                    </>
                )}
            </div>
            {promos.length > 0 && (
                <div className="hero-promos">
                    {promos.slice(0, 3).map((p, pi) => (
                        <Link key={pi} to={p.link || "/shop/products"} className="hp-card">
                            {p.img && <img src={p.img} alt="" loading="lazy" />}
                            <div className="hp-t"><b>{p.title}</b>{p.sub && <span>{p.sub}</span>}</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Daily deals: dark gradient panel, countdown to midnight, horizontal product rail. */
function Deals({ s, products, fmt }: { s: ThemeSection; products: Product[]; fmt(n: number): string }) {
    const t = useT();
    const [left, setLeft] = useState("--:--:--");
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const end = new Date(now); end.setHours(23, 59, 59, 999);
            const d = Math.max(0, end.getTime() - now.getTime());
            const h = String(Math.floor(d / 36e5)).padStart(2, "0");
            const m = String(Math.floor((d % 36e5) / 6e4)).padStart(2, "0");
            const sec = String(Math.floor((d % 6e4) / 1e3)).padStart(2, "0");
            setLeft(`${h}:${m}:${sec}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    const items = products.filter((p) => p.variants.some((v) => v.compareAt && v.compareAt > v.price));
    const list = (items.length ? items : products).slice(0, s.count ?? 8);
    if (!list.length) return null;
    return (
        <div className="deals" style={s.bg ? { background: s.bg } : undefined}>
            <div className="deals-h">
                <div><h3>⚡ {s.title || t("Daily deals")}</h3>{s.sub && <p>{s.sub}</p>}</div>
                <div className="countdown"><span>{t("Ends in")}</span><b>{left}</b></div>
                <Link to="/shop/products" className="deals-more">{t("See more")} →</Link>
            </div>
            <div className="rail">{list.map((p) => <div className="rail-item" key={p.id}><ProductCard p={p} fmt={fmt} /></div>)}</div>
        </div>
    );
}

/** Popular categories: circular image tiles with scroll arrows. */
function CatCircles({ s, cols }: { s: ThemeSection; cols: Collection[] }) {
    const t = useT();
    const ref = useRef<HTMLDivElement>(null);
    if (!cols.length) return null;
    const scrollBy = (d: number) => ref.current?.scrollBy({ left: d, behavior: "smooth" });
    return (
        <div className="catc">
            <div className="sec-h"><h3>{s.title || t("Popular categories")}</h3>
                <div className="carrows"><button aria-label={t("Previous")} onClick={() => scrollBy(-320)}>‹</button><button aria-label={t("Next")} onClick={() => scrollBy(320)}>›</button></div>
            </div>
            <div className="catc-rail" ref={ref}>
                {cols.map((c) => (
                    <Link key={c.id} to={`/shop/products?c=${c.id}`} className="catc-item">
                        {c.image ? <img src={c.image} alt="" loading="lazy" /> : <div className="ph">{c.name[0]}</div>}
                        <span>{c.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/** Promo tiles: grid of wide image banners. */
function PromoTiles({ s }: { s: ThemeSection }) {
    const tiles = s.tiles ?? [];
    if (!tiles.length) return null;
    return (
        <div className="ptiles">
            {s.title && <div className="sec-h"><h3>{s.title}</h3></div>}
            <div className={"ptiles-g n" + Math.min(3, tiles.length)}>
                {tiles.map((tl, i) => (
                    <Link key={i} to={tl.link || "/shop/products"} className="ptile">
                        {tl.img && <img src={tl.img} alt="" loading="lazy" />}
                        <span className="ptile-t">{tl.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/** Tabbed products: collection tabs + horizontal product rail. */
function PTabs({ s, products, cols, fmt }: { s: ThemeSection; products: Product[]; cols: Collection[]; fmt(n: number): string }) {
    const t = useT();
    const [tab, setTab] = useState("all");
    const tabs = [{ id: "all", name: t("All") }, ...cols.slice(0, 5)];
    const list = (tab === "all" ? products : products.filter((p) => p.collectionId === tab)).slice(0, s.count ?? 8);
    return (
        <div className="ptabs">
            <div className="sec-h"><h3>{s.title || t("Trending now")}</h3></div>
            <div className="ptabs-tabs">{tabs.map((x) => <button key={x.id} className={tab === x.id ? "on" : ""} onClick={() => setTab(x.id)}>{x.name}</button>)}</div>
            {list.length ? <div className="rail">{list.map((p) => <div className="rail-item" key={p.id}><ProductCard p={p} fmt={fmt} /></div>)}</div>
                : <p className="mu-t">{t("No products yet.")}</p>}
        </div>
    );
}

/** Full-width gradient CTA banner. */
function CtaBanner({ s }: { s: ThemeSection }) {
    return (
        <div className="ctab" style={s.bg ? { background: s.bg, color: "#fff" } : undefined}>
            <div><h3>{s.title}</h3>{s.body && <p>{s.body}</p>}</div>
            {s.btnText && <Link to={s.btnLink || "/shop/products"} className="btn btn-outline-w">{s.btnText}</Link>}
        </div>
    );
}

function Testimonials({ s }: { s: ThemeSection }) {
    const t = useT();
    const items = s.testimonials ?? [];
    const [i, setI] = useState(0);
    if (!items.length) return null;
    const cur = items[i % items.length];
    return (
        <div className="tst"><h3>{s.title || t("Testimonials")}</h3>
            <div className="card tst-c">
                <div className="stars">{"★".repeat(cur.stars)}{"☆".repeat(Math.max(0, 5 - cur.stars))}</div>
                <p>"{cur.text}"</p><b>— {cur.name}</b>
            </div>
            {items.length > 1 && <div className="hero-dots">{items.map((_, d) => <button key={d} aria-label={`${t("Testimonial")} ${d + 1}`} className={d === i % items.length ? "on" : ""} onClick={() => setI(d)} />)}</div>}
        </div>
    );
}

function Faq({ s }: { s: ThemeSection }) {
    const t = useT();
    return (
        <div className="faq"><h3>{s.title || t("FAQ")}</h3>
            {(s.faqs ?? []).map((f, i) => <details key={i} className="card"><summary>{f.q}</summary><p className="mu-t">{f.a}</p></details>)}
        </div>
    );
}

function RecentlyViewed({ products, fmt }: { products: Product[]; fmt(n: number): string }) {
    const t = useT();
    const [ids] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem("rv:" + shopStore()) ?? "[]"); } catch { return []; }
    });
    const items = ids.map((x) => products.find((x2) => x2.id === x)).filter((x) => x !== undefined).slice(0, 8);
    if (!items.length) return null;
    return (
        <div><div className="sec-h"><h3>{t("Recently viewed")}</h3></div>
            <div className="pgrid">{items.map((x) => <ProductCard key={x.id} p={x} fmt={fmt} />)}</div></div>
    );
}

export function HomeSections({ theme, settings, products, cols }: { theme: Theme; settings?: Settings; products: Product[]; cols: Collection[] }) {
    const fx = useFx(settings);
    const t = useT();
    return (
        <>{(theme.sections ?? []).filter((s) => s.on).map((s) => {
            if (s.type === "hero") return <Hero key={s.id} s={s} settings={settings} />;
            if (s.type === "collections") return (
                <div key={s.id} className="colgrid">{cols.map((c) => (
                    <Link key={c.id} to={`/shop/products?c=${c.id}`} className="colcard">
                        {c.image ? <img src={c.image} alt="" /> : <div className="ph">{c.name[0]}</div>}
                        <span>{c.name}</span>
                    </Link>))}</div>);
            if (s.type === "featured_collection") {
                const c = cols.find((x) => x.id === s.collectionId) ?? cols[0];
                if (!c) return null;
                return (
                    <Link key={s.id} to={`/shop/products?c=${c.id}`} className="featcol">
                        {c.image ? <img src={c.image} alt="" /> : <div className="ph">{c.name[0]}</div>}
                        <div className="featcol-t"><h3>{s.title || c.name}</h3><span className="btn">{t("Shop now")}</span></div>
                    </Link>);
            }
            if (s.type === "featured") return (
                <div key={s.id} className="featsec"><div className="sec-h"><h3>{s.title}</h3><Link to="/shop/products" className="link">{t("View all")}</Link></div>
                    <div className="pgrid sara">{products.slice(0, s.count ?? 4).map((p) => <ProductCard key={p.id} p={p} fmt={fx.fmt} />)}</div></div>);
            if (s.type === "banner") return <div key={s.id} className="card sbanner" style={s.bg ? { background: s.bg, color: "#fff" } : undefined}>{s.text}</div>;
            if (s.type === "image_text") return (
                <div key={s.id} className={"imgtext" + (s.flip ? " flip" : "")}>
                    {s.img && <img src={s.img} alt="" />}
                    <div><h3>{s.title}</h3><p className="mu-t">{s.body}</p>
                        {s.btnText && <Link to={s.btnLink || "/shop/products"} className="btn">{s.btnText}</Link>}</div>
                </div>);
            if (s.type === "deals") return <Deals key={s.id} s={s} products={products} fmt={fx.fmt} />;
            if (s.type === "cat_circles") return <CatCircles key={s.id} s={s} cols={cols} />;
            if (s.type === "promo_tiles") return <PromoTiles key={s.id} s={s} />;
            if (s.type === "ptabs") return <PTabs key={s.id} s={s} products={products} cols={cols} fmt={fx.fmt} />;
            if (s.type === "cta_banner") return <CtaBanner key={s.id} s={s} />;
            if (s.type === "testimonials") return <Testimonials key={s.id} s={s} />;
            if (s.type === "richtext") return <div key={s.id} className="richtext"><h3>{s.title}</h3><p className="mu-t">{s.body}</p></div>;
            if (s.type === "faq") return <Faq key={s.id} s={s} />;
            if (s.type === "gallery") return (
                <div key={s.id}><h3>{s.title}</h3><div className="gal">{(s.images ?? []).map((g, i) => <img key={i} src={g} alt="" loading="lazy" />)}</div></div>);
            return <Newsletter key={s.id} />;
        })}
            <RecentlyViewed products={products} fmt={fx.fmt} />
        </>
    );
}

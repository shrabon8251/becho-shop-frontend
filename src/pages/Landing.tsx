import { useEffect, useRef, useState, createContext, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLocale, useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import { BILLING_CYCLES, cycleMonthly, cyclePrice } from "../lib/plans";
import { THEMES, themeStyle } from "../lib/theme";
import { productArt } from "../lib/demoArt";
import { nichePhoto, NICHE_HERO } from "../lib/previewPhotos";
import { defaultLanding } from "../lib/landing";
import { useLoad } from "../lib/useLoad";
import type { Plan, LandingContent } from "../types";
import "../landing.css";

/** Landing CMS content, loaded from the backend (super admin Website tab). */
const LandingCtx = createContext<LandingContent>(defaultLanding());
const useLanding = () => useContext(LandingCtx);

function Reveal({ children, cls = "", d = "" }: { children: React.ReactNode; cls?: string; d?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("on"), io.unobserve(e.target))), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv ${d} ${cls}`}>{children}</div>;
}

function CountUp({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !started) {
        started = true;
        const t0 = performance.now();
        const dur = 1700;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setV(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

const PLAN_FEATS: Record<Plan, string[]> = {
  Starter: ["Up to 100 products", "2 staff accounts", "Online store + POS", "bKash, Nagad, Rocket & COD", "Basic analytics", "Standard support"],
  Growth: ["Unlimited products", "10 staff accounts", "Abandoned cart recovery", "Discounts & loyalty points", "Advanced analytics", "Courier integrations", "Priority support"],
  Pro: ["Everything in Growth", "Unlimited staff accounts", "Multi-branch POS", "API access & webhooks", "Staff permissions", "Dedicated manager"],
};
/** Full comparison table rows: feature label + per-plan value (true = included check, string = custom text). */
const COMPARE_ROWS: { f: string; v: (boolean | string)[] }[] = [
  { f: "Products", v: ["Up to 100", "Unlimited", "Unlimited"] },
  { f: "Staff accounts", v: ["2", "10", "Unlimited"] },
  { f: "Transaction fee", v: ["0%", "0%", "0%"] },
  { f: "Online store themes", v: [true, true, true] },
  { f: "POS", v: [true, true, "Multi-branch"] },
  { f: "bKash / Nagad / Rocket / COD", v: [true, true, true] },
  { f: "Discounts & gift cards", v: [true, true, true] },
  { f: "Abandoned cart recovery", v: [false, true, true] },
  { f: "Loyalty points & store credit", v: [false, true, true] },
  { f: "Courier integrations", v: [false, true, true] },
  { f: "Analytics", v: ["Basic", "Advanced", "Advanced"] },
  { f: "API access & webhooks", v: [false, false, true] },
  { f: "Staff permissions", v: [false, false, true] },
  { f: "Support", v: ["Standard", "Priority", "Dedicated manager"] },
];
const PAY_BADGES: [string, string][] = [
  ["bKash", "#e2136e"], ["Nagad", "#f6921e"], ["Rocket", "#8c3494"], ["Upay", "#00a651"],
  ["VISA", "#1a1f71"], ["Mastercard", "#eb001b"], ["Amex", "#2e77bc"], ["COD", "#16a34a"],
];
const SOCIALS = ["FB", "IG", "IN", "YT", "X", "TT"];

function Nav({ dk, onToggleDk }: { dk: boolean; onToggleDk: () => void }) {
  const t = useT();
  const { lang, setLang } = useLocale();
  const user = useAuth((s) => s.user);
  const [sc, setSc] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setSc(window.scrollY > 24);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (<>
    <nav className={`bx-nav${sc ? " sc" : ""}`}>
      <div className="bx-wrap bx-nav-in">
        <Link to="/" className="bx-logo"><span className="bx-logo-mark">◈</span>Becho</Link>
        <div className="bx-links">
          <a href="#features">{t("Features")}</a>
          <a href="#themes">{t("Themes")}</a>
          <a href="#pricing">{t("Pricing")}</a>
          <a href="#faq">{t("FAQ")}</a>
        </div>
        <div className="bx-nav-r">
          <button className="bx-theme-toggle" onClick={onToggleDk} aria-label={dk ? t("Light mode") : t("Dark mode")}>{dk ? "☀" : "☾"}</button>
          <button className="bx-lang" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>{lang === "bn" ? "EN" : "বাং"}</button>
          {user ? <Link to="/admin" className="bx-btn sm shine">{t("Open dashboard")}</Link>
            : <><Link to="/login" className="bx-login">{t("Log in")}</Link><Link to="/signup" className="bx-btn sm shine">{t("Start free trial")}</Link></>}
          <button className="bx-burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
    </nav>
    {open && <div className="bx-mnav">
      {[["#features", t("Features")], ["#themes", t("Themes")], ["#pricing", t("Pricing")], ["#faq", t("FAQ")]].map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
      {!user && <Link to="/login" onClick={() => setOpen(false)}>{t("Log in")}</Link>}
    </div>}
  </>);
}

const FEED_SEED = [
  { n: "Nadia R.", p: "Jamdani Saree", a: "৳2,450" },
  { n: "Tanvir A.", p: "Wireless Earbuds", a: "৳1,890" },
  { n: "Sara K.", p: "Ceramic Mug ×2", a: "৳760" },
  { n: "Rahim U.", p: "Running Shoes", a: "৳3,200" },
  { n: "Mim H.", p: "Silk Scarf", a: "৳980" },
  { n: "Arif C.", p: "Smart Watch", a: "৳4,500" },
  { n: "Faria J.", p: "Cotton Kurti", a: "৳1,350" },
  { n: "Hasan M.", p: "Backpack", a: "৳2,100" },
];
function LiveFeed() {
  const t = useT();
  const [items, setItems] = useState(() => FEED_SEED.slice(0, 4).map((o, i) => ({ ...o, key: i })));
  const ix = useRef(4);
  useEffect(() => {
    const iv = setInterval(() => {
      const o = FEED_SEED[ix.current % FEED_SEED.length];
      setItems((prev) => [{ ...o, key: ix.current }, ...prev].slice(0, 4));
      ix.current += 1;
    }, 2600);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="bx-feed">
      <div className="bx-feed-h"><span className="live-dot" /><b>{t("Live orders")}</b></div>
      <div className="bx-feed-list">{items.map((o) => (
        <div className="bx-feed-row" key={o.key}>
          <span className="bx-feed-ava">{o.n[0]}</span>
          <span className="bx-feed-tx"><b>{o.n}</b><small>{o.p}</small></span>
          <span className="bx-feed-amt">{o.a}</span>
        </div>))}
      </div>
    </div>
  );
}

function Hero() {
  const t = useT();
  const c = useLanding();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const go = (e: React.FormEvent) => { e.preventDefault(); nav(email.includes("@") ? `/signup?email=${encodeURIComponent(email)}` : "/signup"); };
  const bars = [42, 68, 50, 80, 62, 92, 74, 100, 66, 86, 58, 78];
  return (
    <header className="bx-hero">
      <div className="bx-blob b1" /><div className="bx-blob b2" /><div className="bx-blob b3" />
      <div className="bx-wrap bx-hero-in">
        <Reveal d="d1"><h1 className="bx-h1">{c.hero.title}<br /><span className="gr anim">{c.hero.titleAccent}</span></h1></Reveal>
        <Reveal d="d2"><p className="bx-sub">{c.hero.subtitle}</p></Reveal>
        <Reveal d="d3">
          <form className="bx-hero-cta" onSubmit={go}>
            <div className="bx-email"><input type="email" placeholder={t("Enter your email")} value={email} onChange={(e) => setEmail(e.target.value)} aria-label={t("Email")} /><button className="bx-btn shine" type="submit">{c.hero.cta}</button></div>
          </form>
          <p className="bx-note">{c.hero.note} · <Link to="/demo/minimal" className="bx-demo-link">{t("or explore a live demo")} →</Link></p>
        </Reveal>
        <Reveal d="d3">
          <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
            <div className="bx-float-card bx-fc1"><span className="ic" style={{ background: "linear-gradient(135deg,#10b981,#0ea5e9)" }}>🧾</span><span>{t("New order")} #1042<small>2 {t("minutes ago")}</small></span></div>
            <div className="bx-float-card bx-fc2"><span className="ic" style={{ background: "var(--bx-grad)" }}>▲</span><span>+{t("৳")}12,400<small>{t("today vs yesterday")}</small></span></div>
            <div className="bx-dash" aria-hidden>
              <div className="bx-chrome"><i /><i /><i /><span>becho.com/admin</span><em className="bx-live-tag"><span className="live-dot" />{t("LIVE")}</em></div>
              <div className="bx-dash-body">
                <div className="bx-side"><i className="on" /><i /><i /><i /><i /><i /></div>
                <div className="bx-main">
                  <div className="bx-kpis">
                    <div className="bx-kpi"><small>{t("Revenue")}</small><b>{t("৳")}284k</b><em>+18%</em></div>
                    <div className="bx-kpi"><small>{t("Orders")}</small><b>1,042</b><em>+12%</em></div>
                    <div className="bx-kpi"><small>{t("Visitors")}</small><b>28.4k</b><em>+24%</em></div>
                  </div>
                  <div className="bx-dash-row">
                    <div className="bx-chart">{bars.map((h, i) => <div key={i} className="bx-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />)}</div>
                    <LiveFeed />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="bx-stats">
            <div className="bx-stat"><b><CountUp to={10} suffix="+" /></b><span>{t("designer themes")}</span></div>
            <div className="bx-stat"><b><CountUp to={5} /></b><span>{t("courier partners")}</span></div>
            <div className="bx-stat"><b><CountUp to={8} /></b><span>{t("payment methods")}</span></div>
            <div className="bx-stat"><b>0%</b><span>{t("transaction fee")}</span></div>
          </div>
        </Reveal>
      </div>
    </header>
  );
}

function Marquee() {
  const t = useT();
  const names = ["Khan's Kicks", "Nadia Fashion", "GadgetGhar", "Bean & Brew", "CraftKutir", "TechTonic", "GlowLab", "DeshiDecor"];
  const row = [...names, ...names];
  return (
    <div className="bx-marq"><div className="bx-wrap"><p>{t("Trusted by modern brands")}</p></div>
      <div className="bx-marq-track">{row.map((n, i) => <span key={i}>✦ {n}</span>)}</div>
    </div>
  );
}

function Features() {
  const t = useT();
  const c = useLanding();
  const BGS = ["linear-gradient(135deg,#6c4cf1,#b44dff)", "linear-gradient(135deg,#0ea5e9,#6c4cf1)", "linear-gradient(135deg,#f59e0b,#ff6b4a)", "linear-gradient(135deg,#10b981,#0ea5e9)", "linear-gradient(135deg,#ec4899,#b44dff)", "linear-gradient(135deg,#8b5cf6,#6366f1)"];
  return (
    <section className="bx-sec" id="features"><div className="bx-wrap">
      <Reveal><span className="bx-kicker">{t("Everything included")}</span>
        <h2 className="bx-h2">{t("One platform, every tool you need")}</h2>
        <p className="bx-lead">{t("Stop stitching apps together. Becho ships the full commerce stack out of the box.")}</p></Reveal>
      <div className="bx-bento">{c.features.map((f, i) => (
        <Reveal key={f.title} d={`d${i % 3}`}><div className="bx-feat">
          <div className="ic" style={{ background: BGS[i % BGS.length] }}>{f.icon}</div>
          <h3>{f.title}</h3><p>{f.desc}</p>
        </div></Reveal>))}
      </div>
    </div></section>
  );
}

function PayStrip() {
  const t = useT();
  return (
    <section className="bx-paystrip"><div className="bx-wrap bx-center">
      <Reveal><p className="bx-pay-h">{t("Accept payments your customers love")}</p>
        <div className="bx-pay-badges">{PAY_BADGES.map(([n, c]) => <span key={n} className="bx-pay-badge" style={{ ["--pc" as string]: c }}>{n}</span>)}</div>
      </Reveal>
    </div></section>
  );
}

const PARTNER_ROWS: [string, string[]][] = [
  ["Payments", ["bKash", "Nagad", "Rocket", "Upay", "SSLCommerz", "VISA", "Mastercard", "Amex"]],
  ["Delivery & messaging", ["Pathao", "RedX", "SteadFast", "Paperfly", "eCourier", "Brevo", "ReveSMS", "SendPulse"]],
];
function Partners() {
  const t = useT();
  return (
    <section className="bx-sec bx-partners" style={{ paddingTop: 0 }}><div className="bx-wrap bx-center">
      <Reveal><span className="bx-kicker">{t("Integrations")}</span>
        <h2 className="bx-h2">{t("Plays well with your stack")}</h2>
        <p className="bx-lead">{t("Payments, couriers and messaging connect in clicks — not weeks.")}</p></Reveal>
    </div>
      {PARTNER_ROWS.map(([label, names], ri) => (
        <div key={ri} className="bx-pmarq" aria-label={t(label)}>
          <div className={`bx-pmarq-track${ri % 2 ? " rev" : ""}`}>
            {[...names, ...names].map((n, i) => <span key={i} className="bx-partner-pill">{n}</span>)}
          </div>
        </div>))}
    </section>
  );
}

function Steps() {
  const t = useT();
  const steps = [
    { t: "Create your account", d: "Sign up in 30 seconds. No credit card, no sales calls.", g: "#6c4cf1" },
    { t: "Add your products", d: "Import with CSV or add manually — photos, variants, inventory.", g: "#b44dff" },
    { t: "Start selling", d: "Share your link, take orders online and in-store with POS.", g: "#ff6b4a" },
  ];
  return (
    <section className="bx-sec" id="how" style={{ paddingTop: 0 }}><div className="bx-wrap">
      <Reveal><span className="bx-kicker">{t("How it works")}</span>
        <h2 className="bx-h2">{t("Live before lunch")}</h2>
        <p className="bx-lead">{t("Three steps between you and your first sale.")}</p></Reveal>
      <div className="bx-steps">{steps.map((s, i) => (
        <Reveal key={s.t} d={`d${i}`}><div className="bx-step" style={{ ["--sg" as string]: s.g }}><div className="n">{i + 1}</div><h3>{t(s.t)}</h3><p>{t(s.d)}</p></div></Reveal>))}
      </div>
    </div></section>
  );
}

const MINI_PRODS: [string, number, string, number][] = [["Tote", 29, "👜", 210], ["Sneakers", 79, "👟", 350], ["Mug", 18, "☕", 25], ["Jacket", 120, "🧥", 220]];

/* A mini storefront that feels alive: auto-rotating hero, scrolling
   announcement, ticking cart badge, pulsing LIVE dot. Demo data comes from
   the backend (/platform/demo-themes). */
type DemoTheme = { id: string; name: string; products: Array<{ id: string; title: string; price: number; compareAt: number | null; images: string[] }>; heroImage: string };
function LiveMini({ id, phase, demo }: { id: string; phase: number; demo?: DemoTheme }) {
  const t = useT();
  const def = THEMES.find((x) => x.id === id)!;
  const th = def.theme;
  const [slide, setSlide] = useState(0);
  const [cart, setCart] = useState(2);
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    const to = setTimeout(() => { iv = setInterval(() => setSlide((s) => (s + 1) % 3), 3600); }, phase);
    return () => { clearTimeout(to); if (iv) clearInterval(iv); };
  }, [phase]);
  useEffect(() => {
    const iv = setInterval(() => setCart((c) => (c >= 9 ? 1 : c + 1)), 4800 + phase);
    return () => clearInterval(iv);
  }, [phase]);
  const heroPhotos = [0, 1, 2].map((i) => demo?.heroImage ?? NICHE_HERO[id] ?? nichePhoto(id, i + 4));
  const minis: [string, number, string][] = demo?.products?.length
    ? demo.products.slice(0, 4).map((p) => [p.title, p.price, p.images[0] ?? ""])
    : MINI_PRODS.map(([n, pr, em, hu], i) => [n, pr, productArt(i, em, hu)]);
  const miniPhotos = demo?.products?.length
    ? minis.map((m) => m[2])
    : minis.map((_, i) => nichePhoto(id, i) ?? "");
  const titles = [th.sections.find((s) => s.type === "hero")?.slides?.[0]?.title || "New Season", t("Flash Sale"), t("Bestsellers")];
  return (
    <div className={"bx-tmini shop preview tpl-" + th.template} style={themeStyle(th)} aria-hidden>
      <div className="bx-mini-anno"><div className="bx-mini-anno-track"><span>{t("Free delivery over ৳1000")} ✦ {t("New collection is live")} ✦ {t("Free delivery over ৳1000")} ✦ {t("New collection is live")} ✦&nbsp;</span></div></div>
      <div className="bx-tmini-bar"><i /><i /><i /><em>demo.becho.com</em><b className="bx-mini-live"><span className="live-dot" />{t("LIVE")}</b></div>
      <div className="bx-mini-nav"><b>Demo</b><span className="ic">⌕</span><span className="ic">◉</span><span className="ic bx-mini-cart">🛒<i key={cart}>{cart}</i></span></div>
      <div className="bx-mini-hero">
        {heroPhotos.map((src, i) => (
          <div key={i} className={`bx-mini-slide${i === slide ? " on" : ""}`}>
            {src && <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
          </div>
        ))}
        <em>{titles[slide]}</em>
        <div className="bx-mini-dots">{heroPhotos.map((_, i) => <i key={i} className={i === slide ? "on" : ""} />)}</div>
      </div>
      <div className="bx-tmini-grid">{minis.map(([n, pr], i) => (
        <div key={i}><div className="bx-mini-prod">{miniPhotos[i] && <img src={miniPhotos[i]} alt={n} loading="lazy" />}<button tabIndex={-1}>+</button></div><b>{n}</b><s>৳{pr}</s></div>))}</div>
    </div>
  );
}

function tiltOn(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--tx", `${(-y * 7).toFixed(2)}deg`);
  el.style.setProperty("--ty", `${(x * 9).toFixed(2)}deg`);
}
function tiltOff(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--tx", "0deg");
  e.currentTarget.style.setProperty("--ty", "0deg");
}

function Themes() {
  const t = useT();
  const c = useLanding();
  const { data: demoData } = useLoad(() => api.platform.demoThemes.list().catch(() => ({ themes: [] as DemoTheme[] })), []);
  const demoMap = new Map((demoData?.themes ?? []).map((d) => [d.id, d]));
  const visible = c.themes.visible.length ? THEMES.filter((th) => c.themes.visible.includes(th.id)) : THEMES;
  const ordered = [...visible].sort((a, b) => {
    if (a.id === c.themes.featured) return -1;
    if (b.id === c.themes.featured) return 1;
    return 0;
  });
  return (
    <section className="bx-sec" id="themes" style={{ paddingTop: 0 }}><div className="bx-wrap">
      <Reveal><span className="bx-kicker">{t("Design")}</span>
        <h2 className="bx-h2">{t("Signature themes, endless possibilities")}</h2>
        <p className="bx-lead">{t("Start from a polished theme, then make it yours with drag-and-drop sections.")}</p></Reveal>
      <div className="bx-themes">{ordered.map((th, i) => (
        <Reveal key={th.id} d={`d${i % 4}`}><Link to={`/preview/${th.id}`} className={"bx-theme tilt" + (th.id === c.themes.featured ? " featured" : "")} onMouseMove={tiltOn} onMouseLeave={tiltOff}>
          {th.id === c.themes.featured && <span className="bx-theme-flag">{t("Featured")}</span>}
          <LiveMini id={th.id} phase={i * 1300} demo={demoMap.get(th.id)} />
          <div>{th.name}<small>{th.desc} · {t("Live preview")} →</small></div>
        </Link></Reveal>))}
      </div>
    </div></section>
  );
}

function Pricing() {
  const t = useT();
  const lc = useLanding();
  const [cycle, setCycle] = useState(0);
  const c = BILLING_CYCLES[cycle];
  const order: Plan[] = ["Starter", "Growth", "Pro"];
  const dynPlans = { Starter: lc.pricing.starter, Growth: lc.pricing.growth, Pro: lc.pricing.pro };
  const [copied, setCopied] = useState(false);
  const copyPromo = () => {
    try { void navigator.clipboard?.writeText("BECHO10"); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="bx-sec" id="pricing" style={{ paddingTop: 0 }}><div className="bx-wrap bx-center">
      <Reveal><span className="bx-kicker">{t("Pricing")}</span>
        <h2 className="bx-h2">{t("Simple pricing that grows with you")}</h2>
        <p className="bx-lead">{t("Start free for 14 days. Upgrade, downgrade or cancel anytime.")}</p>
        <div className="bx-fee">✦ {lc.pricing.note}</div>
        <div className="bx-toggle" role="tablist" aria-label={t("Billing cycle")}>{BILLING_CYCLES.map((b, i) => (
          <button key={b.id} role="tab" aria-selected={i === cycle} className={i === cycle ? "on" : ""} onClick={() => setCycle(i)}>
            {t(b.label)}{b.off > 0 && <span className="bx-off">−{Math.round(b.off * 100)}%</span>}
          </button>))}</div>
      </Reveal>
      <div className="bx-plans" style={{ textAlign: "left" }}>{order.map((p, i) => (
        <Reveal key={p} d={`d${i}`}><div className={`bx-plan${p === "Growth" ? " pop" : ""}`}>
          {p === "Growth" && <span className="bx-pop-tag">{t("Most popular")}</span>}
          <h3>{p}</h3>
          <div className="pr"><CountUp to={cyclePrice(dynPlans, p, c)} prefix="৳" /><small>/{c.months === 1 ? t("month") : `${c.months} ${t("months")}`}</small></div>
          <div className="pd">{c.months === 1 ? t("Billed monthly") : c.months === 12 ? t("Billed yearly") : `${t("Billed every")} ${c.months} ${t("months")}`} · {t("14-day free trial")}</div>
          {c.months > 1 && <div className="pm">≈ ৳{cycleMonthly(dynPlans, p, c).toLocaleString()}{t("/month")}</div>}
          <ul>{PLAN_FEATS[p].map((f) => <li key={f}>{t(f)}</li>)}</ul>
          <Link to="/signup" className={`bx-btn shine${p === "Growth" ? "" : " plain"}`}>{t("Start free trial")}</Link>
        </div></Reveal>))}
      </div>
      <Reveal><button className="bx-promo" onClick={copyPromo} title={t("Click to copy")}>
        {copied ? `✓ ${t("Copied!")}` : <>{t("Promo code")}: <b>BECHO10</b> · {t("10% off your first payment")}</>}
      </button></Reveal>
      <Reveal><div className="bx-compare-wrap">
        <h3 className="bx-h3">{t("Compare plans in detail")}</h3>
        <div className="bx-compare-scroll"><table className="bx-compare">
          <thead><tr><th scope="col"><span className="sr">{t("Feature")}</span></th>{order.map((p) => <th key={p} scope="col">{p}</th>)}</tr></thead>
          <tbody>{COMPARE_ROWS.map((r) => (
            <tr key={r.f}><th scope="row">{t(r.f)}</th>{r.v.map((v, j) => (
              <td key={j}>{v === true ? <span className="bx-yes" aria-label={t("Included")}>✓</span> : v === false ? <span className="bx-no" aria-hidden>—</span> : t(String(v))}</td>))}</tr>))}
          </tbody>
        </table></div>
      </div></Reveal>
    </div></section>
  );
}

function Testimonials() {
  const t = useT();
  const lc = useLanding();
  const track = useRef<HTMLDivElement>(null);
  const slide = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".bx-testi");
    el.scrollBy({ left: dir * ((card ? card.offsetWidth : 360) + 22), behavior: "smooth" });
  };
  const COLORS = ["#ec4899", "#0ea5e9", "#f59e0b", "#6c4cf1", "#10b981"];
  if (!lc.testimonials.length) return null;
  return (
    <section className="bx-sec" style={{ paddingTop: 0 }}><div className="bx-wrap">
      <Reveal><div className="bx-center"><span className="bx-kicker">{t("Loved by merchants")}</span>
        <h2 className="bx-h2">{t("Merchants grow faster on Becho")}</h2>
        <p className="bx-lead">{t("Real stores, real results — from Dhaka to Sylhet.")}</p></div></Reveal>
      <div className="bx-testi-wrap">
        <button className="bx-testi-arrow left" onClick={() => slide(-1)} aria-label={t("Previous")}>←</button>
        <div className="bx-testis" ref={track}>{lc.testimonials.map((q, i) => (
          <Reveal key={q.name} d={`d${i % 3}`} cls="bx-testi-cell"><figure className="bx-testi">
            <div className="bx-stars">{"★".repeat(q.rating)}{"☆".repeat(Math.max(0, 5 - q.rating))}</div>
            <blockquote>“{q.text}”</blockquote>
            <figcaption><span className="bx-ava" style={{ background: COLORS[i % COLORS.length] }}>{q.name[0]}</span><span><b>{q.name}</b><small>{q.role}</small></span></figcaption>
          </figure></Reveal>))}
        </div>
        <button className="bx-testi-arrow right" onClick={() => slide(1)} aria-label={t("Next")}>→</button>
      </div>
    </div></section>
  );
}

function Faq() {
  const t = useT();
  const lc = useLanding();
  return (
    <section className="bx-sec" id="faq" style={{ paddingTop: 0 }}><div className="bx-wrap">
      <Reveal><div className="bx-center"><span className="bx-kicker">{t("FAQ")}</span>
        <h2 className="bx-h2">{t("Questions, answered")}</h2></div>
        <div className="bx-faq">{lc.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </Reveal>
    </div></section>
  );
}

function Footer() {
  const t = useT();
  const cols: [string, { k: string; to: string }[]][] = [
    [t("Product"), [
      { k: "Features", to: "/#features" }, { k: "Themes", to: "/#themes" },
      { k: "Pricing", to: "/#pricing" }, { k: "Live demo", to: "/demo/minimal" },
      { k: "Integrations", to: "/integrations" },
    ]],
    [t("Company"), [
      { k: "About", to: "/about" }, { k: "Contact", to: "/contact" },
      { k: "Terms", to: "/terms" }, { k: "Privacy", to: "/privacy" },
    ]],
    [t("Resources"), [
      { k: "Help center", to: "/docs" }, { k: "Free migration", to: "/migration" },
      { k: "FAQ", to: "/#faq" },
    ]],
  ];
  return (
    <footer className="bx-foot"><div className="bx-wrap">
      <div className="bx-foot-grid">
        <div><Link to="/" className="bx-logo" style={{ marginBottom: 16 }}><span className="bx-logo-mark">◈</span>Becho</Link>
          <p>{t("The commerce platform for ambitious brands. Sell anything, anywhere.")}</p></div>
        {cols.map(([h, ls]) => <div key={h}><h4>{h}</h4><ul>{ls.map((l) => (
          <li key={l.k}>{l.to.startsWith("/#")
            ? <a href={l.to}>{t(l.k)}</a>
            : <Link to={l.to}>{t(l.k)}</Link>}</li>))}</ul></div>)}
      </div>
      <div className="bx-foot-pay">
        <span>{t("Pay with")}</span>
        <div className="bx-pay-badges">{PAY_BADGES.map(([n, c]) => <span key={n} className="bx-pay-badge sm2" style={{ ["--pc" as string]: c }}>{n}</span>)}</div>
        <div className="bx-soc">{SOCIALS.map((s) => <span key={s} title={s}>{s}</span>)}</div>
      </div>
      <div className="bx-foot-bar"><span>© 2026 Becho Inc. {t("All rights reserved.")}</span><span><Link to="/terms">{t("Terms")}</Link> · <Link to="/privacy">{t("Privacy")}</Link> · {t("Made for merchants everywhere")}</span></div>
    </div></footer>
  );
}

export default function Landing() {
  const t = useT();
  const [dk, setDk] = useState(() => { try { return localStorage.getItem("bx-theme") === "dark"; } catch { return false; } });
  const toggleDk = () => setDk((v) => { const n = !v; try { localStorage.setItem("bx-theme", n ? "dark" : "light"); } catch { /* noop */ } return n; });
  const { data: landing } = useLoad(() => api.platform.landing.get().catch(() => defaultLanding()), []);
  const c = landing ?? defaultLanding();
  return (
    <LandingCtx.Provider value={c}>
    <div className={dk ? "bx dk" : "bx"}>
      {c.announcement.on && <div className="bx-announce">{c.announcement.text}</div>}
      <Nav dk={dk} onToggleDk={toggleDk} />
      <Hero />
      <Marquee />
      <Features />
      <PayStrip />
      <Partners />
      <Steps />
      <Themes />
      <Pricing />
      <Testimonials />
      <Faq />
      <section className="bx-sec" id="cta" style={{ paddingTop: 0 }}><div className="bx-wrap">
        <Reveal><div className="bx-cta">
          <div className="bx-cta-orbs" aria-hidden><i /><i /><i /></div>
          <h2>{c.cta.title}</h2>
          <p>{c.cta.subtitle}</p>
          <Link to="/signup" className="bx-btn light shine">{c.cta.button}</Link>
          <div className="bx-cta-note">{c.hero.note}</div>
          <div className="bx-trust-badges" aria-hidden>
            {[t("SSL secured checkout"), t("bKash · Nagad · Rocket"), t("0% transaction fee"), t("বাংলা support")].map((b) => (
              <span key={b}><i>✓</i>{b}</span>))}
          </div>
        </div></Reveal>
      </div></section>
      <Footer />
    </div>
    </LandingCtx.Provider>
  );
}

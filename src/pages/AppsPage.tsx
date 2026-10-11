import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageHeader, Loading, toast, Confirm, Modal } from "../components/polaris";
import { Card } from "../components/ui";
import { APP_CATALOG, APP_CATEGORIES, type StoreApp } from "../lib/appstore";
import { useLoad } from "../lib/useLoad";
import { useT } from "../lib/fx";
import { useAuth } from "../store/auth";
import type { AppsConfig } from "../types";

function stars(r: number) { return "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)); }

/** Maps a builtin app to its on/off flag in AppsConfig. */
function flagOf(apps: AppsConfig, builtin: string): boolean {
  switch (builtin) {
    case "bar": return apps.bar.on;
    case "reviews": return apps.reviews.on;
    case "email-popups": return apps.emailPopups.on;
    case "live-chat": return apps.liveChat.on;
    case "currency": return apps.currency.on;
    case "insta-feed": return apps.instaFeed.on;
    case "faq-page": return apps.faqPage.on;
    case "back-in-stock": return apps.backInStock.on;
    default: return false;
  }
}
function withFlag(apps: AppsConfig, builtin: string, on: boolean): AppsConfig {
  switch (builtin) {
    case "bar": return { ...apps, bar: { ...apps.bar, on } };
    case "reviews": return { ...apps, reviews: { ...apps.reviews, on } };
    case "email-popups": return { ...apps, emailPopups: { ...apps.emailPopups, on } };
    case "live-chat": return { ...apps, liveChat: { ...apps.liveChat, on } };
    case "currency": return { ...apps, currency: { ...apps.currency, on } };
    case "insta-feed": return { ...apps, instaFeed: { ...apps.instaFeed, on } };
    case "faq-page": return { ...apps, faqPage: { ...apps.faqPage, on } };
    case "back-in-stock": return { ...apps, backInStock: { ...apps.backInStock, on } };
    default: return apps;
  }
}
const FLAG_BUILTINS = ["bar", "reviews", "email-popups", "live-chat", "currency", "insta-feed", "faq-page", "back-in-stock"];

function AppCard({ app, installed, onOpen, onToggle }: { app: StoreApp; installed: boolean; onOpen(): void; onToggle(): void }) {
  const t = useT();
  return (
    <div className="card">
      <div className="between">
        <span style={{ fontSize: 32 }}>{app.icon}</span>
        <button className="btn s" onClick={onToggle}>{installed ? t("Installed") : t("Install")}</button>
      </div>
      <b>{app.name}</b>
      <div className="mu-t">{app.tagline}</div>
      <div className="mu-t">{stars(app.rating)} {app.rating} ({app.reviews}) · {app.price}</div>
      <button className="btn s plain" style={{ marginTop: 6 }} onClick={onOpen}>{t("View details")}</button>
    </div>
  );
}

function BuiltinSettings({ app, apps, save }: { app: StoreApp; apps: AppsConfig; save(next: AppsConfig): Promise<void> }) {
  const t = useT();
  const [instaSrc, setInstaSrc] = useState("");
  if (app.builtin === "bar") {
    return (
      <div style={{ marginTop: 12 }}>
        <label>{t("Banner text")}<input defaultValue={apps.bar.text} onBlur={(e) => { if (e.target.value !== apps.bar.text) void save({ ...apps, bar: { ...apps.bar, text: e.target.value } }); }} /></label>
        <label className="check"><input type="checkbox" checked={apps.bar.on} onChange={(e) => void save({ ...apps, bar: { ...apps.bar, on: e.target.checked } })} />{t("Show on storefront")}</label>
      </div>
    );
  }
  if (app.builtin === "reviews") {
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={apps.reviews.on} onChange={(e) => void save({ ...apps, reviews: { on: e.target.checked } })} />{t("Enable product reviews on storefront")}</label>
        <p className="mu-t">{t("Moderate customer reviews from this app's listing below.")}</p>
      </div>
    );
  }
  if (app.builtin === "email-popups") {
    const c = apps.emailPopups;
    const set = (p: Partial<typeof c>) => save({ ...apps, emailPopups: { ...c, ...p } });
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={c.on} onChange={(e) => void set({ on: e.target.checked })} />{t("Show popup on storefront")}</label>
        <label>{t("Title")}<input defaultValue={c.title} onBlur={(e) => e.target.value !== c.title && void set({ title: e.target.value })} /></label>
        <label>{t("Text")}<input defaultValue={c.text} onBlur={(e) => e.target.value !== c.text && void set({ text: e.target.value })} /></label>
        <div className="row">
          <label>{t("Delay (seconds)")}<input type="number" min={3} defaultValue={c.delaySec} onBlur={(e) => void set({ delaySec: Math.max(3, +e.target.value || 12) })} /></label>
          <label>{t("Discount code")}<input defaultValue={c.code} onBlur={(e) => e.target.value !== c.code && void set({ code: e.target.value })} /></label>
        </div>
      </div>
    );
  }
  if (app.builtin === "live-chat") {
    const c = apps.liveChat;
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={c.on} onChange={(e) => void save({ ...apps, liveChat: { ...c, on: e.target.checked } })} />{t("Show chat bubble on storefront")}</label>
        <label>{t("Welcome message")}<input defaultValue={c.welcome} onBlur={(e) => e.target.value !== c.welcome && void save({ ...apps, liveChat: { ...c, welcome: e.target.value } })} /></label>
        <p className="mu-t">{t("Customer messages arrive as support tickets — reply from the Support page.")}</p>
      </div>
    );
  }
  if (app.builtin === "currency") {
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={apps.currency.on} onChange={(e) => void save({ ...apps, currency: { on: e.target.checked } })} />{t("Show currency switcher in storefront header")}</label>
        <p className="mu-t">{t("Uses your Settings → Taxes & currency rates.")}</p>
      </div>
    );
  }
  if (app.builtin === "insta-feed") {
    const c = apps.instaFeed;
    const addImg = () => {
      if (!instaSrc.trim()) return;
      void save({ ...apps, instaFeed: { ...c, images: [...c.images, { src: instaSrc.trim() }] } });
      setInstaSrc("");
    };
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={c.on} onChange={(e) => void save({ ...apps, instaFeed: { ...c, on: e.target.checked } })} />{t("Show Instagram gallery on homepage")}</label>
        <div className="row">
          <input placeholder={t("Image URL")} aria-label={t("Image URL")} value={instaSrc} onChange={(e) => setInstaSrc(e.target.value)} style={{ flex: 1 }} />
          <button className="btn s" onClick={addImg}>{t("Add")}</button>
        </div>
        <div className="app-insta-admin">{c.images.map((im, i) => (
          <span key={i}><img src={im.src} alt="" /><button aria-label={t("Remove")} onClick={() => void save({ ...apps, instaFeed: { ...c, images: c.images.filter((_, x) => x !== i) } })}>✕</button></span>))}
        </div>
        {!c.images.length && <p className="mu-t">{t("No images yet — paste image URLs above.")}</p>}
      </div>
    );
  }
  if (app.builtin === "faq-page") {
    const c = apps.faqPage;
    const [q, setQ] = useState(""); const [a, setA] = useState("");
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={c.on} onChange={(e) => void save({ ...apps, faqPage: { ...c, on: e.target.checked } })} />{t("Enable FAQ page")}</label>
        <p className="mu-t"><Link to="/shop/faq">{t("View FAQ page")} →</Link></p>
        {c.items.map((f, i) => (
          <div key={i} className="between"><span><b>{f.q}</b><div className="mu-t">{f.a}</div></span>
            <button className="btn s plain" onClick={() => void save({ ...apps, faqPage: { ...c, items: c.items.filter((_, x) => x !== i) } })}>{t("Delete")}</button></div>))}
        <div className="row"><input placeholder={t("Question")} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
          <input placeholder={t("Answer")} value={a} onChange={(e) => setA(e.target.value)} style={{ flex: 2 }} />
          <button className="btn s" disabled={!q.trim() || !a.trim()} onClick={() => { void save({ ...apps, faqPage: { ...c, items: [...c.items, { q: q.trim(), a: a.trim() }] } }); setQ(""); setA(""); }}>{t("Add")}</button></div>
      </div>
    );
  }
  if (app.builtin === "back-in-stock") {
    return (
      <div style={{ marginTop: 12 }}>
        <label className="check"><input type="checkbox" checked={apps.backInStock.on} onChange={(e) => void save({ ...apps, backInStock: { on: e.target.checked } })} />{t("Show 'Notify me' on sold-out products")}</label>
        <p className="mu-t">{t("View alert requests and send notifications from the app's details.")}</p>
      </div>
    );
  }
  if (app.route) {
    return (
      <div style={{ marginTop: 12 }}>
        <Link to={app.route} className="btn s">{t("Open dashboard")} →</Link>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 12 }}>
      <label className="check"><input type="checkbox" checked={(apps.installed ?? []).includes(app.id)}
        onChange={(e) => { const ids = apps.installed ?? []; void save({ ...apps, installed: e.target.checked ? [...ids, app.id] : ids.filter((x) => x !== app.id) }); }} />{t("Enabled")}</label>
    </div>
  );
}

export default function AppsPage() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([api.apps.get(storeId), api.reviews.list(storeId), api.products.list(storeId), api.stockAlerts.list(storeId)]), [storeId]);
  const [tab, setTab] = useState<"store" | "installed">("store");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<StoreApp | null>(null);
  const [confirmUn, setConfirmUn] = useState<StoreApp | null>(null);
  if (!data) return <Loading />;
  const [apps, reviews, products, alerts] = data;
  const isInstalled = (a: StoreApp) => a.builtin
    ? (FLAG_BUILTINS.includes(a.builtin) ? flagOf(apps, a.builtin) : (apps.installed ?? []).includes(a.id))
    : (apps.installed ?? []).includes(a.id);
  const save = async (next: AppsConfig) => { await api.apps.save(storeId, next); reload(); };
  const install = async (a: StoreApp) => {
    if (a.builtin && FLAG_BUILTINS.includes(a.builtin)) await save(withFlag(apps, a.builtin, true));
    else await save({ ...apps, installed: [...(apps.installed ?? []), a.id] });
    toast(`${a.name} ${t("Installed").toLowerCase()}`);
  };
  const uninstall = async (a: StoreApp) => {
    if (a.builtin && FLAG_BUILTINS.includes(a.builtin)) await save(withFlag(apps, a.builtin, false));
    else await save({ ...apps, installed: (apps.installed ?? []).filter((x) => x !== a.id) });
    setConfirmUn(null); setOpen(null); toast(t("Uninstalled") + `: ${a.name}`);
  };
  const list = APP_CATALOG.filter((a) =>
    (cat === "All" || a.category === cat) &&
    (q.trim() === "" || `${a.name} ${a.tagline} ${a.description}`.toLowerCase().includes(q.trim().toLowerCase())));
  const installedApps = APP_CATALOG.filter(isInstalled);
  const notify = async (productId: string) => {
    const n = await api.stockAlerts.notify(storeId, productId);
    toast(t("{n} alerts sent").replace("{n}", String(n))); reload();
  };
  return (
    <>
      <PageHeader title={t("Apps")} />
      <div className="seg" role="tablist" aria-label={t("Apps sections")} style={{ marginBottom: 12 }}>
        {(["store", "installed"] as const).map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} className={"btn s" + (tab === tb ? " on" : "")} onClick={() => setTab(tb)}>
            {tb === "store" ? t("App store") : `${t("Installed")} (${installedApps.length})`}
          </button>))}
      </div>
      {tab === "store" && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <input type="search" placeholder={t("Search apps")} aria-label={t("Search apps")} value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, maxWidth: 320 }} />
            <select aria-label={t("Category")} value={cat} onChange={(e) => setCat(e.target.value)}>
              {["All", ...APP_CATEGORIES].map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="grid">{list.map((a) => (
            <AppCard key={a.id} app={a} installed={isInstalled(a)} onOpen={() => setOpen(a)}
              onToggle={() => void (isInstalled(a) ? setConfirmUn(a) : install(a))} />
          ))}</div>
          {!list.length && <p className="mu-t">{t("No apps match your search.")}</p>}
        </>
      )}
      {tab === "installed" && (
        <>
          {!installedApps.length && <p className="mu-t">{t("No apps installed yet. Browse the app store to add some.")}</p>}
          {installedApps.map((a) => (
            <Card key={a.id}>
              <div className="between">
                <div><span style={{ fontSize: 24, marginRight: 8 }}>{a.icon}</span><b>{a.name}</b><div className="mu-t">{a.tagline}</div></div>
                <div>
                  <button className="btn s" onClick={() => setOpen(a)}>{t("Settings")}</button>{" "}
                  <button className="btn s" onClick={() => setConfirmUn(a)}>{t("Uninstall")}</button>
                </div>
              </div>
              {a.builtin && <BuiltinSettings app={a} apps={apps} save={save} />}
            </Card>
          ))}
          {reviews.length > 0 && (
            <Card><b>{t("Product reviews awaiting moderation")}</b>
              <table><tbody>{reviews.map((r) => <tr key={r.id}>
                <td>{products.find((p) => p.id === r.productId)?.title ?? "-"}</td>
                <td>{"★".repeat(r.stars)}</td><td>{r.name}: {r.text}</td>
                <td><button className="btn s" onClick={async () => { await api.reviews.remove(storeId, r.id); reload(); }}>{t("Delete")}</button></td>
              </tr>)}</tbody></table></Card>
          )}
          {alerts.length > 0 && (
            <Card><b>🔔 {t("Back-in-stock alert requests")}</b>
              <table><thead><tr><th>{t("Product")}</th><th>{t("Email")}</th><th>{t("Status")}</th><th></th></tr></thead>
              <tbody>{alerts.map((al) => <tr key={al.id}>
                <td>{products.find((p) => p.id === al.productId)?.title ?? al.productId}</td>
                <td>{al.email}</td><td>{al.notified ? t("Notified") : t("Waiting")}</td>
                <td>{!al.notified && <button className="btn s" onClick={() => void notify(al.productId)}>{t("Send alert")}</button>}</td>
              </tr>)}</tbody></table></Card>
          )}
        </>
      )}
      {open && (
        <Modal open title={open.name} onClose={() => setOpen(null)} wide>
          <div className="between">
            <div><span style={{ fontSize: 40 }}>{open.icon}</span>
              <div className="mu-t">{open.tagline}</div>
              <div className="mu-t">{stars(open.rating)} {open.rating} · {open.reviews} reviews · {open.price} · {open.category}</div></div>
            <button className="btn" onClick={() => void (isInstalled(open) ? setConfirmUn(open) : install(open))}>
              {isInstalled(open) ? t("Uninstall") : t("Install")}
            </button>
          </div>
          <p>{open.description}</p>
          <b>{t("Highlights")}</b>
          <ul>{open.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          {isInstalled(open) && open.builtin && <BuiltinSettings app={open} apps={apps} save={save} />}
        </Modal>
      )}
      {confirmUn && (
        <Confirm open title={`${t("Uninstall")} ${confirmUn.name}?`} message={t("The app will stop working on your storefront. You can reinstall it anytime.")} confirmLabel={t("Uninstall")}
          onClose={() => setConfirmUn(null)} onConfirm={() => void uninstall(confirmUn)} />
      )}
    </>
  );
}

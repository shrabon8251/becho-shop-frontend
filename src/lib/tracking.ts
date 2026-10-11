import type { Settings } from "../types";

type TrackingCfg = NonNullable<Settings["tracking"]>;

declare global {
  interface Window { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void; ttq?: { page(): void; track(n: string, p?: Record<string, unknown>): void }; dataLayer?: unknown[] }
}

let initializedFor = "";

/**
 * Pixel IDs are merchant-supplied and get interpolated into inline scripts and
 * script URLs. Allowlist them so a hostile value can never break out of the
 * string literal / URL and run arbitrary JS in shoppers' browsers (stored XSS).
 * Fail closed: an invalid ID simply disables that pixel.
 */
const PIXEL_ID_RE = /^[A-Za-z0-9._-]+$/;
function cleanPixelId(raw?: string | null): string | undefined {
  const id = raw?.trim();
  return id && PIXEL_ID_RE.test(id) ? id : undefined;
}

/** Inject a script tag once. Failures (adblock, offline) are swallowed — tracking is best-effort. */
function inject(src: string, id: string, inline?: string) {
  try {
    if (document.getElementById(id)) return;
    if (inline) {
      const s = document.createElement("script");
      s.id = id; s.text = inline;
      document.head.appendChild(s);
    }
    const s = document.createElement("script");
    s.id = id + "-src"; s.async = true; s.src = src;
    document.head.appendChild(s);
  } catch { /* tracking must never break the store */ }
}

/**
 * Load Meta Pixel, GA4, Google Tag Manager and TikTok Pixel from the IDs the
 * merchant pasted in Settings → Tracking. Call once per settings object.
 */
export function initTracking(cfg?: TrackingCfg) {
  if (typeof document === "undefined" || !cfg) return;
  const key = JSON.stringify(cfg);
  if (initializedFor === key) return;
  initializedFor = key;
  const metaId = cleanPixelId(cfg.metaPixelId);
  if (metaId) {
    const id = metaId;
    inject("https://connect.facebook.net/en_US/fbevents.js", "becho-fbp", `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${id}');`);
  }
  const ga4Id = cleanPixelId(cfg.ga4Id);
  if (ga4Id) {
    const id = ga4Id;
    inject(`https://www.googletagmanager.com/gtag/js?id=${id}`, "becho-ga4", `
      window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
      window.gtag=gtag;gtag('js',new Date());gtag('config','${id}');`);
  }
  const gtmId = cleanPixelId(cfg.gtmId);
  if (gtmId) {
    const id = gtmId;
    inject(`https://www.googletagmanager.com/gtm.js?id=${id}`, "becho-gtm", `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
      (window,document,'script','dataLayer','${id}');`);
  }
  const tiktokId = cleanPixelId(cfg.tiktokId);
  if (tiktokId) {
    const id = tiktokId;
    inject("https://analytics.tiktok.com/i18n/pixel/events.js", "becho-ttq", `
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.load=function(e){var n="https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=n;ttq._t=ttq._t||{};
      ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=e;var o=document.createElement("script");
      o.type="text/javascript";o.async=!0;o.src=n+"?sdkid="+e+"&lib="+t;
      var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${id}');ttq.page();}(window,document,'ttq');`);
  }
}

export type TrackEventName = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
export interface TrackParams { value?: number; currency?: string; content_ids?: string[]; content_name?: string; num_items?: number }

/** Fire a standard ecommerce event to every loaded pixel. Best-effort, never throws. */
export function trackEvent(name: TrackEventName, params: TrackParams = {}) {
  try {
    const w = window as Window;
    if (w.fbq) {
      if (name === "PageView") w.fbq("track", "PageView");
      else if (name === "Purchase") w.fbq("track", "Purchase", { value: params.value, currency: params.currency });
      else w.fbq("track", name, params);
    }
    if (w.gtag) {
      const gaName = name === "PageView" ? "page_view" : name === "Purchase" ? "purchase" : name === "ViewContent" ? "view_item" : name === "AddToCart" ? "add_to_cart" : "begin_checkout";
      w.gtag("event", gaName, { value: params.value, currency: params.currency, items: (params.content_ids ?? []).map((id) => ({ item_id: id })) });
    }
    if (w.ttq) {
      if (name === "PageView") w.ttq.page();
      else if (name === "Purchase") w.ttq.track("CompletePayment", { value: params.value, currency: params.currency });
      else w.ttq.track(name, params as Record<string, unknown>);
    }
  } catch { /* ignore */ }
}

/** True when at least one pixel ID is configured (for admin "active" badges). */
export function trackingActive(cfg?: TrackingCfg): boolean {
  return !!cfg && [cfg.metaPixelId, cfg.ga4Id, cfg.gtmId, cfg.tiktokId].some((x) => x?.trim());
}

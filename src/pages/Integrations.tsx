import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import { PAYMENT_PROVIDERS } from "../lib/payments";
import { COURIERS } from "../lib/couriers";
import { PageShell } from "../components/PageShell";

const MARKETING = [
  { name: "Meta Pixel", tag: "ViewContent, AddToCart, Purchase events fire automatically", color: "#1877F2" },
  { name: "Google Analytics 4", tag: "Full ecommerce event tracking with your GA4 ID", color: "#F59E0B" },
  { name: "Google Tag Manager", tag: "Drop in your GTM container, done", color: "#4285F4" },
  { name: "TikTok Pixel", tag: "Track ad performance on TikTok", color: "#111111" },
];
const NOTIFY = [
  { name: "Email", tag: "Order updates with editable templates", color: "#6C4CF1" },
  { name: "SMS", tag: "Order and delivery alerts to customer phones", color: "#10B981" },
];

function Group({ h, items }: { h: string; items: { name: string; tag: string; color: string }[] }) {
  const t = useT();
  return (
    <section>
      <h2>{t(h)}</h2>
      <div className="bx-int-grid">
        {items.map((x) => (
          <div key={x.name} className="bx-int-card">
            <span className="bx-int-dot" style={{ background: x.color }} />
            <div><b>{x.name}</b><p>{t(x.tag)}</p></div>
            <span className="bx-int-built">{t("Built-in")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Integrations() {
  const t = useT();
  return (
    <PageShell kicker="Ecosystem" title="Integrations"
      lead="Payments, couriers, marketing and notifications — connect everything from one dashboard. API keys stay on the server, never in your browser.">
      <Group h="Payments" items={PAYMENT_PROVIDERS.map((m) => ({ name: m.name, tag: m.tagline, color: m.color }))} />
      <Group h="Couriers" items={COURIERS.map((c) => ({ name: c.name, tag: c.tagline, color: c.color }))} />
      <Group h="Marketing & analytics" items={MARKETING} />
      <Group h="Notifications" items={NOTIFY} />
      <section>
        <h2>{t("Developers")}</h2>
        <p>{t("REST API, webhooks and API keys for everything else. Build your own integrations on a documented platform.")}</p>
        <p className="mu-t">{t("API documentation ships with the platform — ask support for access.")}</p>
      </section>
      <p><Link to="/signup" className="bx-btn shine">{t("Connect your store")}</Link></p>
    </PageShell>
  );
}

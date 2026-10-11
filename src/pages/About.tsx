import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import { PageShell } from "../components/PageShell";

export default function About() {
  const t = useT();
  const values = [
    { e: "🇧🇩", h: "Bangladesh first", d: "bKash, Nagad, Rocket, COD and Bangla language are core features — not afterthoughts." },
    { e: "💰", h: "0% transaction fee", d: "Your sales stay yours on every plan. No commission per order, ever." },
    { e: "⚡", h: "Fast by default", d: "Optimized storefronts, cached APIs and indexed queries keep every page snappy." },
    { e: "🔒", h: "Serious about security", d: "Hashed passwords, encrypted traffic, tenant-isolated data and audit logs." },
  ];
  return (
    <PageShell kicker="Company" title="About Becho"
      lead="Becho (বেচো — “sell!”) is the commerce platform built for Bangladeshi merchants who want to sell online without the technical headache.">
      <section className="bx-about-grid">
        {values.map((v) => (
          <div key={v.h} className="bx-about-card"><span className="bx-about-e">{v.e}</span><h3>{t(v.h)}</h3><p>{t(v.d)}</p></div>
        ))}
      </section>
      <section>
        <h2>{t("What you get")}</h2>
        <div className="bx-about-stats">
          {[["10+", "designer themes"], ["8", "payment methods"], ["5", "courier partners"], ["2", "languages"]].map(([n, l]) => (
            <div key={l}><b>{n}</b><span>{t(l)}</span></div>
          ))}
        </div>
        <p>{t("One dashboard for your online store, point of sale, inventory, orders, customers, discounts, marketing and analytics — plus 10 designer themes you can preview live before you commit.")}</p>
        <p>{t("Start with a 14-day free trial. Pick monthly, 3-month, 6-month or yearly billing and save up to 30%.")}{" "}<Link to="/#pricing">{t("See pricing")}</Link></p>
      </section>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import { PageShell } from "../components/PageShell";

export default function Migration() {
  const t = useT();
  const steps = [
    { n: "1", h: "Export from your old platform", d: "Download the CSV exports for products, customers and orders. Every major platform supports this." },
    { n: "2", h: "Import into Becho", d: "Use Settings → Import in your dashboard. The importer maps columns for you and reports every skipped row." },
    { n: "3", h: "Pick a theme & go live", d: "Choose one of 10 designer themes, connect bKash/Nagad and your courier — then point your domain over." },
  ];
  return (
    <PageShell kicker="Switch to Becho" title="Free migration"
      lead="Moving from spreadsheets, Facebook or another platform? Bring your catalog with you — the tools are free, and our team helps with larger catalogs.">
      <div className="bx-mig-steps">
        {steps.map((s) => (
          <div key={s.n} className="bx-mig-step"><span className="n">{s.n}</span><div><h3>{t(s.h)}</h3><p>{t(s.d)}</p></div></div>
        ))}
      </div>
      <section>
        <h2>{t("What moves over")}</h2>
        <div className="bx-compare-scroll"><table className="bx-compare"><tbody>
          {[[t("Products, variants & images"), "✓"], [t("Customers & order history"), "✓"], [t("Discount codes"), "✓"], [t("Blog posts & pages"), "✓"]].map(([a, b]) => (
            <tr key={a as string}><td style={{ textAlign: "left" }}>{a}</td><td><span className="bx-yes">{b}</span></td></tr>
          ))}
        </tbody></table></div>
        <p className="mu-t">{t("Passwords can't be migrated (they're hashed) — your customers simply reset theirs once.")}</p>
      </section>
      <p><Link to="/signup" className="bx-btn shine">{t("Start free and migrate")}</Link> <Link to="/contact" className="bx-btn shine plain">{t("Ask about migration")}</Link></p>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import "../landing.css";

/** Shared shell for public marketing pages (about, integrations, docs, contact...). */
export function PageShell({ kicker, title, lead, children, wide }: {
  kicker: string; title: string; lead?: string; children: React.ReactNode; wide?: boolean;
}) {
  const t = useT();
  return (
    <div className="bx bx-doc-page">
      <div className="bx-blob b1" /><div className="bx-blob b2" />
      <Link to="/" className="bx-back">← Becho</Link>
      <article className="bx-doc" style={wide ? { maxWidth: 1080 } : undefined}>
        <span className="bx-kicker">{t(kicker)}</span>
        <h1>{t(title)}</h1>
        {lead && <p className="bx-doc-lead">{t(lead)}</p>}
        {children}
        <div className="bx-page-cta">
          <h2>{t("Ready to start selling?")}</h2>
          <p>{t("14-day free trial · No credit card required · Cancel anytime")}</p>
          <Link to="/signup" className="bx-btn shine">{t("Start free trial")}</Link>
        </div>
      </article>
    </div>
  );
}

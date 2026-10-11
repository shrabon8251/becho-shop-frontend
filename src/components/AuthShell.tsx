import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import "../landing.css";

/** Shared premium shell for login / signup / forgot-password pages. */
export default function AuthShell({ title, subtitle, children, mode }: {
  title: string; subtitle: string; children: React.ReactNode; mode: "login" | "signup" | "forgot";
}) {
  const t = useT();
  return (
    <div className="bx-auth">
      <div className="bx-auth-side">
        <Link to="/" className="bx-auth-logo"><span className="bx-logo-m">B</span>Becho</Link>
        <h2>{mode === "login" ? t("Welcome back") : mode === "signup" ? t("Start selling today") : t("Reset your password")}</h2>
        <ul>
          <li><i>✓</i>{t("Launch your online store in minutes")}</li>
          <li><i>✓</i>{t("bKash, Nagad, Rocket & cards accepted")}</li>
          <li><i>✓</i>{t("Courier delivery across Bangladesh")}</li>
        </ul>
        <div className="bx-auth-side-foot">{t("Trusted by 2,000+ Bangladeshi sellers")}</div>
        <i className="bx-blob b1" /><i className="bx-blob b2" />
      </div>
      <div className="bx-auth-main">
        <div className="bx-auth-card">
          <h1>{title}</h1>
          <p className="bx-auth-sub">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

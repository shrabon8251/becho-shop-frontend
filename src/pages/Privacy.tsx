import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import "../landing.css";

function Sec({ h, children }: { h: string; children: React.ReactNode }) {
  return <section><h2>{h}</h2><div>{children}</div></section>;
}

export default function Privacy() {
  const t = useT();
  return (
    <div className="bx bx-doc-page">
      <div className="bx-blob b1" /><div className="bx-blob b2" />
      <Link to="/" className="bx-back">← Becho</Link>
      <article className="bx-doc">
        <span className="bx-kicker">{t("Legal")}</span>
        <h1>{t("Privacy Policy")}</h1>
        <p className="bx-doc-upd">{t("Last updated")}: 5 {t("October")} 2026</p>

        <Sec h={t("1. What we collect")}>
          <p>{t("To run your store we collect: your name, email, phone and password (stored hashed, never in plain text); your store's products, orders, customers and settings; and basic technical logs that keep the platform secure.")}</p>
          <p>{t("Your customers' data (names, addresses, order history) belongs to you — Becho only processes it to operate your store.")}</p>
        </Sec>

        <Sec h={t("2. How we use it")}>
          <ul>
            <li>{t("Running your store, checkout, payments and deliveries")}</li>
            <li>{t("Sending order updates and security alerts")}</li>
            <li>{t("Preventing fraud and abuse")}</li>
            <li>{t("Improving Becho (only with aggregated, non-identifying statistics)")}</li>
          </ul>
          <p>{t("We do not sell your personal data. We do not show ads based on it.")}</p>
        </Sec>

        <Sec h={t("3. Who we share it with")}>
          <p>{t("Only as needed to run your store: payment providers (bKash, Nagad, Rocket, card gateways), courier partners you connect, and email/SMS providers you enable. Everyone else sees nothing.")}</p>
        </Sec>

        <Sec h={t("4. Cookies")}>
          <p>{t("We use essential cookies to keep you logged in, remember your language and theme, and keep the site secure. No advertising trackers.")}</p>
        </Sec>

        <Sec h={t("5. Security")}>
          <p>{t("Passwords are hashed with Argon2id, traffic is encrypted with TLS, and access to production data is limited to people who need it. No system is perfect — if you spot a problem, tell us and we will fix it fast.")}</p>
        </Sec>

        <Sec h={t("6. Your rights")}>
          <p>{t("You can export your store data anytime from Settings, ask us to correct it, or delete your account — deleting removes your personal data, keeping only what the law requires for invoices and tax records.")}</p>
        </Sec>

        <Sec h={t("7. Changes")}>
          <p>{t("If this policy changes in an important way, we will tell you before it takes effect.")}</p>
        </Sec>

        <Sec h={t("8. Contact")}>
          <p>{t("Privacy questions?")} <Link to="/contact">{t("Contact us")}</Link> {t("— we reply in Bangla or English.")}</p>
        </Sec>
      </article>
    </div>
  );
}

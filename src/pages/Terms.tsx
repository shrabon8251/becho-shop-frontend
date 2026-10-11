import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import "../landing.css";

function Sec({ h, children }: { h: string; children: React.ReactNode }) {
  return <section><h2>{h}</h2><div>{children}</div></section>;
}

export default function Terms() {
  const t = useT();
  return (
    <div className="bx bx-doc-page">
      <div className="bx-blob b1" /><div className="bx-blob b2" />
      <Link to="/" className="bx-back">← Becho</Link>
      <article className="bx-doc">
        <span className="bx-kicker">{t("Legal")}</span>
        <h1>{t("Terms of Service")}</h1>
        <p className="bx-doc-upd">{t("Last updated")}: 5 {t("October")} 2026</p>

        <Sec h={t("1. The service")}>
          <p>{t("Becho provides a hosted multi-tenant commerce platform: an online store builder, admin dashboard, point of sale, payments, courier and marketing tools. By creating an account you agree to these terms.")}</p>
        </Sec>

        <Sec h={t("2. Your account")}>
          <p>{t("You must provide accurate information when you sign up. You are responsible for keeping your password secret and for everything that happens under your account. One account per business is recommended; staff accounts are managed inside your store.")}</p>
        </Sec>

        <Sec h={t("3. Free trial and billing")}>
          <p>{t("Every plan starts with a 14-day free trial — no card required. When the trial ends, your store pauses until you choose a paid plan. Plans are billed per your chosen cycle (monthly, 3, 6 or 12 months). Longer cycles are discounted; promo codes apply to the first invoice only. You can upgrade, downgrade or cancel anytime from Billing — cancellation stops future charges, and you can export your data before you leave.")}</p>
          <p>{t("Becho charges 0% transaction fee on all plans. Payment gateway charges (bKash, Nagad, cards) are set by the providers themselves.")}</p>
        </Sec>

        <Sec h={t("4. What you sell")}>
          <p>{t("You are responsible for your products, prices, taxes, shipping and customer service. You must not sell illegal goods, infringe intellectual property, or use Becho for fraud, spam or phishing. We may suspend stores that break the law or these terms.")}</p>
        </Sec>

        <Sec h={t("5. Acceptable use")}>
          <p>{t("Do not abuse the platform: no hacking, no scraping other merchants' stores, no sending spam through Becho emails or SMS, and no reselling your admin access. API and webhook usage must respect rate limits.")}</p>
        </Sec>

        <Sec h={t("6. Uptime and support")}>
          <p>{t("We work hard to keep Becho fast and available, and we publish honest status updates when something breaks. Support is provided in Bangla and English through the help center and contact page.")}</p>
        </Sec>

        <Sec h={t("7. Liability")}>
          <p>{t("Becho is provided as-is. To the extent the law allows, we are not liable for indirect losses such as lost profits. Our total liability is limited to the fees you paid in the 3 months before the claim.")}</p>
        </Sec>

        <Sec h={t("8. Changes")}>
          <p>{t("We may update these terms as Becho grows. Material changes will be announced in advance; continuing to use Becho after the change means you accept the new terms.")}</p>
        </Sec>

        <Sec h={t("9. Contact")}>
          <p>{t("Questions about these terms? Reach us from the contact page and we will reply in Bangla or English.")} <Link to="/contact">{t("Contact us")}</Link></p>
        </Sec>
      </article>
    </div>
  );
}

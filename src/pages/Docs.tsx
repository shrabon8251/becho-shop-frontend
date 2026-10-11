import { Link } from "react-router-dom";
import { useT } from "../lib/fx";
import { PageShell } from "../components/PageShell";

const GUIDES: { c: string; items: { q: string; a: string }[] }[] = [
  {
    c: "Getting started",
    items: [
      { q: "How do I launch my store?", a: "Sign up, pick a plan (14-day free trial), choose one of 10 designer themes, add your first product — you're live. The dashboard's Get started checklist walks you through it." },
      { q: "Can I use my own domain?", a: "Yes. Point your domain's DNS to your Becho store from Settings → Domains, and SSL is handled automatically." },
      { q: "How do I accept bKash / Nagad?", a: "Go to Settings → Payments and enable the providers you want. Online gateways need API credentials (kept securely on the server); manual MFS just needs your merchant number and you confirm each TrxID." },
    ],
  },
  {
    c: "Orders & shipping",
    items: [
      { q: "How do courier integrations work?", a: "Connect Pathao, RedX, SteadFast, Paperfly or eCourier from the Couriers page with your API credentials. Then create consignments in one click from any order and track them on a live timeline." },
      { q: "What is the fraud check?", a: "Every order is scored on the phone number, address patterns and order history, plus IP intelligence. Risky orders are flagged before you ship." },
      { q: "Cash on delivery?", a: "COD is built in. Mark orders paid when cash arrives; SteadFast and others reconcile COD automatically." },
    ],
  },
  {
    c: "Billing",
    items: [
      { q: "How does the free trial work?", a: "14 days, every feature, no credit card. When it ends your store pauses until you pick a plan — nothing is charged silently." },
      { q: "Which billing cycles are available?", a: "Monthly, 3 months (−10%), 6 months (−20%) and yearly (−30%). Switch or cancel anytime from Billing." },
      { q: "Is there really 0% transaction fee?", a: "Yes. Becho takes no cut of your sales on any plan. Your payment provider's own gateway charges still apply." },
      { q: "Do promo codes work?", a: "Yes — codes like BECHO10 apply to your first invoice. Merchants can also create discount codes for their own customers." },
    ],
  },
];

export default function Docs() {
  const t = useT();
  return (
    <PageShell kicker="Help center" title="Docs & guides" wide
      lead="Short, practical answers. Still stuck? Contact us — we reply in Bangla or English.">
      {GUIDES.map((g) => (
        <section key={g.c}>
          <h2>{t(g.c)}</h2>
          <div className="bx-faq">{g.items.map((x) => (
            <details key={x.q}><summary>{t(x.q)}</summary><p>{t(x.a)}</p></details>
          ))}</div>
        </section>
      ))}
      <p><Link to="/contact" className="bx-btn shine plain">{t("Contact support")}</Link></p>
    </PageShell>
  );
}

import { useState } from "react";
import { useT } from "../../lib/fx";
import { useShopData } from "../../lib/shop";
import { Loading } from "../../components/polaris";

/** FAQ Page app: searchable FAQ section on the storefront, managed by the merchant. */
export default function FaqPage() {
  const t = useT();
  const d = useShopData();
  const [q, setQ] = useState("");
  if (!d) return <Loading />;
  const items = d.apps.faqPage.items;
  const list = items.filter((x) =>
    !q.trim() || `${x.q} ${x.a}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="page faq-page">
      <h1>❓ {t("Frequently asked questions")}</h1>
      <input className="faq-search" type="search" placeholder={t("Search questions…")} aria-label={t("Search")}
        value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((f, i) => (
        <details key={i} className="card faq-item"><summary>{f.q}</summary><p className="mu-t">{f.a}</p></details>
      ))}
      {!list.length && <p className="mu-t">{t("No questions match your search.")}</p>}
    </div>
  );
}

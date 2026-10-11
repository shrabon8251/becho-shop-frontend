import { money } from "../lib/money";
import { useT } from "../lib/fx";
import type { Totals } from "../lib/calc";
export function Breakdown({ c, cur, fmt, gift }: { c: Totals; cur: string; fmt?: (n: number) => string; gift?: number }) {
  const t = useT();
  const f = fmt ?? ((n: number) => money(n, cur));
  const rows: [string, number][] = [[t("Subtotal"), c.sub]];
  if (c.disc > 0) rows.push([c.discLabel ? `${t("Discount")} (${c.discLabel})` : t("Discount"), -c.disc]);
  rows.push([c.shipName ? `${t("Shipping")} (${c.shipName})` : t("Shipping"), c.ship]);
  if (c.duties > 0) rows.push([t("Duties"), c.duties]);
  rows.push([c.taxRate > 0 ? `${t("Tax")} (${c.taxRate}%)` : t("Tax"), c.tax]);
  return (
    <div style={{ margin: "10px 0" }}>
      {rows.map(([k, v]) => <div key={k} className="between"><span className="mu-t">{k}</span><span>{f(v)}</span></div>)}
      <div className="between" style={{ fontWeight: 700 }}><span>{t("Total")}</span><span>{f(c.total)}</span></div>
      {gift !== undefined && gift > 0 && <>
        <div className="between"><span className="mu-t">{t("Gift card")}</span><span>{f(-gift)}</span></div>
        <div className="between" style={{ fontWeight: 700 }}><span>To pay</span><span>{f(Math.max(0, c.total - gift))}</span></div></>}
    </div>
  );
}

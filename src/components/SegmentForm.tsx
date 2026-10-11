import { useState } from "react";
import { segmentMatches, type CustomerStats } from "../lib/segments";
import { money } from "../lib/money";
import { PageHeader } from "./polaris";
import { useT } from "../lib/fx";
import { Card } from "./ui";
import type { Customer, CustomerSegment, SegmentCondition } from "../types";

const FIELDS = [
  { id: "totalSpent", label: "Total spent", numeric: true },
  { id: "ordersCount", label: "Orders placed", numeric: true },
  { id: "tag", label: "Customer tag", numeric: false },
] as const;
type FieldId = (typeof FIELDS)[number]["id"];
const NUM_OPS = [{ id: "gte", label: "is at least" }, { id: "lte", label: "is at most" }, { id: "eq", label: "is exactly" }];
const TAG_OPS = [{ id: "eq", label: "is" }, { id: "contains", label: "contains" }];
const opsFor = (f: FieldId) => (f === "tag" ? TAG_OPS : NUM_OPS);

export default function SegmentForm({ initial, customers, statsOf, currency, onSave, onBack }: {
  initial: CustomerSegment; customers: Customer[]; statsOf(id: string): CustomerStats; currency: string;
  onSave(s: CustomerSegment): void; onBack(): void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<CustomerSegment>(initial);
  const conds = draft.conditions ?? [];
  const setCond = (i: number, patch: Partial<SegmentCondition>) =>
    setDraft((d) => ({ ...d, conditions: (d.conditions ?? []).map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const members = customers.filter((c) => segmentMatches(c, statsOf(c.id), draft));
  return (
    <>
      <PageHeader title={draft.name || t("New segment")} back={onBack}
        actions={<button className="btn" disabled={!draft.name.trim()} onClick={() => onSave({ ...draft, name: draft.name.trim() })}>{t("Save")}</button>} />
      <div className="two">
        <div>
          <Card><label><b>{t("Name")}</b><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t("e.g. VIP")} /></label></Card>
          <Card><b>{t("Conditions")}</b><p className="hint">{t("Customers must match all conditions.")}</p>
            {conds.map((c, i) => (
              <div className="row" key={i} style={{ alignItems: "center" }}>
                <select aria-label={t("Condition field")} value={c.field} style={{ flex: 1.2 }} onChange={(e) => { const f = e.target.value as FieldId; setCond(i, { field: f, op: opsFor(f)[0].id as SegmentCondition["op"] }); }}>
                  {FIELDS.map((f) => <option key={f.id} value={f.id}>{t(f.label)}</option>)}
                </select>
                <select aria-label={t("Condition operator")} value={c.op} style={{ flex: 1.2 }} onChange={(e) => setCond(i, { op: e.target.value as SegmentCondition["op"] })}>
                  {opsFor(c.field).map((o) => <option key={o.id} value={o.id}>{t(o.label)}</option>)}
                </select>
                <input aria-label={t("Condition value")} placeholder={t("Value")} value={c.value} style={{ flex: 1 }} onChange={(e) => setCond(i, { value: e.target.value })} />
                <button className="btn s" aria-label={t("Remove condition")} onClick={() => setDraft({ ...draft, conditions: conds.filter((_, j) => j !== i) })}>✕</button>
              </div>))}
            <button className="btn s" style={{ marginTop: 8 }} onClick={() => setDraft({ ...draft, conditions: [...conds, { field: "totalSpent", op: "gte", value: "" }] })}>{t("Add condition")}</button>
          </Card>
        </div>
        <div>
          <Card><b>{t("Members")} ({members.length})</b>
            {members.slice(0, 10).map((m) => {
              const st = statsOf(m.id);
              return <div className="between line" key={m.id}><span>{m.name}<span className="mu-t"> — {st.ordersCount} {t("orders")} · {money(st.totalSpent, currency)}</span></span></div>;
            })}
            {members.length === 0 && <p className="mu-t">{t("No customers match yet.")}</p>}
            {members.length > 10 && <p className="mu-t">…{t("and")} {members.length - 10} {t("more")}.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}

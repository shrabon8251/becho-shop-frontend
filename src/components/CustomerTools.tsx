import { useState } from "react";
import { api } from "../api";
import { parseCsv, toCsv, unquoteCell } from "../lib/csv";
import { useT } from "../lib/fx";
import { money } from "../lib/money";
import type { Customer } from "../types";
import type { CustomerStats } from "../lib/segments";

const HEAD = ["name", "email", "phone", "tags", "notes"];

export function CustomerTools({ customers, statsOf, currency, storeId, reload }: {
  customers: Customer[]; statsOf(id: string): CustomerStats; currency: string; storeId: string; reload(): void;
}) {
  const t = useT();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const say = (m: string, isErr = false) => { setMsg(m); setErr(isErr); };

  const exportCsv = () => {
    const rows = [HEAD, ...customers.map((c) => [c.name, c.email, c.phone ?? "", (c.tags ?? []).join(";"), c.notes ?? ""])];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click(); URL.revokeObjectURL(url);
    say(`${t("Exported")} ${customers.length} ${t("customers")}.`);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) return say(t("File is too large (max 1 MB)"), true);
    const rows = parseCsv(await file.text()).map((r) => r.map(unquoteCell));
    if (rows.length < 2 || rows.length > 2001) return say(t("The file must have a header and 1 to 2000 rows"), true);
    const idx = HEAD.map((h) => rows[0].map((x) => x.trim().toLowerCase()).indexOf(h));
    if (idx[0] < 0 || idx[1] < 0) return say(t("Missing required columns: name, email"), true);
    const cell = (r: string[], k: number) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
    const existing = new Set(customers.map((c) => c.email.toLowerCase()));
    const seen = new Set<string>();
    const errors: string[] = [];
    let created = 0, skipped = 0;
    for (const [n, r] of rows.slice(1).entries()) {
      const name = cell(r, 0), email = cell(r, 1);
      if (!name) { errors.push(`${t("Row")} ${n + 2}: ${t("name is empty")}`); continue; }
      if (!email.includes("@")) { errors.push(`${t("Row")} ${n + 2}: ${t("invalid email")}`); continue; }
      const key = email.toLowerCase();
      if (existing.has(key) || seen.has(key)) { skipped++; continue; }
      seen.add(key);
      await api.customers.save(storeId, {
        id: crypto.randomUUID(), name, email,
        phone: cell(r, 2) || undefined,
        tags: cell(r, 3) ? cell(r, 3).split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [],
        notes: cell(r, 4) || undefined,
        addresses: [],
      });
      created++;
    }
    say(`${t("Imported")} ${created} ${t("customers")}, ${t("skipped")} ${skipped} ${t("existing")}.${errors.length ? " " + t("Errors") + ": " + errors.slice(0, 5).join("; ") : ""}`, errors.length > 0 && created === 0);
    reload();
  };

  return (
    <div className="row" style={{ alignItems: "center", marginBottom: 12 }}>
      <button className="btn s" onClick={exportCsv}>{t("Export CSV")}</button>
      <label className="btn s" style={{ cursor: "pointer", margin: 0 }}>{t("Import CSV")}
        <input type="file" accept=".csv,text/csv" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {msg && <span className={err ? "er-t" : "mu-t"}>{msg}</span>}
      <span className="mu-t" style={{ marginLeft: "auto" }}>{customers.length} {t("customers")} · {money(customers.reduce((a, c) => a + statsOf(c.id).totalSpent, 0), currency)} {t("lifetime")}</span>
    </div>
  );
}

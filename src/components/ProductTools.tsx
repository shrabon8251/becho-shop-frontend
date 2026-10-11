import { useState } from "react";
import { api } from "../api";
import { parseCsv, toCsv, unquoteCell } from "../lib/csv";
import { useLoad } from "../lib/useLoad";
import type { Product, Variant } from "../types";
import { useT } from "../lib/fx";
const HEAD = ["title", "status", "collection", "variant", "price", "sku", "stock"];
export function ProductTools({ products, storeId, reload }: { products: Product[]; storeId: string; reload(): void }) {
  const t = useT();
  const { data: cols } = useLoad(() => api.collections.list(storeId), [storeId]);
  const [msg, setMsg] = useState("");
  const exportCsv = () => {
    const rows = [HEAD, ...products.flatMap((p) => p.variants.map((v) => [p.title, p.status, cols?.find((c) => c.id === p.collectionId)?.name ?? "", v.name, String(v.price), v.sku, String(v.stock)]))];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "products.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) return setMsg(t("File is too large (max 1 MB)"));
    const rows = parseCsv(await file.text()).map((r) => r.map(unquoteCell));
    if (rows.length < 2 || rows.length > 2001) return setMsg(t("The file must have a header and 1 to 2000 rows"));
    const idx = HEAD.map((h) => rows[0].map((x) => x.trim().toLowerCase()).indexOf(h));
    if (idx[0] < 0 || idx[4] < 0) return setMsg(t("Missing required columns: title, price"));
    const cell = (r: string[], k: number) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
    const grouped = new Map<string, Product>(); const errors: string[] = [];
    rows.slice(1).forEach((r, n) => {
      const title = cell(r, 0); const price = Number(cell(r, 4)); const stock = cell(r, 6) === "" ? 0 : Number(cell(r, 6));
      if (!title) return void errors.push(t(`Row ${n + 2}: title is empty`));
      if (!Number.isFinite(price) || price < 0) return void errors.push(t(`Row ${n + 2}: invalid price`));
      if (!Number.isInteger(stock) || stock < 0) return void errors.push(t(`Row ${n + 2}: invalid stock`));
      const v: Variant = { id: crypto.randomUUID(), name: cell(r, 3) || "Default", price, sku: cell(r, 5), stock };
      const key = title.toLowerCase(); const ex = grouped.get(key);
      if (ex) ex.variants.push(v);
      else grouped.set(key, { id: crypto.randomUUID(), title, status: cell(r, 1) === "Active" ? "Active" : "Draft", collectionId: cols?.find((c) => c.name.toLowerCase() === cell(r, 2).toLowerCase())?.id ?? "", images: [], variants: [v] });
    });
    const existing = new Set(products.map((p) => p.title.toLowerCase()));
    let created = 0, skipped = 0;
    for (const [key, p] of grouped) { if (existing.has(key)) { skipped++; continue; } await api.products.create(storeId, p); created++; }
    setMsg(t(`Imported ${created} product(s), skipped ${skipped} existing.${errors.length ? " Errors: " + errors.slice(0, 5).join("; ") : ""}`));
    reload();
  };
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <button className="btn s" onClick={exportCsv}>{t("Export CSV")}</button>
      <label className="btn s" style={{ cursor: "pointer" }}>{t("Import CSV")}<input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
      {msg && <span className="mu-t">{msg}</span>}
    </div>
  );
}

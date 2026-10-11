export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => {
    const v = /^[=+\-@\t\r]/.test(c) ? "'" + c : c; // avoid spreadsheet formula injection
    return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",")).join("\n");
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = []; let cell = ""; let q = false;
  const endRow = () => { row.push(cell); cell = ""; if (row.some((c) => c !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; endRow(); }
    else cell += ch;
  }
  endRow();
  return rows;
}
export const unquoteCell = (c: string) => (/^'[=+\-@\t\r]/.test(c) ? c.slice(1) : c);

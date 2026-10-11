import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "../lib/fx";
export interface CmdItem { to: string; label: string }
export function CommandPalette({ items }: { items: CmdItem[] }) {
  const t = useT();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [ix, setIx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); setQ(""); setIx(0); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 30); }, [open ]);
  const res = items.filter((i) => (i.label + " " + t(i.label)).toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const go = (to: string) => { setOpen(false); setQ(""); nav(to); };
  if (!open) return (
    <button className="search cmd-k" onClick={() => setOpen(true)} aria-label={t("Search")}>
      <span className="mu-t">{t("Search")}</span><kbd>Ctrl K</kbd>
    </button>
  );
  return (
    <div className="mback" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmd" role="dialog" aria-modal="true" aria-label={t("Quick navigation")}>
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setIx(0); }}
          placeholder={t("Type a page name…")}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIx((x) => Math.min(res.length - 1, x + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIx((x) => Math.max(0, x - 1)); }
            if (e.key === "Enter" && res[ix]) go(res[ix].to);
            if (e.key === "Escape") setOpen(false);
          }} />
        <div className="cmd-list">
          {res.map((i, j) => (
            <button key={i.to} className={j === ix ? "on" : ""} onMouseEnter={() => setIx(j)} onClick={() => go(i.to)}>
              {t(i.label)}<span className="mu-t">{i.to}</span>
            </button>))}
          {!res.length && <p className="mu-t" style={{ padding: 12 }}>{t("No matches")}</p>}
        </div>
      </div>
    </div>
  );
}

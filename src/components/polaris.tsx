import { useEffect, useState, type ReactNode } from "react";
import { useT } from "../lib/fx";
import { create } from "zustand";

/** Toast: call `useToast.getState().show("Saved")` from anywhere. Render <ToastHost /> once (AdminLayout does). */
export const useToast = create<{ msg: string; err: boolean; show(m: string, err?: boolean): void }>()((set) => ({
  msg: "", err: false,
  show: (msg, err = false) => { set({ msg, err }); setTimeout(() => set((s) => (s.msg === msg ? { msg: "" } : s)), 3000); },
}));
export const toast = (m: string, err = false) => useToast.getState().show(m, err);
export function ToastHost() {
  const { msg, err } = useToast();
  return msg ? <div className={"toast" + (err ? " err" : "")} role="status">{msg}</div> : null;
}

/** Page header: optional back arrow, title, action buttons on the right. */
export function PageHeader({ title, back, actions }: { title: ReactNode; back?: () => void; actions?: ReactNode }) {
  const t = useT();
  return (
    <div className="page-h">
      {back && <button className="btn s ico" aria-label={t("Back")} onClick={back}>←</button>}
      <h1>{title}</h1>
      <div className="acts">{actions}</div>
    </div>
  );
}
export const Page = ({ children, ...h }: { title: ReactNode; back?: () => void; actions?: ReactNode; children: ReactNode }) => <><PageHeader {...h} />{children}</>;

export function EmptyState({ title, text, action, art }: { title: string; text?: string; action?: ReactNode; art?: string }) {
  return <div className="empty"><div className="empty-art" aria-hidden>{art ?? "📦"}</div><h3>{title}</h3>{text && <p className="mu-t">{text}</p>}{action}</div>;
}

export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose(): void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll while open
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h"><b>{title}</b><button className="btn s ico" aria-label={t("Close")} onClick={onClose}>✕</button></div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

export interface Col<T> { h: string; cell(x: T): ReactNode; right?: boolean }
interface TableProps<T> {
  items: T[]; id(x: T): string; cols: Col<T>[];
  tabs?: { id: string; label: string }[]; filter?(x: T, tab: string): boolean;
  search?(x: T): string; searchPlaceholder?: string;
  /** Renders bulk actions; presence enables the checkbox column. Call done() to clear the selection. */
  bulk?(ids: string[], done: () => void): ReactNode;
  onRow?(x: T): void; empty?: ReactNode; pageSize?: number;
}
/** Shopify-style index table: tabs, search, checkbox select, bulk bar, pagination. */
export function IndexTable<T>({ items, id, cols, tabs, filter, search, searchPlaceholder = "Search", bulk, onRow, empty, pageSize = 20 }: TableProps<T>) {
  const t = useT();
  const [tab, setTab] = useState(tabs?.[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const reset = () => { setPage(0); setSel([]); };
  const rows = items.filter((x) => (!filter || filter(x, tab)) && (!search || search(x).toLowerCase().includes(q.trim().toLowerCase())));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const shown = rows.slice(p * pageSize, (p + 1) * pageSize);
  const ids = shown.map(id);
  const all = ids.length > 0 && ids.every((i) => sel.includes(i));
  const toggle = (i: string, on: boolean) => setSel(on ? [...sel, i] : sel.filter((x) => x !== i));
  return (
    <div className="card itable">
      {(tabs || search) && (
        <div className="toolbar">
          {tabs && <div className="tabs" role="tablist">{tabs.map((tb) => <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={"tab" + (tab === tb.id ? " on" : "")} onClick={() => { setTab(tb.id); reset(); }}>{tb.label}</button>)}</div>}
          {search && <input className="tsearch" type="search" aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />}
        </div>
      )}
      {rows.length === 0 ? (empty ?? <EmptyState title={t("No results found")} text={t("Try changing the filters or search term.")} />) : (
        <table>
          <thead>
            {sel.length > 0 && bulk ? (
              <tr className="bulk"><th colSpan={cols.length + 1}><span>{sel.length} {t("selected")}</span>{bulk(sel, () => setSel([]))}</th></tr>
            ) : (
              <tr>{bulk && <th style={{ width: 40 }}><input type="checkbox" aria-label={t("Select all")} checked={all} onChange={(e) => setSel(e.target.checked ? ids : [])} /></th>}
                {cols.map((c) => <th key={c.h} style={c.right ? { textAlign: "right" } : undefined}>{c.h}</th>)}</tr>
            )}
          </thead>
          <tbody>{shown.map((x) => (
            <tr key={id(x)} className={onRow ? "click" : ""} tabIndex={onRow ? 0 : undefined}
              onClick={(e) => onRow && !(e.target as HTMLElement).closest("button,a,input,select") && onRow(x)}
              onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onRow?.(x)}>
              {bulk && <td><input type="checkbox" aria-label={t("Select row")} checked={sel.includes(id(x))} onChange={(e) => toggle(id(x), e.target.checked)} /></td>}
              {cols.map((c) => <td key={c.h} style={c.right ? { textAlign: "right" } : undefined}>{c.cell(x)}</td>)}
            </tr>))}
          </tbody>
        </table>
      )}
      {rows.length > pageSize && (
        <div className="pager"><span className="mu-t">{p * pageSize + 1}–{Math.min((p + 1) * pageSize, rows.length)} of {rows.length}</span>
          <button className="btn s" disabled={p === 0} aria-label={t("Previous page")} onClick={() => setPage(p - 1)}>←</button>
          <button className="btn s" disabled={p >= pages - 1} aria-label={t("Next page")} onClick={() => setPage(p + 1)}>→</button></div>
      )}
    </div>
  );
}

/** Shopify-style "Unsaved changes" bar that replaces the top bar while a form is dirty. */
export function SaveBar({ dirty, onSave, onDiscard }: { dirty: boolean; onSave(): void; onDiscard(): void }) {
  const t = useT();
  if (!dirty) return null;
  return (
    <div className="savebar" role="region" aria-label={t("Unsaved changes")}>
      <b>{t("Unsaved changes")}</b>
      <span className="acts"><button className="btn s" onClick={onDiscard}>{t("Discard")}</button><button className="btn" onClick={onSave}>{t("Save")}</button></span>
    </div>
  );
}

/** Tiny inline spinner, e.g. inside a loading button: <button className="btn loading"><Spinner/>Saving…</button> */
export const Spinner = () => <span className="spin" aria-hidden />;

/** Shimmer block used while content loads. */
export function Skeleton({ w, h, r }: { w?: number | string; h?: number | string; r?: number }) {
  return <div className="skel" style={{ width: w ?? "100%", height: h ?? 14, borderRadius: r ?? 6 }} aria-hidden />;
}

/** Page-level loading state — use instead of "Loading..." text. */
export function Loading({ lines = 4 }: { lines?: number }) {
  return (
    <div className="loading" role="status" aria-label="Loading">
      <div className="skel" style={{ width: 180, height: 24, borderRadius: 8 }} />
      {Array.from({ length: lines }, (_, i) => <div key={i} className="skel" style={{ height: 54, borderRadius: 12 }} />)}
    </div>
  );
}

/** Polaris-style confirmation dialog. Replaces window.confirm. */
export function Confirm({ open, title, message, confirmLabel = "Delete", danger = true, onConfirm, onClose }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean;
  onConfirm(): void | Promise<unknown>; onClose(): void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setBusy(false); }, [open ]);
  if (!open) return null;
  const go = async () => { setBusy(true); try { await onConfirm(); } catch { setBusy(false); } };
  return (
    <Modal open={open} title={title} onClose={onClose} footer={
      <>
        <button className="btn s" disabled={busy} onClick={onClose}>{t("Cancel")}</button>
        <button className={"btn" + (danger ? " danger" : "") + (busy ? " loading" : "")} disabled={busy} onClick={go}>
          {busy && <Spinner />}{busy ? t("Working…") : confirmLabel}
        </button>
      </>
    }>
      <div className="mu-t">{message}</div>
    </Modal>
  );
}

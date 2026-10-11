import { useState } from "react";
import { api } from "../api";
import { Confirm, EmptyState, IndexTable, Loading, LoadError, Modal, Page, toast } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Redirect } from "../types";
const blank = { from: "", to: "" };
export default function Redirects() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, error, reload } = useLoad(() => api.redirects.list(storeId), [storeId]);
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState<Redirect | null>(null);
    const [f, setF] = useState(blank);
    const [err, setErr] = useState("");
    const [del, setDel] = useState<Redirect | null>(null);
    if (error) return <LoadError message={error} onRetry={reload} />;
    if (!data) return <Loading />;
    const run = async (fn: () => Promise<unknown>, ok: string) => {
        try { await fn(); toast(ok); reload(); return true; } catch (e) { toast((e as Error).message, true); return false; }
    };
    const startAdd = () => { setEdit(null); setF(blank); setErr(""); setOpen(true); };
    const startEdit = (r: Redirect) => { setEdit(r); setF({ from: r.from, to: r.to }); setErr(""); setOpen(true); };
    const valid = () => {
        if (!f.from.startsWith("/") || f.from.length < 2) return t("The “from” path must start with /");
        if (!f.to.trim()) return t("Enter a destination URL or path");
        if (data.some((r) => r.from === f.from.trim() && r.id !== edit?.id)) return t("A redirect for this path already exists");
        return "";
    };
    const save = async () => {
        const v = valid(); if (v) return setErr(v);
        const ok = await run(
            () => edit
                ? api.redirects.save(storeId, { ...edit, from: f.from.trim(), to: f.to.trim() })
                : api.redirects.save(storeId, { id: crypto.randomUUID(), from: f.from.trim(), to: f.to.trim() }),
            edit ? t("Redirect updated") : t("Redirect added"));
        if (ok) setOpen(false);
    };
    return (
        <Page title={t("URL redirects")} actions={<button className="btn" onClick={startAdd}>{t("Add redirect")}</button>}>
            {data.length ? (
                <IndexTable items={data} id={(r) => r.id} search={(r) => `${r.from} ${r.to}`} searchPlaceholder={t("Search redirects")}
                            cols={[
                                { h: t("From"), cell: (r) => <b className="mono">{r.from}</b> },
                                { h: t("To"), cell: (r) => <span className="mono mu-t">{r.to}</span> },
                                { h: "", right: true, cell: (r) => <><button className="btn s" onClick={() => startEdit(r)}>{t("Edit")}</button>{" "}
                                        <button className="btn s" onClick={() => setDel(r)}>{t("Delete")}</button></> },
                            ]} />
            ) : (
                <EmptyState art="↪️" title={t("No redirects yet")} text={t("Redirect old URLs to new pages so links never break.")} action={<button className="btn" onClick={startAdd}>{t("Add redirect")}</button>} />
            )}
            <p className="mu-t">{t("Redirects apply to storefront URLs on your domain.")}</p>
            <Modal open={open} title={edit ? t("Edit redirect") : t("Add redirect")} onClose={() => setOpen(false)}
                   footer={<><button className="btn s" onClick={() => setOpen(false)}>{t("Cancel")}</button>
                       <button className="btn" onClick={() => void save()}>{t("Save")}</button></>}>
                <label>{t("From path")}<input autoFocus placeholder="/old-page" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
                <label>{t("Redirect to")}<input placeholder="/new-page" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
                {err && <p className="er-t">{err}</p>}
            </Modal>
            {del && <Confirm open title={t("Delete redirect")} message={`${t("Delete redirect")} ${del.from}?`} confirmLabel={t("Delete")}
                             onClose={() => setDel(null)} onConfirm={() => { setDel(null); return run(() => api.redirects.remove(storeId, del.id), t("Redirect deleted")); }} />}
        </Page>
    );
}

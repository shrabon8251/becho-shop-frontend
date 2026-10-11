import { useState } from "react";
import { api } from "../api";
import { Confirm, EmptyState, IndexTable, Loading, LoadError, Modal, Page, toast } from "../components/polaris";
import { Badge } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Webhook } from "../types";
const EVENTS = ["order.created", "order.paid", "product.updated", "customer.created"];
const blank = { event: EVENTS[0], url: "", active: true };
export default function Webhooks() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const actor = useAuth((s) => s.user?.name ?? "Admin");
    const { data, error, reload } = useLoad(() => api.webhooks.list(storeId), [storeId]);
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState<Webhook | null>(null);
    const [f, setF] = useState(blank);
    const [err, setErr] = useState("");
    const [del, setDel] = useState<Webhook | null>(null);
    const [busy, setBusy] = useState("");
    if (error) return <LoadError message={error} onRetry={reload} />;
    if (!data) return <Loading />;
    const run = async (fn: () => Promise<unknown>, ok: string) => {
        try { await fn(); toast(ok); reload(); return true; } catch (e) { toast((e as Error).message, true); return false; }
    };
    const startAdd = () => { setEdit(null); setF(blank); setErr(""); setOpen(true); };
    const startEdit = (w: Webhook) => { setEdit(w); setF({ event: w.event, url: w.url, active: w.active }); setErr(""); setOpen(true); };
    const save = async () => {
        if (!/^https?:\/\/.+\..+/.test(f.url.trim())) return setErr(t("Enter a valid HTTPS URL"));
        const ok = await run(
            () => edit
                ? api.webhooks.save(storeId, { ...edit, event: f.event, url: f.url.trim(), active: f.active })
                : api.webhooks.save(storeId, { id: crypto.randomUUID(), event: f.event, url: f.url.trim(), active: f.active }),
            edit ? t("Webhook updated") : t("Webhook added"));
        if (ok) setOpen(false);
    };
    const ping = async (w: Webhook) => {
        setBusy(w.id);
        try {
            await api.webhooks.ping(storeId, w.id);
            await api.activity.log(storeId, actor, "webhook.test", `${w.event} → ${w.url}`);
            toast(t("Test event sent"));
        } catch (e) { toast((e as Error).message, true); } finally { setBusy(""); }
    };
    const toggle = (w: Webhook) => run(() => api.webhooks.save(storeId, { ...w, active: !w.active }), w.active ? t("Webhook disabled") : t("Webhook enabled"));
    return (
        <Page title={t("Webhooks")} actions={<button className="btn" onClick={startAdd}>{t("Add webhook")}</button>}>
            {data.length ? (
                <IndexTable items={data} id={(w) => w.id} search={(w) => `${w.event} ${w.url}`} searchPlaceholder={t("Search webhooks")}
                            cols={[
                                { h: t("Event"), cell: (w) => <b className="mono">{w.event}</b> },
                                { h: t("URL"), cell: (w) => <span className="mono mu-t">{w.url}</span> },
                                { h: t("Status"), cell: (w) => <Badge t={w.active ? t("Active") : t("Disabled")} /> },
                                { h: "", right: true, cell: (w) => <span className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn s" disabled={busy === w.id} onClick={() => void ping(w)}>{busy === w.id ? t("Sending…") : t("Send test")}</button>
              <button className="btn s" onClick={() => void toggle(w)}>{w.active ? t("Disable") : t("Enable")}</button>
              <button className="btn s" onClick={() => startEdit(w)}>{t("Edit")}</button>
              <button className="btn s" onClick={() => setDel(w)}>{t("Delete")}</button></span> },
                            ]} />
            ) : (
                <EmptyState art="🔔" title={t("No webhooks yet")} text={t("Get notified at your own URL when store events happen.")} action={<button className="btn" onClick={startAdd}>{t("Add webhook")}</button>} />
            )}
            <p className="mu-t">{t("Webhooks POST a JSON payload to your URL when the event fires.")}</p>
            <Modal open={open} title={edit ? t("Edit webhook") : t("Add webhook")} onClose={() => setOpen(false)}
                   footer={<><button className="btn s" onClick={() => setOpen(false)}>{t("Cancel")}</button>
                       <button className="btn" onClick={() => void save()}>{t("Save")}</button></>}>
                <label>{t("Event")}<select value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })}>{EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
                <label>{t("Endpoint URL")}<input autoFocus placeholder="https://example.com/hook" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
                <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />{t("Active")}</label>
                {err && <p className="er-t">{err}</p>}
            </Modal>
            {del && <Confirm open title={t("Delete webhook")} message={`${t("Delete webhook")} ${del.event}?`} confirmLabel={t("Delete")}
                             onClose={() => setDel(null)} onConfirm={() => { setDel(null); return run(() => api.webhooks.remove(storeId, del.id), t("Webhook deleted")); }} />}
        </Page>
    );
}

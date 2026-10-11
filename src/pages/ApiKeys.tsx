import { useState } from "react";
import { api } from "../api";
import { Confirm, EmptyState, IndexTable, Loading, Modal, Page, toast } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { ApiKey } from "../types";
const mask = (k: string) => k.length > 8 ? `${k.slice(0, 4)}…${k.slice(-4)}` : "••••";
export default function ApiKeys() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const actor = useAuth((s) => s.user?.name ?? "Admin");
  const { data, reload } = useLoad(() => api.apiKeys.list(storeId), [storeId]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState<ApiKey | null>(null);
  const [revoke, setRevoke] = useState<ApiKey | null>(null);
  if (!data) return <Loading />;
  const create = async () => {
    if (!name.trim()) return setErr(t("Enter a name for the key"));
    try {
      const k = await api.apiKeys.create(storeId, name.trim());
      await api.activity.log(storeId, actor, "apiKey.created", name.trim());
      setRevealed(k); setOpen(false); setName(""); setErr(""); reload();
    } catch (e) { setErr((e as Error).message); }
  };
  const doRevoke = async () => {
    if (!revoke) return;
    try {
      await api.apiKeys.revoke(storeId, revoke.id);
      await api.activity.log(storeId, actor, "apiKey.revoked", revoke.name);
      toast(t("API key revoked")); setRevoke(null); reload();
    } catch (e) { toast((e as Error).message, true); }
  };
  const copy = async () => {
    if (!revealed) return;
    try { await navigator.clipboard.writeText(revealed.key); toast(t("Copied")); }
    catch { toast(t("Copy failed — select and copy manually"), true); }
  };
  return (
    <Page title={t("API keys")} actions={<button className="btn" onClick={() => { setOpen(true); setErr(""); setName(""); }}>{t("Create key")}</button>}>
      {data.length ? (
        <IndexTable items={data} id={(k) => k.id} search={(k) => k.name} searchPlaceholder={t("Search keys")}
          cols={[
            { h: t("Name"), cell: (k) => <b>{k.name}</b> },
            { h: t("Key"), cell: (k) => <span className="mono mu-t">{mask(k.key)}</span> },
            { h: t("Created"), cell: (k) => new Date(k.createdAt).toLocaleDateString() },
            { h: t("Last used"), cell: (k) => (k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : <span className="mu-t">{t("Never")}</span>) },
            { h: "", right: true, cell: (k) => <button className="btn s" onClick={() => setRevoke(k)}>{t("Revoke")}</button> },
          ]} />
      ) : (
        <EmptyState art="🔑" title={t("No API keys")} text={t("Create keys so external apps can access this store's API.")} action={<button className="btn" onClick={() => setOpen(true)}>{t("Create key")}</button>} />
      )}
      <p className="mu-t">{t("Keep keys secret. Revoked keys stop working immediately.")}</p>
      <Modal open={open} title={t("Create API key")} onClose={() => setOpen(false)}
        footer={<><button className="btn s" onClick={() => setOpen(false)}>{t("Cancel")}</button>
          <button className="btn" onClick={() => void create()}>{t("Create")}</button></>}>
        <label>{t("Key name")}<input autoFocus placeholder={t("e.g. Mobile app")} value={name} onChange={(e) => setName(e.target.value)} /></label>
        {err && <p className="er-t">{err}</p>}
      </Modal>
      <Modal open={!!revealed} title={t("Key created")} onClose={() => setRevealed(null)}
        footer={<button className="btn" onClick={() => setRevealed(null)}>{t("Done")}</button>}>
        <p className="er-t"><b>⚠️ {t("Copy this key now — you won't see it again.")}</b></p>
        <div className="row"><input readOnly className="mono" value={revealed?.key ?? ""} onFocus={(e) => e.target.select()} aria-label={t("API key")} />
          <button className="btn s" onClick={() => void copy()}>{t("Copy")}</button></div>
      </Modal>
      {revoke && <Confirm open title={t("Revoke API key")} message={`${t("Revoke")} “${revoke.name}”? ${t("Apps using it will lose access.")}`} confirmLabel={t("Revoke")}
        onClose={() => setRevoke(null)} onConfirm={() => { const p = doRevoke(); return p; }} />}
    </Page>
  );
}

import { useState } from "react";
import { api } from "../api";
import { IndexTable, Modal, Page, toast, Loading, Confirm } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { StaffRole } from "../types";
import { PERMS, effectivePerms } from "../lib/perms";
const ROLES: StaffRole[] = ["Admin", "Manager", "Support"];
const blank = { name: "", email: "", role: "Support" as StaffRole, permissions: effectivePerms({ role: "Support" }) };
export default function Staff() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => api.staff.list(storeId), [storeId]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [del, setDel] = useState<{ id: string; name: string } | null>(null);
  if (!data) return <Loading />;
  const close = () => { setOpen(false); setF(blank); setErr(""); };
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast(ok); reload(); return true; } catch (e) { toast((e as Error).message, true); return false; } };
  const invite = async () => {
    if (!f.name.trim() || !f.email.includes("@")) return setErr(t("Enter a name and a valid email"));
    if (await run(() => api.staff.save(storeId, { id: crypto.randomUUID(), name: f.name.trim(), email: f.email.trim(), role: f.role, permissions: f.role === "Admin" ? undefined : f.permissions }), "Staff invited")) close();
  };
  return (
    <Page title={t("Staff")} actions={<button className="btn" onClick={() => setOpen(true)}>{t("Invite staff")}</button>}>
      <IndexTable items={data} id={(m) => m.id} search={(m) => `${m.name} ${m.email}`} searchPlaceholder={t("Search staff")}
        cols={[
          { h: t("Name"), cell: (m) => <b>{m.name}</b> },
          { h: t("Email"), cell: (m) => <span className="mu-t">{m.email}</span> },
          { h: t("Role"), cell: (m) => <select className="mini-select" aria-label={`${t("Role")} ${m.name}`} value={m.role} onChange={(e) => void run(() => api.staff.save(storeId, { ...m, role: e.target.value as StaffRole }), t("Role updated"))}>{ROLES.map((r) => <option key={r} value={r}>{t(r)}</option>)}</select> },
          { h: "", right: true, cell: (m) => <button className="btn s" onClick={() => setDel(m)}>{t("Remove")}</button> },
        ]} />
      <p className="mu-t">{t("Role changes apply the next time that person logs in. Access: Admin everything, Manager products/orders/customers/discounts, Support orders/customers. Demo invites get the temporary password welcome123.")}</p>
      <Modal open={open} title={t("Invite staff")} onClose={close} footer={<><button className="btn s" onClick={close}>{t("Cancel")}</button><button className="btn" onClick={() => void invite()}>{t("Send invite")}</button></>}>
        <label>{t("Name")}<input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>{t("Email")}<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>{t("Role")}<select value={f.role} onChange={(e) => { const role = e.target.value as StaffRole; setF({ ...f, role, permissions: effectivePerms({ role }) }); }}>{ROLES.map((r) => <option key={r} value={r}>{t(r)}</option>)}</select></label>
        <fieldset style={{ border: 0, padding: 0, margin: "4px 0" }}><legend className="mu-t">{t("Permissions")}{f.role === "Admin" && ` — ${t("Admins have all permissions")}`}</legend>
          {PERMS.map((pm) => {
            const on = f.role === "Admin" || f.permissions.includes(pm.id);
            return <label key={pm.id} className="check"><input type="checkbox" disabled={f.role === "Admin"} checked={on}
              onChange={(e) => setF({ ...f, permissions: e.target.checked ? [...f.permissions, pm.id] : f.permissions.filter((x) => x !== pm.id) })} />{t(pm.label)}</label>;
          })}</fieldset>
        {err && <p className="er-t">{err}</p>}
      </Modal>
      {del && <Confirm open title={t("Remove staff")} message={`${t("Remove")} ${del.name}?`} confirmLabel={t("Remove")}
        onClose={() => setDel(null)} onConfirm={() => { setDel(null); return run(() => api.staff.remove(storeId, del.id), t("Staff removed")); }} />}
    </Page>
  );
}

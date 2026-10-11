import { useState } from "react";
import { Modal } from "./polaris";
import { renderTemplate, EMAIL_VARS } from "../lib/email";
import { useT } from "../lib/fx";
import type { Automation, AutomationTrigger } from "../types";

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  abandoned_checkout: "Abandoned checkout",
  welcome: "New customer welcome",
  winback: "Win back lapsed customers",
};

export function AutomationForm({ initial, onClose, onSave }: { initial: Automation; onClose(): void; onSave(a: Automation): void }) {
  const t = useT();
  const [a, setA] = useState(initial);
  const [err, setErr] = useState("");
  const save = () => {
    if (!a.name.trim()) return setErr(t("Name is required"));
    if (!a.subject.trim()) return setErr(t("Subject is required"));
    if (!(a.delayHours > 0)) return setErr(t("Delay must be more than 0 hours"));
    onSave({ ...a, name: a.name.trim() });
  };
  return (
    <Modal open onClose={onClose} title={initial.id ? t("Edit automation") : t("New automation")} wide
      footer={<><button className="btn s" onClick={onClose}>{t("Cancel")}</button><button className="btn" onClick={save}>{t("Save")}</button></>}>
      <div className="two">
        <label><span className="mu-t">{t("Name")}</span><input autoFocus value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder={t("e.g. Abandoned checkout reminder")} /></label>
        <label><span className="mu-t">{t("Trigger")}</span>
          <select value={a.trigger} onChange={(e) => setA({ ...a, trigger: e.target.value as AutomationTrigger })}>
            {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map((k) => <option key={k} value={k}>{t(TRIGGER_LABELS[k])}</option>)}
          </select></label>
      </div>
      <label><span className="mu-t">{t("Send after (hours)")}</span><input type="number" min={1} value={a.delayHours} onChange={(e) => setA({ ...a, delayHours: +e.target.value })} /></label>
      <label><span className="mu-t">{t("Subject")}</span><input value={a.subject} onChange={(e) => setA({ ...a, subject: e.target.value })} /></label>
      <label><span className="mu-t">{t("Body — use ")}{EMAIL_VARS.map((v) => `{{${v}}}`).join(", ")}</span>
        <textarea rows={6} value={a.body} onChange={(e) => setA({ ...a, body: e.target.value })} /></label>
      <div className="card" style={{ background: "var(--bg)" }}>
        <p className="mu-t">{t("Preview")}</p>
        <h4 style={{ margin: "4px 0" }}>{renderTemplate(a.subject, { name: "Sara", store: "MyStore", email: "sara@example.com" })}</h4>
        <div style={{ whiteSpace: "pre-wrap" }} className="mu-t">{renderTemplate(a.body, { name: "Sara", store: "MyStore", email: "sara@example.com" })}</div>
      </div>
      {err && <p className="er-t">{err}</p>}
    </Modal>
  );
}

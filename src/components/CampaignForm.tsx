import { useState } from "react";
import { Modal } from "./polaris";
import { renderTemplate, localInputToTs, tsToLocalInput, EMAIL_VARS } from "../lib/email";
import { segmentMembers } from "../lib/segments";
import { useT } from "../lib/fx";
import type { Campaign, Customer, CustomerSegment, Settings } from "../types";

export const CAMPAIGN_STATUS = ["Draft", "Scheduled", "Sent"] as const;

export function campaignStatus(c: Campaign): "Draft" | "Scheduled" | "Sent" {
  return c.status ?? (c.sentAt ? "Sent" : "Draft");
}

/** Email campaign builder: name, audience, subject/body with {{variables}}, preview, send-now or schedule. */
export function CampaignForm({ initial, customers, segments, settings, statsOf, onClose, onSave }: {
  initial: Campaign; customers: Customer[]; segments: CustomerSegment[]; settings: Settings;
  statsOf(id: string): { totalSpent: number; ordersCount: number };
  onClose(): void; onSave(c: Campaign, action: "draft" | "schedule" | "send"): void;
}) {
  const t = useT();
  const [c, setC] = useState<Campaign>({ ...initial, channel: "Email", status: campaignStatus(initial) });
  const [when, setWhen] = useState<"now" | "later">(initial.scheduledAt ? "later" : "now");
  const [at, setAt] = useState(initial.scheduledAt ? tsToLocalInput(initial.scheduledAt) : "");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(false);
  const set = (p: Partial<Campaign>) => { setC({ ...c, ...p }); setErr(""); };
  const seg = segments.find((s) => s.id === c.audienceSegmentId);
  const recipients = seg ? segmentMembers(seg, customers, statsOf).length : customers.length;
  const sample = customers[0];
  const rendered = renderTemplate(c.body ?? "", { name: sample?.name ?? "there", store: settings.storeName, email: sample?.email ?? "" });
  const done = (action: "draft" | "schedule" | "send") => {
    if (!c.name.trim()) return setErr(t("Campaign name is required"));
    if (action !== "draft" && !c.subject?.trim()) return setErr(t("Subject is required to send"));
    if (action === "schedule") {
      const ts = localInputToTs(at);
      if (!ts || ts < Date.now()) return setErr(t("Pick a future date and time"));
      onSave({ ...c, status: "Scheduled", scheduledAt: ts, audience: seg ? seg.name : "All customers", recipients }, "schedule");
    } else if (action === "send") {
      onSave({ ...c, status: "Sent", sentAt: Date.now(), audience: seg ? seg.name : "All customers", recipients }, "send");
    } else {
      onSave({ ...c, status: "Draft", audience: seg ? seg.name : "All customers" }, "draft");
    }
  };
  const sent = campaignStatus(initial) === "Sent";
  return (
    <Modal open onClose={onClose} title={initial.id ? t("Edit campaign") : t("New email campaign")} wide
      footer={<>
        {!sent && <button className="btn s" onClick={() => done("draft")}>{t("Save draft")}</button>}
        {!sent && when === "later" && <button className="btn s" onClick={() => done("schedule")}>{t("Schedule")}</button>}
        {!sent && when === "now" && <button className="btn" onClick={() => done("send")}>{t("Send now")}</button>}
        <button className="btn s" onClick={() => setPreview(!preview)}>{preview ? t("Edit") : t("Preview")}</button>
      </>}>
      {preview ? (
        <div className="card" style={{ background: "var(--bg)" }}>
          <p className="mu-t">{t("To: ")}{c.audienceSegmentId ? seg?.name : t("All customers")} ({recipients} {t("recipients")})</p>
          <h3 style={{ margin: "8px 0" }}>{c.subject || t("(no subject)")}</h3>
          <div style={{ whiteSpace: "pre-wrap" }}>{rendered}</div>
        </div>
      ) : (
        <>
          <label><span className="mu-t">{t("Campaign name")}</span><input autoFocus value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("e.g. Eid Sale newsletter")} /></label>
          <div className="two">
            <label><span className="mu-t">{t("Audience")}</span>
              <select value={c.audienceSegmentId ?? ""} onChange={(e) => set({ audienceSegmentId: e.target.value || undefined })}>
                <option value="">{t("All customers")} ({customers.length})</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></label>
            <label><span className="mu-t">{t("Send")}</span>
              <select value={when} onChange={(e) => setWhen(e.target.value as "now" | "later")}>
                <option value="now">{t("Send immediately")}</option><option value="later">{t("Schedule for later")}</option>
              </select></label>
          </div>
          {when === "later" && <label><span className="mu-t">{t("Scheduled at")}</span><input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} /></label>}
          <label><span className="mu-t">{t("Subject")}</span><input value={c.subject ?? ""} onChange={(e) => set({ subject: e.target.value })} placeholder={t("e.g. 20% off this weekend")} /></label>
          <label><span className="mu-t">{t("Body — use ")}{EMAIL_VARS.map((v) => `{{${v}}}`).join(", ")}</span>
            <textarea rows={8} value={c.body ?? ""} onChange={(e) => set({ body: e.target.value })} placeholder={"Hi {{name}},\n\nBig news from {{store}}…"} /></label>
          <p className="mu-t">{recipients} {t("recipients in this audience.")}</p>
        </>
      )}
      {err && <p className="er-t">{err}</p>}
    </Modal>
  );
}

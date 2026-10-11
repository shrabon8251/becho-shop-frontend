import { useState } from "react";
import { api } from "../api";
import { useT } from "../lib/fx";
import { PageShell } from "../components/PageShell";

export default function Contact() {
  const t = useT();
  const [f, setF] = useState({ name: "", email: "", topic: "General question", msg: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!f.name.trim()) return setErr(t("Enter your name"));
    if (!f.email.includes("@")) return setErr(t("Enter a valid email"));
    if (f.msg.trim().length < 10) return setErr(t("Tell us a little more (at least 10 characters)"));
    setErr(""); setBusy(true);
    try {
      await api.contact.send({ name: f.name.trim(), email: f.email.trim(), subject: f.topic, message: f.msg.trim() });
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };
  return (
    <PageShell kicker="Support" title="Contact us" lead="Questions, migration help or feedback — we reply in Bangla or English, usually within one business day.">
      {done ? (
        <div className="bx-contact-done">
          <span className="bx-contact-tick">✓</span>
          <h2>{t("Message received!")}</h2>
          <p>{t("Thanks for reaching out — we'll get back to you soon.")}</p>
        </div>
      ) : (
        <div className="bx-contact-form">
          {err && <div className="bx-err">{err}</div>}
          <label><span>{t("Your name")}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Sara Khan" /></label>
          <label><span>{t("Email")}</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="sara@example.com" /></label>
          <label><span>{t("Topic")}</span>
            <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
              {[t("General question"), t("Migration help"), t("Billing"), t("Bug report"), t("Feature request")].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label><span>{t("Message")}</span><textarea rows={5} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} placeholder={t("How can we help?")} /></label>
          <button className="bx-btn shine" disabled={busy} onClick={() => void submit()}>{busy ? t("Sending…") : t("Send message")}</button>
        </div>
      )}
    </PageShell>
  );
}

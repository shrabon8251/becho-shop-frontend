import { useState } from "react";
import { PageHeader, Loading } from "../components/polaris";
import { api } from "../api";
import { Card } from "../components/ui";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
export default function HelpPage() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => api.support.list(storeId), [storeId]);
  const [f, setF] = useState({ subject: "", message: "" });
  const [reply, setReply] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  if (!data) return <Loading />;
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); setErr(""); reload(); } catch (e) { setErr((e as Error).message); } };
  return (
    <>
      <PageHeader title={t("Help")} />
      <Card><b>{t("Contact support")}</b><input placeholder={t("Subject")} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <textarea rows={4} placeholder={t("How can we help?")} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        <button className="btn" onClick={() => run(async () => { await api.support.create(storeId, f.subject, f.message); setF({ subject: "", message: "" }); })}>{t("Send")}</button></Card>
      {err && <p className="er-t">{err}</p>}
      {data.map((tk) => (
        <Card key={tk.id}><div className="between"><b>{tk.subject}</b><span className="mu-t">{tk.status}</span></div>
          <p>{tk.message}</p>
          {tk.replies.map((r, i) => <p key={i} className={r.from === "support" ? "ok-t" : ""}><b>{r.from === "support" ? t("Support") : t("You")}:</b> {r.text}</p>)}
          <div className="row"><input placeholder={t("Reply")} value={reply[tk.id] ?? ""} onChange={(e) => setReply({ ...reply, [tk.id]: e.target.value })} />
            <button className="btn s" onClick={() => run(async () => { await api.support.reply(storeId, tk.id, reply[tk.id] ?? ""); setReply({ ...reply, [tk.id]: "" }); })}>{t("Reply")}</button></div></Card>))}
      {!data.length && <p className="mu-t">{t("No tickets yet.")}</p>}
    </>
  );
}

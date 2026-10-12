import { useState } from "react";
import { PasswordInput } from "../components/PasswordInput";
import { api } from "../api";
import { Card } from "../components/ui";
import { PageHeader, SaveBar, toast, Loading, LoadError } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { NOTIF_EVENTS, NOTIF_VARS, SMS_PROVIDERS, dispatchNotifications, eventChannels, eventTemplate } from "../lib/notify";
import type { Settings } from "../types";

function EventRow({ id, notif, setEvent, setTpl, open, onOpen }: {
    id: string; notif: NonNullable<Settings["notifications"]>;
    setEvent(e: { email: boolean; sms: boolean }): void;
    setTpl(t: { subject: string; emailBody: string; smsBody: string }): void;
    open: boolean; onOpen(): void;
}) {
    const t = useT();
    const def = NOTIF_EVENTS.find((e) => e.id === id)!;
    const ch = eventChannels(notif, id);
    const tpl = eventTemplate(notif, id);
    const test = () => {
        const fakeSettings = { notifications: notif } as Settings;
        const sent = dispatchNotifications(fakeSettings, id, { name: "Test Customer", order_id: "#1042", tracking_link: "https://track.example/ABC123", store: "Demo Store", amount: "৳1,500" }, { email: "test@example.com", phone: "01XXXXXXXXX" });
        toast(sent.length ? t("Test sent via {c}").replace("{c}", sent.map((x) => x.channel).join(" + ")) + " (demo)" : t("Nothing to send — enable a channel first."), !sent.length);
    };
    return (
        <Card>
            <div className="between" style={{ alignItems: "center" }}>
                <div>
                    <b>{def.label}</b>
                    <div className="mu-t">{def.audience === "customer" ? t("Sent to the customer") : t("Sent to you (merchant)")}</div>
                </div>
                <div className="row" style={{ alignItems: "center" }}>
                    <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={ch.email} onChange={(e) => setEvent({ ...ch, email: e.target.checked })} />📧 {t("Email")}</label>
                    <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={ch.sms} onChange={(e) => setEvent({ ...ch, sms: e.target.checked })} />📱 {t("SMS")}</label>
                    <button className="btn s" onClick={onOpen}>{open ? t("Hide template") : t("Edit template")}</button>
                </div>
            </div>
            {open && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                    <p className="mu-t">{t("Variables")}: {NOTIF_VARS.map((v) => <code key={v} className="pill" style={{ marginRight: 4 }}>{v}</code>)}</p>
                    <label><span className="mu-t">{t("Email subject")}</span><input value={tpl.subject} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} /></label>
                    <label><span className="mu-t">{t("Email body")}</span><textarea rows={4} value={tpl.emailBody} onChange={(e) => setTpl({ ...tpl, emailBody: e.target.value })} /></label>
                    <label><span className="mu-t">{t("SMS body")} <span className="mu-t">(160 {t("chars")})</span></span><textarea rows={2} maxLength={320} value={tpl.smsBody} onChange={(e) => setTpl({ ...tpl, smsBody: e.target.value })} /></label>
                    <div className="row" style={{ marginTop: 8 }}><button className="btn s" onClick={test}>{t("Send test")}</button></div>
                </div>
            )}
        </Card>
    );
}

export default function Notifications() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, error, reload } = useLoad(() => api.settings.get(storeId), [storeId]);
    const [base, setBase] = useState<Settings | null>(null);
    const [s, setS] = useState<Settings | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    if (error) return <LoadError message={error} onRetry={reload} />;
    if (!data) return <Loading />;
    const cur: Settings = s ?? data;
    if (!s) { setS(data); setBase(data); }
    const notif = cur.notifications ?? { lowStock: true, abandonedReminders: true };
    const sms = notif.sms ?? {};
    const dirty = base && JSON.stringify(cur) !== JSON.stringify(base);
    const setNotif = (n: NonNullable<Settings["notifications"]>) => setS({ ...cur, notifications: n });
    const save = async () => { await api.settings.save(storeId, cur); setBase(cur); toast(t("Settings saved")); };
    return (
        <div>
            <PageHeader title={t("Notifications")} />
            <p className="mu-t" style={{ marginTop: -8 }}>{t("Choose which events notify customers by email, SMS, or both. Edit every message template.")}</p>
            <Card>
                <b>📧 {t("Email gateway")}</b>
                <p className="mu-t">{t("Customer emails are sent from this address. Required — if empty, no emails will be sent.")}</p>
                <div className="grid2">
                    <label><span className="mu-t">{t("Sender name")} <span className="req">*</span></span>
                        <input placeholder="MyStore" value={cur.emailSender?.name ?? ""} onChange={(e) => setS({ ...cur, emailSender: { ...cur.emailSender, name: e.target.value } })} />
                    </label>
                    <label><span className="mu-t">{t("Sender email")} <span className="req">*</span></span>
                        <input placeholder="orders@mystore.com" value={cur.emailSender?.email ?? ""} onChange={(e) => setS({ ...cur, emailSender: { ...cur.emailSender, email: e.target.value } })} />
                    </label>
                </div>
                {!cur.emailSender?.email && <p className="er-t">⚠️ {t("Sender email is not set — customer emails are currently disabled.")}</p>}
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
                    <b>{t("Brevo API")}</b>
                    <p className="mu-t">{t("Order and stock alert emails are sent through your Brevo account — no platform fallback. If not configured, emails will not be sent.")}</p>
                    <p className="mu-t">💡 {t("Create a free account at brevo.com → get your API key → paste it here. Your sender email must be verified in Brevo. Free tier: 300 emails/day.")}</p>
                    <label><span className="mu-t">{t("Brevo API key")} <span className="req">*</span></span>
                        <PasswordInput autoComplete="new-password" placeholder="xkeysib-••••••" value={cur.brevo?.apiKey ?? ""} onChange={(e) => setS({ ...cur, brevo: { apiKey: e.target.value } })} />
                    </label>
                    {!cur.brevo?.apiKey
                        ? <p className="er-t">⚠️ {t("Brevo not configured — customer emails are currently disabled.")}</p>
                        : <p className="ok-t">✓ {t("Brevo configured")}</p>}
                </div>
            </Card>
            <Card>
                <b>📱 {t("SMS gateway")}</b>
                <p className="mu-t">{t("SMS is sent through your own gateway account — you pay the SMS provider directly per message. Real sending runs on your backend.")}</p>
                <div className="grid2">
                    <label><span className="mu-t">{t("Provider")}</span>
                        <select value={sms.provider ?? ""} onChange={(e) => setNotif({ ...notif, sms: { ...sms, provider: e.target.value } })}>
                            <option value="">{t("Not configured")}</option>
                            {SMS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </label>
                    <label><span className="mu-t">{t("Sender ID")}</span>
                        <input placeholder="8801XXXXXXXXX" value={sms.senderId ?? ""} onChange={(e) => setNotif({ ...notif, sms: { ...sms, senderId: e.target.value } })} />
                    </label>
                </div>
                <label><span className="mu-t">{t("API key")}</span>
                    <PasswordInput autoComplete="off" placeholder="••••••" value={sms.apiKey ?? ""} onChange={(e) => setNotif({ ...notif, sms: { ...sms, apiKey: e.target.value } })} />
                </label>
            </Card>
            {NOTIF_EVENTS.map((e) => (
                <EventRow key={e.id} id={e.id} notif={notif}
                          setEvent={(ch) => setNotif({ ...notif, events: { ...(notif.events ?? {}), [e.id]: ch } })}
                          setTpl={(tpl) => setNotif({ ...notif, templates: { ...(notif.templates ?? {}), [e.id]: tpl } })}
                          open={openId === e.id} onOpen={() => setOpenId(openId === e.id ? null : e.id)} />
            ))}
            <SaveBar dirty={!!dirty} onSave={() => void save()} onDiscard={() => { setS(base); }} />
        </div>
    );
}

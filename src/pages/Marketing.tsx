import { useState } from "react";
import { api } from "../api";
import { Badge, Card } from "../components/ui";
import { AutomationForm, TRIGGER_LABELS } from "../components/AutomationForm";
import { CampaignForm, campaignStatus } from "../components/CampaignForm";
import { Confirm, PageHeader, toast, Loading } from "../components/polaris";
import { money } from "../lib/money";
import { priceMap } from "../lib/orderTotal";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { variantIndex } from "../lib/shop";
import type { AbandonedCheckout, Automation, Campaign, Customer, LoyaltySettings, Order } from "../types";

function makeStatsOf(orders: Order[], prices: Map<string, number>) {
  const spent = new Map<string, number>();
  const count = new Map<string, number>();
  for (const o of orders) {
    if (o.pay !== "Paid" && o.pay !== "Refunded") continue;
    const t = o.items.reduce((a, i) => a + (prices.get(i.variantId) ?? 0) * i.qty, 0);
    spent.set(o.customerId, (spent.get(o.customerId) ?? 0) + t);
    count.set(o.customerId, (count.get(o.customerId) ?? 0) + 1);
  }
  return (id: string) => ({ totalSpent: spent.get(id) ?? 0, ordersCount: count.get(id) ?? 0 });
}

export default function Marketing() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => Promise.all([
    api.campaigns.list(storeId), api.automations.list(storeId), api.abandoned.list(storeId),
    api.customers.list(storeId), api.segments.list(storeId), api.products.list(storeId),
    api.orders.list(storeId), api.settings.get(storeId), api.loyalty.get(storeId),
  ]), [storeId]);
  const [tab, setTab] = useState<"Campaigns" | "Automations" | "Abandoned checkouts" | "Loyalty">("Campaigns");
  const [loyF, setLoyF] = useState<LoyaltySettings | null>(null);
  const [campForm, setCampForm] = useState<Campaign | null>(null);
  const [autoForm, setAutoForm] = useState<Automation | null>(null);
  const [confirmCamp, setConfirmCamp] = useState<Campaign | null>(null);
  const [confirmAuto, setConfirmAuto] = useState<Automation | null>(null);
  if (!data) return <Loading />;
  const [campaigns, automations, abandoned, customers, segments, products, orders, settings, loyalty] = data;
  const loy = loyF ?? loyalty;
  const prices = priceMap(products);
  const idx = variantIndex(products);
  const abValue = (a: AbandonedCheckout) => a.items.reduce((s, i) => s + (idx.get(i.variantId)?.v.price ?? 0) * i.qty, 0);
  const saveCamp = async (c: Campaign, action: "draft" | "schedule" | "send") => {
    await api.campaigns.save(storeId, c);
    setCampForm(null); reload();
    toast(action === "send" ? t("Campaign sent to {n} recipients").replace("{n}", String(c.recipients ?? 0)) : action === "schedule" ? t("Campaign scheduled") : t("Draft saved"));
  };
  const saveAuto = async (a: Automation) => {
    await api.automations.save(storeId, a.id ? a : { ...a, id: crypto.randomUUID() });
    setAutoForm(null); reload(); toast(t("Automation saved"));
  };
  const adjustPts = async (c: Customer) => {
    const raw = window.prompt(t("Points to add (use a negative number to remove) for {n}").replace("{n}", c.name), "10");
    if (raw === null) return;
    const delta = Math.floor(Number(raw));
    if (!delta) return;
    const reason = window.prompt(t("Reason"), t("Manual adjustment")) ?? "";
    try { await api.loyalty.adjust(storeId, c.id, delta, reason); reload(); toast(t("Points updated")); } catch (e) { toast((e as Error).message, true); }
  };
  return (
    <>
      <PageHeader title={t("Marketing")}
        actions={tab === "Campaigns"
          ? <button className="btn" onClick={() => setCampForm({ id: "", name: "", channel: "Email", budget: 0, spent: 0, active: true })}>{t("New campaign")}</button>
          : tab === "Automations" ? <button className="btn" onClick={() => setAutoForm({ id: "", name: "", trigger: "abandoned_checkout", active: true, delayHours: 4, subject: "", body: "" })}>{t("New automation")}</button> : undefined} />
      <div className="seg" role="tablist" aria-label={t("Marketing sections")} style={{ marginBottom: 12 }}>
        {(["Campaigns", "Automations", "Abandoned checkouts", "Loyalty"] as const).map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} className={"btn s" + (tab === tb ? " on" : "")} onClick={() => setTab(tb)}>{t(tb)}</button>))}
      </div>
      {tab === "Campaigns" && (
        <Card>
          {campaigns.length === 0 ? <p className="mu-t">{t("No campaigns yet. Create an email campaign to reach your customers.")}</p> : (
            <table className="ptable"><thead><tr><th>{t("Name")}</th><th>{t("Status")}</th><th>{t("Audience")}</th><th>{t("Recipients")}</th><th>{t("Sent")}</th><th></th></tr></thead>
              <tbody>{campaigns.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b>{c.subject && <div className="mu-t">{c.subject}</div>}</td>
                  <td><Badge t={campaignStatus(c)} /></td>
                  <td className="mu-t">{c.audience ?? "—"}</td>
                  <td>{c.recipients ?? "—"}</td>
                  <td className="mu-t">{c.status === "Scheduled" && c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : c.sentAt ? new Date(c.sentAt).toLocaleString() : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {campaignStatus(c) !== "Sent" && <><button className="btn s" onClick={() => setCampForm(c)}>{t("Edit")}</button>{" "}
                      <button className="btn s" onClick={() => void saveCamp({ ...c, status: "Sent", sentAt: Date.now(), recipients: customers.length, audience: c.audience ?? "All customers" }, "send")}>{t("Send now")}</button>{" "}</>}
                    <button className="btn s" onClick={() => setConfirmCamp(c)}>{t("Delete")}</button>
                  </td>
                </tr>))}
              </tbody></table>)}
        </Card>
      )}
      {tab === "Automations" && (
        <Card>
          <p className="mu-t">{t("Flows run automatically — e.g. a reminder email goes out a few hours after a checkout is abandoned.")}</p>
          {automations.length === 0 ? <p className="mu-t">{t("No automations yet.")}</p> : (
            <table className="ptable"><thead><tr><th>{t("Name")}</th><th>{t("Trigger")}</th><th>{t("Delay")}</th><th>{t("Status")}</th><th></th></tr></thead>
              <tbody>{automations.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name}</b><div className="mu-t">{a.subject}</div></td>
                  <td>{t(TRIGGER_LABELS[a.trigger])}</td>
                  <td className="mu-t">{a.delayHours}h</td>
                  <td><button className="btn s" onClick={async () => { await api.automations.save(storeId, { ...a, active: !a.active }); reload(); }}>{a.active ? t("On") : t("Off")}</button></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn s" onClick={() => setAutoForm(a)}>{t("Edit")}</button>{" "}
                    <button className="btn s" onClick={() => setConfirmAuto(a)}>{t("Delete")}</button>
                  </td>
                </tr>))}
              </tbody></table>)}
        </Card>
      )}
      {tab === "Abandoned checkouts" && (
        <Card>
          {abandoned.length === 0 ? <p className="mu-t">{t("No abandoned checkouts. When a shopper leaves without paying, they'll show up here.")}</p> : (
            <table className="ptable"><thead><tr><th>{t("Customer")}</th><th>{t("Items")}</th><th>{t("Value")}</th><th>{t("Abandoned")}</th><th>{t("Status")}</th><th></th></tr></thead>
              <tbody>{abandoned.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.name ?? "—"}</b><div className="mu-t">{a.email}</div></td>
                  <td className="mu-t">{a.items.map((i) => { const r = idx.get(i.variantId); return `${i.qty} × ${r ? r.p.title : "item"}`; }).join(", ")}</td>
                  <td>{money(abValue(a), settings.currency)}</td>
                  <td className="mu-t">{new Date(a.createdAt).toLocaleString()}</td>
                  <td><Badge t={a.recovered ? t("Recovered") : t("Abandoned")} /></td>
                  <td style={{ textAlign: "right" }}>
                    {!a.recovered && <button className="btn s" onClick={async () => { await api.abandoned.recover(storeId, a.id); reload(); toast(t("Recovery email sent")); }}>{t("Send recovery email")}</button>}
                  </td>
                </tr>))}
              </tbody></table>)}
        </Card>
      )}
      {tab === "Loyalty" && (
        <>
          <Card><b>{t("Loyalty program")}</b>
            <label className="check"><input type="checkbox" checked={loy.enabled} onChange={(e) => setLoyF({ ...loy, enabled: e.target.checked })} /> {t("Enable loyalty program")}</label>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <label className="mu-t">{t("Spend amount")}<input type="number" min={1} value={loy.earnPer} onChange={(e) => setLoyF({ ...loy, earnPer: Math.max(1, +e.target.value || 1) })} /></label>
              <label className="mu-t">{t("Points earned")}<input type="number" min={1} value={loy.earnPoints} onChange={(e) => setLoyF({ ...loy, earnPoints: Math.max(1, +e.target.value || 1) })} /></label>
              <label className="mu-t">{t("Points to redeem")}<input type="number" min={1} value={loy.redeemPoints} onChange={(e) => setLoyF({ ...loy, redeemPoints: Math.max(1, +e.target.value || 1) })} /></label>
              <label className="mu-t">{t("Redeem value")}<input type="number" min={1} value={loy.redeemValue} onChange={(e) => setLoyF({ ...loy, redeemValue: Math.max(1, +e.target.value || 1) })} /></label>
            </div>
            <p className="mu-t">{t("Customers earn {p} points for every {a} spent.").replace("{p}", String(loy.earnPoints)).replace("{a}", money(loy.earnPer, settings.currency))} {t("{r} points can be redeemed for {v}.").replace("{r}", String(loy.redeemPoints)).replace("{v}", money(loy.redeemValue, settings.currency))}</p>
            <button className="btn" onClick={async () => { try { await api.loyalty.save(storeId, loy); setLoyF(null); reload(); toast(t("Loyalty settings saved")); } catch (e) { toast((e as Error).message, true); } }}>{t("Save")}</button>
          </Card>
          <Card><b>{t("Members")}</b>
            {customers.filter((x) => (x.points ?? 0) > 0).length === 0 ? <p className="mu-t">{t("No members with points yet.")}</p> : (
              <table className="ptable"><thead><tr><th>{t("Customer")}</th><th>{t("Email")}</th><th>{t("Points")}</th><th></th></tr></thead>
                <tbody>{customers.filter((x) => (x.points ?? 0) > 0).map((x) => (
                  <tr key={x.id}><td><b>{x.name}</b></td><td className="mu-t">{x.email}</td><td><b>{x.points}</b></td>
                    <td style={{ textAlign: "right" }}><button className="btn s" onClick={() => void adjustPts(x)}>{t("Adjust points")}</button></td>
                  </tr>))}</tbody></table>)}
          </Card>
        </>
      )}
      {campForm && (
        <CampaignForm initial={campForm} customers={customers} segments={segments} settings={settings}
          statsOf={makeStatsOf(orders, prices)} onClose={() => setCampForm(null)} onSave={(c, action) => void saveCamp(c.id ? c : { ...c, id: crypto.randomUUID() }, action)} />
      )}
      {autoForm && <AutomationForm initial={autoForm} onClose={() => setAutoForm(null)} onSave={saveAuto} />}
      {confirmCamp && (
        <Confirm open title={`${t("Delete campaign")} "${confirmCamp.name}"?`} message={t("This cannot be undone.")} onClose={() => setConfirmCamp(null)}
          onConfirm={async () => { await api.campaigns.remove(storeId, confirmCamp.id); setConfirmCamp(null); reload(); }} />
      )}
      {confirmAuto && (
        <Confirm open title={`${t("Delete automation")} "${confirmAuto.name}"?`} message={t("This cannot be undone.")} onClose={() => setConfirmAuto(null)}
          onConfirm={async () => { await api.automations.remove(storeId, confirmAuto.id); setConfirmAuto(null); reload(); }} />
      )}
    </>
  );
}

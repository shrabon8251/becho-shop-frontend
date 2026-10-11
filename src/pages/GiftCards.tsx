import { useState } from "react";
import { api } from "../api";
import { EmptyState, IndexTable, Modal, Page, toast, Loading, Confirm } from "../components/polaris";
import { Badge } from "../components/ui";
import { money } from "../lib/money";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
// BUG-43 fix: the backend generates the real code server-side (SecureRandom).
// The stored prefix is 8 random chars; older cards stored "BECHO-" + 2 chars —
// display both with the BECHO- branding.
const displayCode = (c: string) => (c.startsWith("BECHO-") ? c : `BECHO-${c}`);
export default function GiftCards() {
    const t = useT();
    const storeId = useAuth((s) => s.user!.storeId!);
    const { data, reload } = useLoad(() => Promise.all([api.giftCards.list(storeId), api.settings.get(storeId)]), [storeId]);
    const [open, setOpen] = useState(false);
    const [del, setDel] = useState<{ id: string; code: string } | null>(null);
    const [amount, setAmount] = useState("");
    const [err, setErr] = useState("");
    if (!data) return <Loading />;
    const [cards, settings] = data;
    const cur = settings.currency;
    const close = () => { setOpen(false); setAmount(""); setErr(""); };
    const add = async () => {
        const n = Number(amount);
        if (!(n > 0) || n > 100000) return setErr(t("Enter an amount between 0 and 100000"));
        await api.giftCards.save(storeId, { id: crypto.randomUUID(), initial: n, balance: n, active: true, createdAt: Date.now() });
        close(); toast(t("Gift card created")); reload();
    };
    const addBtn = <button className="btn" onClick={() => setOpen(true)}>{t("Create gift card")}</button>;
    return (
        <Page title={t("Gift cards")} actions={addBtn}>
            <IndexTable items={cards} id={(g) => g.id}
                        tabs={[{ id: "all", label: t("All") }, { id: "on", label: t("Active") }, { id: "off", label: t("Disabled") }]}
                        filter={(g, t) => t === "all" || (t === "on") === g.active} search={(g) => displayCode(g.code)} searchPlaceholder={t("Search gift cards")}
                        empty={<EmptyState title={t("Sell gift cards")} text={t("Create a gift card and share the code with a customer.")} action={addBtn} />}
                        cols={[
                            { h: t("Code"), cell: (g) => <code>{displayCode(g.code)}</code> },
                            { h: t("Status"), cell: (g) => <Badge t={g.active ? t("Active") : t("Disabled")} /> },
                            { h: t("Balance"), cell: (g) => money(g.balance, cur) },
                            { h: t("Initial"), cell: (g) => <span className="mu-t">{money(g.initial, cur)}</span> },
                            { h: "", right: true, cell: (g) => (<span className="acts" style={{ justifyContent: "flex-end" }}>
            <button className="btn s" onClick={async () => { await api.giftCards.save(storeId, { ...g, active: !g.active }); toast(g.active ? t("Gift card disabled") : t("Gift card enabled")); reload(); }}>{g.active ? t("Disable") : t("Enable")}</button>
            <button className="btn s" onClick={() => setDel({ id: g.id, code: g.code })}>{t("Delete")}</button></span>) },
                        ]} />
            <p className="mu-t">{t("Codes are generated securely on the server. Balance is deducted when an order is placed.")}</p>
            <Modal open={open} title={t("Create gift card")} onClose={close} footer={<><button className="btn s" onClick={close}>{t("Cancel")}</button><button className="btn" onClick={add}>{t("Create")}</button></>}>
                <label>{t("Amount")} ({cur})<input autoFocus type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                {err && <p className="er-t">{err}</p>}
            </Modal>
            {del && <Confirm open title={t("Delete this gift card?")} message={`“${displayCode(del.code)}” — ${t("This cannot be undone.")}`} confirmLabel={t("Delete")}
                             onClose={() => setDel(null)} onConfirm={async () => { await api.giftCards.remove(storeId, del.id); toast(t("Gift card deleted")); setDel(null); reload(); }} />}
        </Page>
    );
}

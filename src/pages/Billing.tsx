import { useEffect, useState } from "react";
import { PageHeader } from "../components/polaris";
import { useOutletContext } from "react-router-dom";
import { api } from "../api";
import { Badge, Card } from "../components/ui";
import type { StoreCtx } from "../layouts/AdminLayout";
import { money } from "../lib/money";
import { BILLING_CYCLES, cycleMonthly, cyclePrice, paidDaysLeft, PLAN_CURRENCY, trialDaysLeft } from "../lib/plans";
import { usePlans } from "../lib/usePlans";
import type { PayMethod, Plan } from "../types";
import { useT } from "../lib/fx";

const METHODS: { kind: PayMethod["kind"]; name: string; color: string }[] = [
    { kind: "bkash", name: "bKash", color: "#E2136E" },
    { kind: "nagad", name: "Nagad", color: "#F6921E" },
    { kind: "rocket", name: "Rocket", color: "#8C3494" },
    { kind: "sslcommerz", name: "SSLCommerz", color: "#6C4CF1" },
];

export default function Billing() {
    const t = useT();
    const { store, reload } = useOutletContext<StoreCtx>();
    const PLANS = usePlans();
    const [cycle, setCycle] = useState(0);
    const c = BILLING_CYCLES[cycle];
    const [promo, setPromo] = useState("");
    const [msg, setMsg] = useState("");
    // payment method form
    const [mkind, setMkind] = useState<PayMethod["kind"]>("bkash");
    const [sender, setSender] = useState("");
    const [trx, setTrx] = useState("");
    const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
    // Pending subscription payment (backend returns paymentRequired: true).
    const [pending, setPending] = useState<{ plan: Plan; cycle: string; total: number; currency: string } | null>(null);
    const [payTrx, setPayTrx] = useState("");
    // Saved billing method (real backend: GET /billing/method; mock: store.payMethod).
    const [savedMethod, setSavedMethod] = useState<{ kind: string; label: string; trxId: string | null } | null>(null);
    useEffect(() => {
        let alive = true;
        api.billing.getMethod(store.id)
            .then((r) => { if (alive) setSavedMethod(r.method); })
            .catch(() => { /* method optional */ });
        return () => { alive = false; };
    }, [store.id]);
    // BUG-42 fix: the platform's merchant MFS numbers (where plan payments go)
    // come from the backend (/billing/plans) instead of a hardcoded placeholder.
    const [merchantNumbers, setMerchantNumbers] = useState<Record<string, string>>({});
    useEffect(() => {
        let alive = true;
        api.billing.plans(store.id)
            .then((r) => { const nums = (r as { merchantNumbers?: Record<string, string> } | null)?.merchantNumbers; if (alive && nums) setMerchantNumbers(nums); })
            .catch(() => { /* numbers optional */ });
        return () => { alive = false; };
    }, [store.id]);
    const merchantNum = merchantNumbers[mkind] || "";
    const plans = Object.keys(PLANS) as Plan[];
    const run = async (fn: () => Promise<unknown>) => { try { await fn(); setMsg(""); reload(); } catch (e) { setMsg((e as Error).message); } };
    const left = paidDaysLeft(store);
    const m = METHODS.find((x) => x.kind === mkind)!;

    useEffect(() => {
        let alive = true;
        setQuoteTotal(null);
        api.billing.quote(store.id, store.plan, c.id, promo.trim() || undefined)
            .then((q: { total: number }) => { if (alive) setQuoteTotal(q.total); })
            .catch(() => { /* quote is informational */ });
        return () => { alive = false; };
    }, [store.id, store.plan, c.id, promo]);

    const saveMethod = () => {
        if (mkind === "sslcommerz") {
            return void run(async () => { const r = await api.billing.setMethod(store.id, { kind: "sslcommerz", label: "SSLCommerz" }); setSavedMethod(r); });
        }
        if (sender.replace(/\D/g, "").length < 10) return setMsg(t("Enter your sender mobile number"));
        if (trx.trim().length < 4) return setMsg(t("Enter the Transaction ID (TrxID)"));
        const method: PayMethod = { kind: mkind, label: m.name, trxId: trx.trim().toUpperCase() };
        setSender(""); setTrx("");
        return void run(async () => { const r = await api.billing.setMethod(store.id, method); setSavedMethod(r); });
    };

    const activeMethod = savedMethod ?? (store.payMethod ? { kind: store.payMethod.kind, label: store.payMethod.label, trxId: store.payMethod.trxId ?? null } : null);
    const methodLabel = activeMethod
        ? activeMethod.kind === "sslcommerz" ? "SSLCommerz"
            : `${activeMethod.label} (TrxID: ${activeMethod.trxId})`
        : null;

    const choose = async (p: Plan) => {
        if (store.status === "Trial") return void run(() => api.stores.update(store.id, { plan: p }));
        setMsg(""); setPending(null);
        try {
            const r = await api.billing.subscribe(store.id, p, c.id, promo.trim() || undefined);
            if (r.paymentRequired) {
                // Backend left the plan as pending_payment — the merchant pays now,
                // then confirms with the TrxID below.
                setPending({ plan: p, cycle: c.id, total: r.total ?? quoteTotal ?? 0, currency: r.currency ?? PLAN_CURRENCY });
            } else { reload(); }
        } catch (e) { setMsg((e as Error).message); }
    };
    const activate = async () => {
        setMsg(""); setPending(null);
        try {
            const r = await api.billing.subscribe(store.id, store.plan, c.id, promo.trim() || undefined);
            if (r.paymentRequired) {
                setPending({ plan: store.plan, cycle: c.id, total: r.total ?? quoteTotal ?? 0, currency: r.currency ?? PLAN_CURRENCY });
            } else { reload(); }
        } catch (e) { setMsg((e as Error).message); }
    };
    const confirmPayment = async () => {
        if (!pending) return;
        setMsg("");
        try {
            await api.billing.confirm(store.id, payTrx.trim() || undefined);
            setPending(null); setPayTrx(""); reload();
        } catch (e) { setMsg((e as Error).message); }
    };

    return (
        <>
            <PageHeader title={t("Billing")} />
            <Card><div className="between"><div><b>{store.plan} {t("plan")}</b> <Badge t={store.status} /><div className="mu-t">{money(PLANS[store.plan], PLAN_CURRENCY)} {t("per month")} · {t("0% transaction fee")}
                {store.status === "Trial" && `, ${trialDaysLeft(store)} ${t("trial days left")}`}
                {store.status === "Active" && store.planExpiresAt && `, ${left} ${t("days left")} · ${t("expires")} ${new Date(store.planExpiresAt).toLocaleDateString()}`}
            </div></div>
                <div className="row">
                    {store.status === "Trial" && <button className="btn" onClick={activate}>{t("Activate paid plan")}{quoteTotal !== null && ` · ${money(quoteTotal, PLAN_CURRENCY)}`}</button>}
                    {store.status === "Active" && <button className="btn" onClick={activate}>{t("Renew plan")}</button>}
                </div></div></Card>
            <Card><div className="between"><b>{t("Change plan")}</b>
                <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} aria-label={t("Billing cycle")}>
                    {BILLING_CYCLES.map((b, i) => <option key={b.id} value={i}>{t(b.label)}{b.off > 0 ? ` (−${Math.round(b.off * 100)}%)` : ""}</option>)}
                </select></div>
                <div className="row" style={{ marginTop: 8, alignItems: "end" }}>
                    <label><span className="mu-t">{t("Promo code")}</span><input placeholder="BECHO10" value={promo} onChange={(e) => setPromo(e.target.value)} style={{ maxWidth: 140 }} /></label>
                </div>
                <div className="row" style={{ marginTop: 8 }}>{plans.map((p) => (
                    <div key={p} className="card" style={{ flex: 1, marginBottom: 0 }}><b>{p}</b><div className="mu-t">{money(cyclePrice(PLANS, p, c), PLAN_CURRENCY)}{c.months === 1 ? t("/month") : `/${c.months}${t("mo")}`}</div>
                        {c.months > 1 && <div className="mu-t">≈ {money(cycleMonthly(PLANS, p, c), PLAN_CURRENCY)}{t("/month")}</div>}
                        <button className="btn s" disabled={store.plan === p} onClick={() => choose(p)}>{store.plan === p ? t("Current") : PLANS[p] > PLANS[store.plan] ? t("Upgrade") : t("Downgrade")}</button></div>))}</div>
                <span className="mu-t">{t("Promo codes like BECHO10 are applied at checkout.")}</span></Card>
            {pending && (
                <Card><b>💳 {t("Complete your payment")}</b>
                    <p>{t("Plan")}: <b>{pending.plan}</b> · {money(pending.total, pending.currency)}</p>
                    {activeMethod?.kind === "sslcommerz" ? (<>
                        <p className="mu-t">{t("You'll be redirected to SSLCommerz to complete payment. Your plan activates automatically after the gateway confirms.")}</p>
                        <button className="btn" onClick={async () => {
                            try {
                                const r = await api.billing.initiateSslCommerz(store.id, pending.plan, pending.cycle, promo.trim() || undefined);
                                if (r.gatewayUrl) window.location.href = r.gatewayUrl;
                            } catch (e) { setMsg((e as Error).message); }
                        }}>{t("Pay with SSLCommerz")}</button>
                    </>) : (<>
                        <p className="mu-t">
                            {methodLabel
                                ? t("Pay with your saved method:") + " " + methodLabel
                                : t("Save a payment method below first, then confirm.")}
                        </p>
                        <div className="row">
                            <input placeholder={t("Transaction ID (TrxID)")} value={payTrx}
                                   onChange={(e) => setPayTrx(e.target.value.toUpperCase())} style={{ maxWidth: 220 }} />
                            <button className="btn" onClick={confirmPayment}>{t("I've paid — activate my plan")}</button>
                        </div>
                        <span className="mu-t">{t("Enter the TrxID from your bKash/Nagad/Rocket payment. We verify it before activation.")}</span>
                    </>)}
                </Card>)}
            <Card><b>{t("Payment method")}</b>
                <p>{methodLabel ?? t("No payment method on file")}</p>
                <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {METHODS.map((x) => (
                        <button key={x.kind} className={"btn s" + (mkind === x.kind ? " on" : "")} onClick={() => setMkind(x.kind)}
                                style={mkind === x.kind ? { background: x.color, borderColor: x.color, color: "#fff" } : undefined}>{x.name}</button>
                    ))}
                </div>
                {(mkind === "bkash" || mkind === "nagad" || mkind === "rocket") && (<>
                    <p className="mu-t" style={{ margin: "0 0 8px" }}>
                        {t("Send {amt} to our {brand} merchant number:").replace("{amt}", quoteTotal !== null ? money(quoteTotal, PLAN_CURRENCY) : money(cyclePrice(PLANS, store.plan, c), PLAN_CURRENCY)).replace("{brand}", m.name)}{" "}
                        <b style={{ userSelect: "all" }}>{merchantNum || t("Not configured yet — contact support")}</b>
                    </p>
                    <div className="row">
                        <input inputMode="tel" placeholder={t("Your sender mobile number")} value={sender} onChange={(e) => setSender(e.target.value)} />
                        <input placeholder={t("Transaction ID (TrxID)")} value={trx} onChange={(e) => setTrx(e.target.value.toUpperCase())} />
                    </div>
                    <span className="mu-t">{t("We verify each mobile payment manually before activating your plan.")}</span>
                </>)}
                {mkind === "sslcommerz" && (
                    <p className="mu-t">{t("Pay securely via SSLCommerz — cards, bKash, Nagad, Rocket and bank transfer are all accepted in one checkout.")}</p>
                )}
                <div className="row" style={{ marginTop: 10 }}>
                    <button className="btn s" onClick={saveMethod}>{activeMethod ? t("Update payment method") : t("Save payment method")}</button>
                </div>
                <span className="mu-t">{t("Mobile payments are verified manually. SSLCommerz goes live after the backend gateway is connected — until then it runs in test mode.")}</span>
                {msg && <p className="er-t">{msg}</p>}</Card>
            <Card><b>{t("Invoices")}</b><table><tbody>{store.invoices.map((i) => <tr key={i.id}><td>{i.id}</td><td>{new Date(i.date).toLocaleDateString()}</td><td>{i.plan}</td><td>{money(i.amount)}</td><td><Badge t={i.status} /></td></tr>)}</tbody></table>
                {!store.invoices.length && <p className="mu-t">{t("No invoices yet.")}</p>}</Card>
        </>
    );
}

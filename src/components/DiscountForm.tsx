import { useState } from "react";
import { describeDiscount } from "../lib/discounts";
import { money } from "../lib/money";
import { PageHeader } from "./polaris";
import { Card } from "./ui";
import type { Discount } from "../types";
import { useT } from "../lib/fx";

type Method = "percent" | "amount" | "bxgy" | "shipping";

const toLocal = (ts?: number) => (ts ? new Date(ts - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const toTs = (v: string) => (v ? new Date(v).getTime() : undefined);

export default function DiscountForm({ initial, existing, currency, onSave, onBack }: {
    initial: Discount; existing: Discount[]; currency: string;
    onSave(d: Discount): void; onBack(): void;
}) {
    const t = useT();
    const [kind, setKind] = useState<Discount["kind"]>(initial.kind ?? "code");
    const [method, setMethod] = useState<Method>(
        initial.buyQty ? "bxgy" : initial.freeShipping ? "shipping" : initial.type === "$" ? "amount" : "percent");
    const [d, setD] = useState({
        code: initial.code, title: initial.title ?? "", type: initial.type, value: String(initial.value),
        buyQty: String(initial.buyQty ?? 2), getQty: String(initial.getQty ?? 1), getPercent: String(initial.getPercent ?? 100),
        minimum: initial.minimum ? String(initial.minimum) : "", usageLimit: initial.usageLimit ? String(initial.usageLimit) : "",
        startsAt: toLocal(initial.startsAt), endsAt: toLocal(initial.endsAt), active: initial.active,
    });
    const [err, setErr] = useState("");
    const set = (p: Partial<typeof d>) => setD({ ...d, ...p });

    const save = () => {
        const code = d.code.trim().toUpperCase();
        const value = +d.value;
        if (kind === "code") {
            if (!code) return setErr(t("Enter a discount code"));
            if (existing.some((x) => x.id !== initial.id && x.code.toUpperCase() === code)) return setErr(t("This code already exists"));
        }
        const title = d.title.trim();
        if (method === "percent" || method === "amount") {
            if (!(value > 0)) return setErr(t("Enter a positive value"));
            if (method === "percent" && value > 100) return setErr(t("Percentage cannot be over 100"));
        }
        const buyQty = +d.buyQty, getQty = +d.getQty, getPercent = +d.getPercent;
        if (method === "bxgy" && (!Number.isInteger(buyQty) || buyQty < 1 || !Number.isInteger(getQty) || getQty < 1 || !(getPercent > 0) || getPercent > 100))
            return setErr(t("Buy X get Y needs whole quantities and a percent between 1 and 100"));
        const minimum = d.minimum === "" ? undefined : +d.minimum;
        const usageLimit = d.usageLimit === "" ? undefined : Math.floor(+d.usageLimit);
        if (minimum !== undefined && !(minimum >= 0)) return setErr(t("Minimum purchase must be 0 or more"));
        if (usageLimit !== undefined && !(usageLimit >= 1)) return setErr(t("Usage limit must be at least 1"));
        const startsAt = toTs(d.startsAt), endsAt = toTs(d.endsAt);
        if (startsAt && endsAt && endsAt <= startsAt) return setErr(t("End date must be after the start date"));
        onSave({
            ...initial,
            code: kind === "code" ? code : `AUTO-${initial.id.slice(0, 6).toUpperCase()}`,
            title: title || undefined,
            kind,
            type: method === "amount" ? "$" : "%",
            value: method === "bxgy" ? getPercent : method === "shipping" ? 0 : value,
            buyQty: method === "bxgy" ? buyQty : undefined,
            getQty: method === "bxgy" ? getQty : undefined,
            getPercent: method === "bxgy" ? getPercent : undefined,
            freeShipping: method === "shipping" ? true : undefined,
            minimum, usageLimit, startsAt, endsAt, active: d.active,
        });
    };

    const summary: Discount = {
        ...initial, kind, type: method === "amount" ? "$" : "%",
        value: method === "bxgy" ? +d.getPercent : method === "shipping" ? 0 : +d.value || 0,
        buyQty: method === "bxgy" ? +d.buyQty : undefined, getQty: method === "bxgy" ? +d.getQty : undefined,
        getPercent: method === "bxgy" ? +d.getPercent : undefined, freeShipping: method === "shipping" || undefined,
    };

    return (
        <>
            <PageHeader title={initial.id && initial.code ? t(`Edit ${initial.code}`) : t("Create discount")} back={onBack}
                        actions={<button className="btn" onClick={save}>{t("Save")}</button>} />
            {err && <p className="er-t">{err}</p>}
            <div className="two">
                <div>
                    <Card><b>{t("Method")}</b>
                        <div className="seg" role="radiogroup" aria-label={t("Discount method")} style={{ marginTop: 8 }}>
                            {(["code", "automatic"] as const).map((k) => (
                                <button key={k} role="radio" aria-checked={kind === k} className={"btn s" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>
                                    {k === "code" ? t("Discount code") : t("Automatic discount")}</button>))}
                        </div>
                        {kind === "code"
                            ? <label style={{ marginTop: 8 }}><span className="mu-t">{t("Discount code")}</span><input placeholder="SUMMER10" value={d.code} onChange={(e) => set({ code: e.target.value })} /></label>
                            : <label style={{ marginTop: 8 }}><span className="mu-t">{t("Title (shown at checkout)")}</span><input placeholder={t("Weekend sale")} value={d.title} onChange={(e) => set({ title: e.target.value })} /></label>}
                    </Card>
                    <Card><b>{t("Discount type")}</b>
                        <div className="seg" role="radiogroup" aria-label={t("Discount type")} style={{ marginTop: 8, flexWrap: "wrap" }}>
                            {([["percent", "% off"], ["amount", "Amount off"], ["bxgy", "Buy X get Y"], ["shipping", "Free shipping"]] as const).map(([m, label]) => (
                                <button key={m} role="radio" aria-checked={method === m} className={"btn s" + (method === m ? " on" : "")} onClick={() => setMethod(m)}>{label}</button>))}
                        </div>
                        {(method === "percent" || method === "amount") && (
                            <div className="row" style={{ marginTop: 8 }}>
                                <label style={{ flex: 1 }}><span className="mu-t">{method === "percent" ? t("Percentage") : t(`Amount (${currency})`)}</span>
                                    <input type="number" min={0} value={d.value} onChange={(e) => set({ value: e.target.value })} /></label>
                            </div>)}
                        {method === "bxgy" && (
                            <div className="row" style={{ marginTop: 8 }}>
                                <label style={{ flex: 1 }}><span className="mu-t">{t("Buy")}</span><input type="number" min={1} value={d.buyQty} onChange={(e) => set({ buyQty: e.target.value })} /></label>
                                <label style={{ flex: 1 }}><span className="mu-t">{t("Get")}</span><input type="number" min={1} value={d.getQty} onChange={(e) => set({ getQty: e.target.value })} /></label>
                                <label style={{ flex: 1 }}><span className="mu-t">{t("% off")}</span><input type="number" min={1} max={100} value={d.getPercent} onChange={(e) => set({ getPercent: e.target.value })} /></label>
                            </div>)}
                        {method === "shipping" && <p className="mu-t" style={{ marginTop: 8 }}>{t("Removes the shipping charge when the discount applies.")}</p>}
                    </Card>
                    <Card><b>{t("Requirements")}</b>
                        <label><span className="mu-t">{t(`Minimum purchase (${currency}, optional)`)}</span>
                            <input type="number" min={0} placeholder={t("No minimum")} value={d.minimum} onChange={(e) => set({ minimum: e.target.value })} /></label>
                        {kind === "code" && <label><span className="mu-t">{t("Limit total uses (optional)")}</span>
                            <input type="number" min={1} placeholder={t("Unlimited")} value={d.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} /></label>}
                    </Card>
                    <Card><b>{t("Schedule")}</b>
                        <div className="row">
                            <label style={{ flex: 1 }}><span className="mu-t">{t("Starts")}</span><input type="datetime-local" value={d.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></label>
                            <label style={{ flex: 1 }}><span className="mu-t">{t("Ends")}</span><input type="datetime-local" value={d.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></label>
                        </div>
                        <label className="check"><input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />{t("Active")}</label>
                    </Card>
                </div>
                <div>
                    <Card><b>{t("Summary")}</b>
                        <p style={{ fontSize: 18, margin: "8px 0" }}>{describeDiscount(summary, currency)}</p>
                        <div className="between mu-t"><span>{t("Method")}</span><span>{kind === "code" ? t("Discount code") : t("Automatic")}</span></div>
                        {(d.minimum || d.usageLimit) && <div className="between mu-t"><span>{t("Requirements")}</span><span>{[d.minimum ? t(`min ${money(+d.minimum, currency)}`) : "", d.usageLimit ? t(`${d.usageLimit} uses`) : ""].filter(Boolean).join(" · ")}</span></div>}
                        {(d.startsAt || d.endsAt) && <div className="between mu-t"><span>{t("Schedule")}</span><span>{d.startsAt ? new Date(d.startsAt).toLocaleDateString() : "…"} → {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : "…"}</span></div>}
                    </Card>
                </div>
            </div>
        </>
    );
}

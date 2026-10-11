import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { usePlans } from "../lib/usePlans";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import { THEMES } from "../lib/theme";
import { ThemeMini } from "../components/ThemeMini";
import type { Plan } from "../types";
import "../landing.css";

const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const CURS = ["BDT", "USD", "EUR", "GBP", "INR"];

const SAVE_STAGES = [
    "Creating your store…",
    "Applying your theme…",
    "Preparing your dashboard…",
    "Almost ready…",
    "Opening your dashboard…",
];

function SaveOverlay({ stage, themeName }: { stage: number; themeName: string }) {
    const t = useT();
    const pct = Math.round(((stage + 1) / SAVE_STAGES.length) * 100);
    return (
        <div className="bx-save-veil" role="status" aria-live="polite">
            <div className="bx-save-card">
                <span className="bx-logo-mark" style={{ fontSize: 34 }}>◈</span>
                <h2>{t("Setting up your store…")}</h2>
                <p className="sub">{t("This takes just a moment.")}</p>
                <ol className="bx-save-steps">
                    {SAVE_STAGES.map((s, i) => (
                        <li key={s} className={i < stage ? "done" : i === stage ? "doing" : ""}>
                            <span className="st">{i < stage ? "✓" : i === stage ? "" : i + 1}</span>
                            {t(s).replace("{theme}", themeName)}
                        </li>
                    ))}
                </ol>
                <div className="bx-save-bar"><i style={{ width: `${pct}%` }} /></div>
                <div className="bx-save-pct">{pct}%</div>
            </div>
        </div>
    );
}

export default function Onboarding() {
    const t = useT();
    const { user, logout, setStoreId } = useAuth();
    const PLANS = usePlans();
    const [step, setStep] = useState(1);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [saving, setSaving] = useState(-1);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const [f, setF] = useState({ name: "", sub: "", industry: "Fashion", currency: "BDT", plan: "Growth" as Plan, theme: "minimal" });
    const genRef = useRef(0);
    useEffect(() => () => { genRef.current++; timers.current.forEach(clearTimeout); }, []);
    if (!user) return null;
    const sub = f.sub || slug(f.name);
    const steps = [t("Store details"), t("Business info"), t("Choose plan"), t("Choose theme")];
    const themeName = THEMES.find((x) => x.id === f.theme)?.name ?? "Minimal";
    const next = async () => {
        if (step === 1) {
            if (!f.name.trim()) return setErr(t("Enter a store name"));
            if (!/^[a-z0-9-]{3,}$/.test(sub)) return setErr(t("Address: at least 3 characters, lowercase letters, numbers, hyphens"));
            setBusy(true);
            const ok = await api.stores.available(sub);
            setBusy(false);
            if (!ok) return setErr(t("This store address is taken"));
        }
        setErr(""); setStep(step + 1);
    };
    const finish = async () => {
        try {
            setErr("");
            const gen = ++genRef.current;
            setSaving(0);
            // Real work starts immediately; the friendly staged timeline plays in parallel.
            const work = (async () => {
                const s = await api.stores.create(user.id, { name: f.name.trim(), sub, plan: f.plan, currency: f.currency, industry: f.industry });
                const def = THEMES.find((x) => x.id === f.theme);
                if (def) await api.theme.save(s.id, JSON.parse(JSON.stringify(def.theme)));
                return s;
            })();
            for (let i = 1; i < SAVE_STAGES.length; i++) {
                await new Promise<void>((res) => { timers.current.push(setTimeout(res, 700)); });
                if (gen !== genRef.current) return;
                setSaving(i);
            }
            const s = await work;
            if (gen !== genRef.current) return;
            await new Promise<void>((res) => { timers.current.push(setTimeout(res, 600)); });
            if (gen !== genRef.current) return;
            setStoreId(s.id);
        } catch (e) { genRef.current++; timers.current.forEach(clearTimeout); timers.current = []; setSaving(-1); setErr((e as Error).message); setBusy(false); }
    };
    return (
        <div className="bx bx-signup">
            <div className="bx-blob b1" /><div className="bx-blob b2" />
            <Link to="/" className="bx-back">← Becho</Link>
            {saving >= 0 && <SaveOverlay stage={Math.min(saving, SAVE_STAGES.length - 1)} themeName={themeName} />}
            <div className="bx-su-wrap">
                <div className="bx-su-side">
                    <div className="bx-blob b2" style={{ width: 380, height: 380, top: -120, right: -100, left: "auto" }} />
                    <div className="bx-blob b3" style={{ width: 300, height: 300, bottom: -140, left: -80 }} />
                    <Link to="/" className="bx-logo" style={{ position: "relative" }}><span className="bx-logo-mark">◈</span>Becho</Link>
                    <h2>{t("Set up your store")}<br /><span className="gr">{t("welcome")}, {user.name}</span></h2>
                    <p className="sub2">{t("Four quick steps and you're open for business.")}</p>
                    <ol className="bx-ob-steps">
                        {steps.map((s, i) => (
                            <li key={s} className={i + 1 < step ? "done" : i + 1 === step ? "now" : ""}>
                                <span className="n">{i + 1 < step ? "✓" : i + 1}</span>{s}
                            </li>
                        ))}
                    </ol>
                    <button className="bx-ob-logout" onClick={logout}>{t("Log out")}</button>
                </div>
                <div className="bx-su-card">
                    <div className="bx-ob-bar"><i style={{ width: `${(step / 4) * 100}%` }} /></div>
                    <h1>{steps[step - 1]}</h1>
                    <p className="sub">{t("Step")} {step} {t("of")} 4</p>
                    {err && <div className="bx-err">{err}</div>}
                    {step === 1 && <>
                        <label><span>{t("Store name")}</span><input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Sara's Boutique" /></label>
                        <label><span>{t("Store address")}</span>
                            <div className="bx-ob-addr"><input value={sub} onChange={(e) => setF({ ...f, sub: e.target.value.toLowerCase() })} placeholder="saras-boutique" /><span className="mu">.myshop.com</span></div>
                        </label>
                    </>}
                    {step === 2 && <>
                        <label><span>{t("Industry")}</span>
                            <select value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })}>{["Fashion", "Electronics", "Home", "Beauty", "Food", "Other"].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select>
                        </label>
                        <label><span>{t("Currency")}</span>
                            <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{CURS.map((c) => <option key={c}>{c}</option>)}</select>
                        </label>
                    </>}
                    {step === 3 && <>
                        <p className="sub">{t("14-day free trial, no card needed")}</p>
                        {(Object.keys(PLANS) as Plan[]).map((p) => (
                            <div key={p} className={"bx-ob-plan" + (f.plan === p ? " on" : "")} onClick={() => setF({ ...f, plan: p })}>
                                <b>{p}</b><span className="pr">৳{PLANS[p].toLocaleString()}{t("/month")}</span>
                            </div>))}
                    </>}
                    {step === 4 && <>
                        <p className="sub">{t("Pick a look — you can change it anytime in Theme builder.")}</p>
                        <div className="bx-ob-themes" role="radiogroup" aria-label={t("Choose theme")}>
                            {THEMES.map((d) => (
                                <button type="button" key={d.id} role="radio" aria-checked={f.theme === d.id}
                                        className={"ob-theme" + (f.theme === d.id ? " on" : "")}
                                        onClick={() => setF({ ...f, theme: d.id })}>
                                    <ThemeMini def={d} />
                                    <span className="ob-tname">{d.name}<span className="tick">✓</span></span>
                                </button>
                            ))}
                        </div>
                    </>}
                    <div className="bx-ob-nav">
                        {step > 1 && <button className="bx-ob-back" onClick={() => { setStep(step - 1); setErr(""); }}>{t("Back")}</button>}
                        {step < 4
                            ? <button className="bx-btn shine" disabled={busy} onClick={next}>{busy ? t("Checking...") : t("Continue")}</button>
                            : <button className="bx-btn shine" disabled={busy || saving >= 0} onClick={finish}>{saving >= 0 ? t("Setting up…") : t("Launch my store")}</button>}
                    </div>
                </div>
            </div>
        </div>
    );
}

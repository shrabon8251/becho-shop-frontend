// Target: src/components/charts.tsx — replace this file.
// Tiny dependency-free SVG charts. Colours come from the active admin
// theme (CSS variables --ac / --gold in premium-theme.css), so the charts
// follow whichever of the 10 themes the merchant picks — no hardcoded
// violet/gold anymore. No new data: every chart is fed from orders /
// products already loaded.
import { useT } from "../lib/fx";
export function Spark({ points }: { points: number[] }) {
    const max = Math.max(1, ...points), n = Math.max(1, points.length - 1);
    const d = points.map((v, i) => `${(i / n) * 100},${26 - (v / max) * 24}`).join(" ");
    return <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="spark" aria-hidden><polyline points={d} fill="none" style={{ stroke: "var(--ac)" }} strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>;
}
export function LineChart({ points, labels, fmt }: { points: number[]; labels: string[]; fmt(n: number): string }) {
    const t = useT();
    const W = 640, H = 200, L = 8, B = 24, T = 10, max = Math.max(1, ...points), n = Math.max(1, points.length - 1);
    const x = (i: number) => L + (i / n) * (W - L * 2), y = (v: number) => T + (1 - v / max) * (H - T - B);
    const line = points.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const pick = [0, Math.floor(points.length / 2), points.length - 1];
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={t("Sales over time")}>
            {[0, 0.5, 1].map((g) => <line key={g} x1={L} x2={W - L} y1={y(max * g)} y2={y(max * g)} stroke="#888" strokeOpacity=".35" strokeDasharray={g ? "3 3" : undefined} />)}
            <polygon points={`${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`} style={{ fill: "var(--ac)" }} opacity=".12" />
            <polyline points={line} fill="none" style={{ stroke: "var(--ac)" }} strokeWidth="2" />
            {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="8" fill="transparent"><title>{labels[i]}: {fmt(v)}</title></circle>)}
            {pick.map((i, k) => <text key={k} x={x(i)} y={H - 6} fontSize="11" fill="#888" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>{labels[i]}</text>)}
        </svg>
    );
}
/** Vertical bars, e.g. orders per day. Same buckets the dashboard already builds. */
export function BarChart({ points, labels }: { points: number[]; labels: string[] }) {
    const W = 640, H = 200, L = 8, B = 24, T = 10, max = Math.max(1, ...points);
    const bw = (W - L * 2) / Math.max(1, points.length);
    const y = (v: number) => T + (1 - v / max) * (H - T - B);
    const pick = [0, Math.floor(points.length / 2), points.length - 1];
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Orders per day">
            {points.map((v, i) => (
                <g key={i}>
                    <rect x={L + i * bw + bw * 0.2} y={y(v)} width={bw * 0.6} height={H - B - y(v)} rx="3" style={{ fill: i % 2 ? "var(--gold)" : "var(--ac)" }} />
                    <title>{labels[i]}: {v}</title>
                </g>
            ))}
            {pick.map((i, k) => <text key={k} x={L + i * bw + bw / 2} y={H - 6} fontSize="11" fill="#888" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>{labels[i]}</text>)}
        </svg>
    );
}
/** Donut from a label -> count map, e.g. payment status. Empty map renders nothing. */
export function DonutChart({ data }: { data: { label: string; value: number }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return null;
    const colors = ["var(--ac)", "var(--gold)", "#0ea5a0", "#dc2626", "#888888"];
    let acc = 0;
    const R = 52, C = 2 * Math.PI * R;
    return (
        <div className="donut-wrap">
            <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Payment status">
                {data.map((d, i) => {
                    const frac = d.value / total, off = C * (1 - acc), len = C * frac;
                    acc += frac;
                    return <circle key={d.label} cx="70" cy="70" r={R} fill="none" style={{ stroke: colors[i % colors.length] }} strokeWidth="20" strokeDasharray={`${Math.max(0, len - 2)} ${C - len + 2}`} strokeDashoffset={off} transform="rotate(-90 70 70)"><title>{d.label}: {d.value}</title></circle>;
                })}
                <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{total}</text>
                <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#888">orders</text>
            </svg>
            <ul className="donut-legend">
                {data.map((d, i) => <li key={d.label}><span className="donut-dot" style={{ background: colors[i % colors.length] }} />{d.label} · {d.value} ({Math.round(d.value / total * 100)}%)</li>)}
            </ul>
        </div>
    );
}

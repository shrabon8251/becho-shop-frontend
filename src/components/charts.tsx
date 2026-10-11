import { useT } from "../lib/fx";
/** Tiny dependency-free SVG charts. */
export function Spark({ points }: { points: number[] }) {
  const max = Math.max(1, ...points), n = Math.max(1, points.length - 1);
  const d = points.map((v, i) => `${(i / n) * 100},${26 - (v / max) * 24}`).join(" ");
  return <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="spark" aria-hidden><polyline points={d} fill="none" stroke="#4b9fd6" strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>;
}
export function LineChart({ points, labels, fmt }: { points: number[]; labels: string[]; fmt(n: number): string }) {
  const t = useT();
  const W = 640, H = 200, L = 8, B = 24, T = 10, max = Math.max(1, ...points), n = Math.max(1, points.length - 1);
  const x = (i: number) => L + (i / n) * (W - L * 2), y = (v: number) => T + (1 - v / max) * (H - T - B);
  const line = points.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const pick = [0, Math.floor(points.length / 2), points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={t("Sales over time")}>
      {[0, 0.5, 1].map((g) => <line key={g} x1={L} x2={W - L} y1={y(max * g)} y2={y(max * g)} stroke="#e3e3e3" strokeDasharray={g ? "3 3" : undefined} />)}
      <polygon points={`${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`} fill="#4b9fd6" opacity=".12" />
      <polyline points={line} fill="none" stroke="#4b9fd6" strokeWidth="2" />
      {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="8" fill="transparent"><title>{labels[i]}: {fmt(v)}</title></circle>)}
      {pick.map((i, k) => <text key={k} x={x(i)} y={H - 6} fontSize="11" fill="#616161" textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}>{labels[i]}</text>)}
    </svg>
  );
}

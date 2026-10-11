import { useState } from "react";
import { api } from "../api";
import { shopStore } from "../lib/shop";
import { useLoad } from "../lib/useLoad";
import { useShopper } from "../store/shopper";
import { useT } from "../lib/fx";
export function Reviews({ productId }: { productId: string }) {
  const t = useT();
  const shopper = useShopper((s) => s.customer);
  const { data, reload } = useLoad(() => api.reviews.list(shopStore()), []);
  const [f, setF] = useState({ name: shopper?.name ?? "", stars: 5, text: "" });
  const [err, setErr] = useState("");
  if (!data) return null;
  const list = data.filter((r) => r.productId === productId);
  const avg = list.length ? (list.reduce((a, r) => a + r.stars, 0) / list.length).toFixed(1) : null;
  const post = async () => {
    if (!f.name.trim() || !f.text.trim()) return setErr(t("Enter your name and a review"));
    try { await api.reviews.save(shopStore(), { id: crypto.randomUUID(), productId, name: f.name.trim(), stars: f.stars, text: f.text.trim(), createdAt: Date.now() }); setF({ ...f, text: "" }); setErr(""); reload(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div style={{ marginTop: 16 }}><b>{t("Reviews")} {avg && `(${avg}/5)`}</b>
      {list.map((r) => <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--bd)" }}><b>{r.name}</b> {"★".repeat(r.stars)}<div className="mu-t">{r.text}</div></div>)}
      {!list.length && <p className="mu-t">{t("No reviews yet.")}</p>}
      <div className="row" style={{ marginTop: 8 }}><input placeholder={t("Name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select style={{ maxWidth: 70 }} value={f.stars} onChange={(e) => setF({ ...f, stars: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
        <input placeholder={t("Your review")} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /><button className="btn" onClick={post}>{t("Post")}</button></div>
      {err && <p className="er-t">{err}</p>}
    </div>
  );
}

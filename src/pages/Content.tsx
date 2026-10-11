import { useState } from "react";
import { PageHeader, Loading } from "../components/polaris";
import { api } from "../api";
import { Card } from "../components/ui";
import { slug } from "../lib/slug";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
import type { Post } from "../types";
export default function Content() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data, reload } = useLoad(() => api.posts.list(storeId), [storeId]);
  const [edit, setEdit] = useState<Post | null>(null);
  const [err, setErr] = useState("");
  if (!data) return <Loading />;
  const save = async () => {
    if (!edit) return;
    const s = edit.slug || slug(edit.title);
    if (!edit.title.trim()) return setErr(t("Title is required"));
    if (!/^[a-z0-9-]+$/.test(s)) return setErr(t("Slug: lowercase letters, numbers, hyphens"));
    if (data.some((p) => p.id !== edit.id && p.type === edit.type && p.slug === s)) return setErr(t("This slug is already used"));
    await api.posts.save(storeId, { ...edit, slug: s }); setEdit(null); setErr(""); reload();
  };
  if (edit) return (
    <>
      <PageHeader title={edit.title || t("New")} back={() => { setEdit(null); setErr(""); }} actions={<button className="btn" onClick={save}>{t("Save")}</button>} />
      {err && <p className="er-t">{err}</p>}
      <Card><select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Post["type"] })}><option value="post">{t("Blog post")}</option><option value="page">{t("Page")}</option></select>
        <input placeholder={t("Title")} aria-label={t("Title")} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
        <input placeholder={t("Slug (auto from title)")} aria-label={t("Slug (auto from title)")} value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase() })} />
        <input placeholder={t("SEO title (optional)")} aria-label={t("SEO title (optional)")} value={edit.seoTitle ?? ""} onChange={(e) => setEdit({ ...edit, seoTitle: e.target.value })} />
        <input placeholder={t("SEO description (max 160 characters)")} aria-label={t("SEO description (max 160 characters)")} maxLength={160} value={edit.seoDesc ?? ""} onChange={(e) => setEdit({ ...edit, seoDesc: e.target.value })} />
        <textarea rows={10} placeholder={t("Content (plain text, blank line = new paragraph)")} aria-label={t("Content")} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
        <label className="check"><input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} />{t("Published")}</label></Card>
    </>
  );
  return (
    <>
      <PageHeader title={t("Content")} actions={<button className="btn" onClick={() => setEdit({ id: crypto.randomUUID(), type: "post", title: "", slug: "", body: "", published: false, createdAt: Date.now() })}>{t("Add")}</button>} />
      <Card><table><tbody>{data.map((p) => (
        <tr key={p.id} className="click" onClick={() => setEdit(p)}><td>{p.title}</td><td className="mu-t">{p.type === "page" ? t("Page") : t("Post")} /{p.slug}</td><td>{p.published ? t("Published") : t("Draft")}</td>
          <td><button className="btn s" onClick={async (e) => { e.stopPropagation(); await api.posts.remove(storeId, p.id); reload(); }}>{t("Delete")}</button></td></tr>))}</tbody></table>
        {!data.length && <p className="mu-t">{t("No content yet.")}</p>}</Card>
    </>
  );
}

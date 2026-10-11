import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useSeo } from "../../lib/seo";
import { useT } from "../../lib/fx";
import { shopStore } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { Loading } from "../../components/polaris";

// Blog post detail page. Route: /shop/blog/:slug (registered in App.tsx by the parent agent).
// Plain text only (no HTML) so content cannot inject scripts.
export default function BlogPost() {
  const t = useT();
  const { slug } = useParams();
  const { data } = useLoad(() => api.posts.list(shopStore()), []);
  const p = data?.find((x) => x.type === "post" && x.slug === slug && x.published);
  useSeo(p?.seoTitle || p?.title, p?.seoDesc || p?.body.slice(0, 150));
  if (!data) return <Loading />;
  if (!p) return <p>{t("Page not found.")} <Link to="/shop/blog">{t("Back to blog")}</Link></p>;
  const related = data
    .filter((x) => x.type === "post" && x.published && x.id !== p.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  return (
    <>
      <Link to="/shop/blog" className="link">← {t("Blog")}</Link>
      <article className="card post">
        <h1>{p.title}</h1>
        <div className="mu-t post-date">{new Date(p.createdAt).toLocaleDateString()}</div>
        {p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
      </article>
      {related.length > 0 && (
        <section className="related">
          <h2 className="sec-t">{t("Related posts")}</h2>
          <div className="relgrid">
            {related.map((r) => (
              <Link key={r.id} to={`/shop/blog/${r.slug}`} className="card rcard">
                <b>{r.title}</b>
                <div className="mu-t">{new Date(r.createdAt).toLocaleDateString()} · {r.body.slice(0, 90)}</div>
              </Link>))}
          </div>
        </section>)}
    </>
  );
}

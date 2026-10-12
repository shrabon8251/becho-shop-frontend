import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useSeo } from "../../lib/seo";
import { useT } from "../../lib/fx";
import { ownStoreId, shopStore } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { Loading } from "../../components/polaris";
import type { Post } from "../../types";
// The public storefront API returns a reduced post shape without `type`/`published` —
// the backend only serves published posts publicly, so missing flags mean visible.
const isLive = (p: Post, kind: "post" | "page") =>
    ((p as Partial<Post>).type ?? "post") === kind && ((p as Partial<Post>).published ?? true);
export default function Blog() {
    const t = useT();
    const { data } = useLoad(() => { const o = ownStoreId(); return o ? api.posts.list(o) : api.storefront.posts(shopStore()); }, []);
    if (!data) return <Loading />;
    const posts = data.filter((p) => isLive(p, "post")).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return (
        <>
            <h2>{t("Blog")}</h2>
            {posts.map((p) => <Link key={p.id} to={`/shop/blog/${p.slug}`} className="card pcard" style={{ display: "block" }}><b>{p.title}</b><div className="mu-t">{p.createdAt ? `${new Date(p.createdAt).toLocaleDateString()} · ` : ""}{p.body.slice(0, 100)}</div></Link>)}
            {!posts.length && <p className="mu-t">{t("No posts yet.")}</p>}
        </>
    );
}
export function PostPage({ kind }: { kind: "post" | "page" }) {
    const t = useT();
    const { slug } = useParams();
    const { data } = useLoad(() => { const o = ownStoreId(); return o ? api.posts.list(o) : api.storefront.posts(shopStore()); }, []);
    const cur = data?.find((x) => isLive(x, kind) && x.slug === slug);
    useSeo(cur?.seoTitle || cur?.title, cur?.seoDesc || cur?.body.slice(0, 150));
    if (!data) return <Loading />;
    const p = data.find((x) => isLive(x, kind) && x.slug === slug);
    if (!p) return <p>{t("Page not found.")} <Link to="/shop">{t("Back to shop")}</Link></p>;
    // Plain text only (no HTML) so content cannot inject scripts.
    return <div className="card"><h2>{p.title}</h2>{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>;
}

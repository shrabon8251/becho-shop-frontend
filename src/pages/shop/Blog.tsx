import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useSeo } from "../../lib/seo";
import { useT } from "../../lib/fx";
import { ownStoreId } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { Loading } from "../../components/polaris";
export default function Blog() {
    const t = useT();
    const { data } = useLoad(() => { const o = ownStoreId(); return o ? api.posts.list(o) : Promise.resolve([]); }, []);
    if (!data) return <Loading />;
    const posts = data.filter((p) => p.type === "post" && p.published).sort((a, b) => b.createdAt - a.createdAt);
    return (
        <>
            <h2>{t("Blog")}</h2>
            {posts.map((p) => <Link key={p.id} to={`/shop/blog/${p.slug}`} className="card pcard" style={{ display: "block" }}><b>{p.title}</b><div className="mu-t">{new Date(p.createdAt).toLocaleDateString()} · {p.body.slice(0, 100)}</div></Link>)}
            {!posts.length && <p className="mu-t">{t("No posts yet.")}</p>}
        </>
    );
}
export function PostPage({ kind }: { kind: "post" | "page" }) {
    const t = useT();
    const { slug } = useParams();
    const { data } = useLoad(() => { const o = ownStoreId(); return o ? api.posts.list(o) : Promise.resolve([]); }, []);
    const cur = data?.find((x) => x.type === kind && x.slug === slug && x.published);
    useSeo(cur?.seoTitle || cur?.title, cur?.seoDesc || cur?.body.slice(0, 150));
    if (!data) return <Loading />;
    const p = data.find((x) => x.type === kind && x.slug === slug && x.published);
    if (!p) return <p>{t("Page not found.")} <Link to="/shop">{t("Back to shop")}</Link></p>;
    // Plain text only (no HTML) so content cannot inject scripts.
    return <div className="card"><h2>{p.title}</h2>{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>;
}

import { api } from "../../api";
import { useSeo } from "../../lib/seo";
import { HomeSections } from "../../components/HomeSections";
import { InstaFeedSection } from "../../components/apps/InstaFeedSection";
import { shopStore, useShopData } from "../../lib/shop";
import { useLoad } from "../../lib/useLoad";
import { Loading } from "../../components/polaris";
export default function Home() {
  const d = useShopData();
  useSeo(d?.settings.storeName, d?.settings.seoDescription);
  const { data: cols } = useLoad(() => api.collections.list(shopStore()), []);
  if (!d || !cols) return <Loading />;
  return (<>
    <HomeSections theme={d.theme} settings={d.settings} products={d.products} cols={cols} />
    <InstaFeedSection apps={d.apps} products={d.products} />
  </>);
}

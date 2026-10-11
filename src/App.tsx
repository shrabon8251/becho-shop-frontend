import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import { useLoad } from "./lib/useLoad";
import { isPlatformAdmin } from "./lib/perms";
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AppsPage = lazy(() => import("./pages/AppsPage"));
const SalesReportsPro = lazy(() => import("./pages/SalesReportsPro"));
const Content = lazy(() => import("./pages/Content"));
const ThemeBuilder = lazy(() => import("./pages/ThemeBuilder"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const ThemePreview = lazy(() => import("./pages/ThemePreview").then((m) => ({ default: m.PreviewLayout })));
const PreviewHome = lazy(() => import("./pages/ThemePreview").then((m) => ({ default: m.PreviewHome })));
const PreviewCatalog = lazy(() => import("./pages/ThemePreview").then((m) => ({ default: m.PreviewCatalog })));
const PreviewProduct = lazy(() => import("./pages/ThemePreview").then((m) => ({ default: m.PreviewProduct })));
const PreviewFaq = lazy(() => import("./pages/ThemePreview").then((m) => ({ default: m.PreviewFaq })));
const Signup = lazy(() => import("./pages/Signup"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Docs = lazy(() => import("./pages/Docs"));
const Contact = lazy(() => import("./pages/Contact"));
const Migration = lazy(() => import("./pages/Migration"));
const Billing = lazy(() => import("./pages/Billing"));
const Collections = lazy(() => import("./pages/Collections"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Customers = lazy(() => import("./pages/Customers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Discounts = lazy(() => import("./pages/Discounts"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Taxes = lazy(() => import("./pages/Taxes"));
const Payments = lazy(() => import("./pages/Payments"));
const Couriers = lazy(() => import("./pages/Couriers"));
const Notifications = lazy(() => import("./pages/Notifications"));
const FraudCheck = lazy(() => import("./pages/FraudCheck"));
const Finance = lazy(() => import("./pages/Finance"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Marketing = lazy(() => import("./pages/Marketing"));
const POS = lazy(() => import("./pages/POS"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Orders = lazy(() => import("./pages/Orders"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Staff = lazy(() => import("./pages/Staff"));
const Products = lazy(() => import("./pages/Products"));
const SuperAdmin = lazy(() => import("./pages/platform/SuperAdmin"));
const Account = lazy(() => import("./pages/shop/Account"));
const ShopNotFound = lazy(() => import("./pages/shop/NotFound"));
const Track = lazy(() => import("./pages/shop/Track"));
import Blog, { PostPage } from "./pages/shop/Blog";
const FaqPage = lazy(() => import("./pages/shop/FaqPage"));
const BlogPost = lazy(() => import("./pages/shop/BlogPost"));
const ShopBundles = lazy(() => import("./pages/shop/Bundles"));
const PaymentSuccess = lazy(() => import("./pages/shop/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/shop/PaymentFailed"));
const PaymentCancelled = lazy(() => import("./pages/shop/PaymentCancelled"));
const Bundles = lazy(() => import("./pages/Bundles"));
const Redirects = lazy(() => import("./pages/Redirects"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Home = lazy(() => import("./pages/shop/Home"));
const CartPage = lazy(() => import("./pages/shop/CartPage"));
const Catalog = lazy(() => import("./pages/shop/Catalog"));
import Checkout, { Done } from "./pages/shop/Checkout";
const ProductPage = lazy(() => import("./pages/shop/ProductPage"));
const Search = lazy(() => import("./pages/shop/Search"));
import { CollectionsIndex, CollectionPage } from "./pages/shop/CollectionsPage";
const Wishlist = lazy(() => import("./pages/shop/Wishlist"));
const ShopGiftCards = lazy(() => import("./pages/shop/GiftCards"));
const ShopLayout = lazy(() => import("./pages/shop/ShopLayout"));
const ShopBySubdomain = lazy(() => import("./pages/ShopBySubdomain"));
import { useAuth } from "./store/auth";
import { Loading } from "./components/polaris";
function PricingRedirect() {
    // Pricing lives as the #pricing section on the landing page; /pricing lands there too.
    useEffect(() => {
        const t = setTimeout(() => {
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(t);
    }, []);
    return <Landing />;
}
function MerchantGate({ storeId }: { storeId: string }) {
    const { data: store, error, reload } = useLoad(() => api.stores.get(storeId), [storeId]);
    const logout = useAuth((s) => s.logout);
    // Never spin forever: surface load failures with retry + logout.
    if (error && !store) {
        return <div className="shell"><div className="card"><h3>Couldn't load your store</h3><p className="mu-t">{error}</p>
            <div className="row"><button className="btn" onClick={() => reload()}>Retry</button><button className="btn" onClick={logout}>Log out</button></div>
        </div></div>;
    }
    if (!store) return <Loading />;
    if (store.status === "Suspended") {
        return <div className="shell"><div className="card"><h3>{store.name} is suspended</h3><p className="mu-t">Contact support to reactivate it.</p><button className="btn" onClick={logout}>Log out</button></div></div>;
    }
    return (
        <Routes>
            <Route path="/admin" element={<AdminLayout store={store} reload={reload} />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="collections" element={<Collections />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="discounts" element={<Discounts />} />
                <Route path="shipping" element={<Shipping />} />
                <Route path="taxes" element={<Taxes />} />
                <Route path="payments" element={<Payments />} />
                <Route path="couriers" element={<Couriers />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="fraud-check" element={<FraudCheck />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="pos" element={<POS />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="marketing" element={<Marketing />} />
                <Route path="bundles" element={<Bundles />} />
                <Route path="finance" element={<Finance />} />
                <Route path="theme" element={<ThemeBuilder />} />
                <Route path="apps" element={<AppsPage />} />
                <Route path="apps/sales-reports" element={<SalesReportsPro />} />
                <Route path="content" element={<Content />} />
                <Route path="gift-cards" element={<GiftCards />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="staff" element={<Staff />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="billing" element={<Billing />} />
                <Route path="redirects" element={<Redirects />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route path="api-keys" element={<ApiKeys />} />
                <Route path="activity" element={<ActivityLog />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
}
function AdminApp() {
    const user = useAuth((s) => s.user);
    if (!user) return <Navigate to="/login" replace />;
    // Hardened: the super gate cross-checks the backend-signed JWT, so editing
    // the persisted user object in localStorage alone can't unlock it.
    if (isPlatformAdmin(user.role)) return <SuperAdmin />;
    if (!user.storeId) return <Onboarding />;
    return <MerchantGate storeId={user.storeId} />;
}
export default function App() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/preview/:themeId" element={<ThemePreview />}>
                    <Route index element={<PreviewHome />} />
                    <Route path="products" element={<PreviewCatalog />} />
                    <Route path="product/:pid" element={<PreviewProduct />} />
                    <Route path="faq" element={<PreviewFaq />} />
                </Route>
                <Route path="/login" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/migration" element={<Migration />} />
                <Route path="/pricing" element={<PricingRedirect />} />
                <Route path="/s/:sub" element={<ShopBySubdomain />} />
                <Route path="/shop/:slug" element={<ShopBySubdomain />} />
                <Route path="/shop" element={<ShopLayout />}>
                    <Route index element={<Home />} />
                    <Route path="products" element={<Catalog />} />
                    <Route path="blog" element={<Blog />} />
                    <Route path="blog/:slug" element={<BlogPost />} />
                    <Route path="faq" element={<FaqPage />} />
                    <Route path="bundles" element={<ShopBundles />} />
                    <Route path="page/:slug" element={<PostPage kind="page" />} />
                    <Route path="product/:id" element={<ProductPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="done/:id" element={<Done />} />
                    <Route path="account" element={<Account />} />
                    <Route path="track" element={<Track />} />
                    <Route path="search" element={<Search />} />
                    <Route path="collections" element={<CollectionsIndex />} />
                    <Route path="collections/:id" element={<CollectionPage />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="gift-cards" element={<ShopGiftCards />} />
                    <Route path="*" element={<ShopNotFound />} />
                </Route>
                {/* Gateway return URLs (backend redirects shoppers here after payment). */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />
                <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                <Route path="*" element={<AdminApp />} />
            </Routes>
        </Suspense>
    );
}

import type { LandingContent } from "../types";

/** Default landing page content. Super admin can override via the Website tab;
 *  the backend persists it and the landing page reads it on load. */
export function defaultLanding(): LandingContent {
  return {
    announcement: { on: false, text: "🎉 Eid offer: 20% off all plans with code EID20" },
    hero: {
      title: "Launch your dream store",
      titleAccent: "in minutes.",
      subtitle: "Becho gives you a beautiful storefront, a powerful admin, POS and marketing — everything you need to sell online and in person.",
      cta: "Start free trial",
      note: "14-day free trial · No credit card required · Cancel anytime",
    },
    features: [
      { icon: "🎨", title: "Stunning storefronts", desc: "Designer-made themes, drag-and-drop sections, no code needed." },
      { icon: "📦", title: "Orders & inventory", desc: "Manage orders, stock, and fulfillments from one dashboard." },
      { icon: "💳", title: "bKash, Nagad & cards", desc: "SSLCommerz, COD and manual MFS payments built in." },
      { icon: "🚚", title: "Courier integrations", desc: "Pathao, RedX, Steadfast and more — print labels in one click." },
      { icon: "📊", title: "Analytics & reports", desc: "Know your best sellers, top customers and revenue trends." },
      { icon: "📱", title: "POS included", desc: "Sell in-store with the built-in point of sale." },
    ],
    pricing: { starter: 399, growth: 999, pro: 1999, note: "0% transaction fee on all plans" },
    themes: { visible: [], featured: "" },
    testimonials: [
      { name: "Rahim Uddin", role: "Fashion store owner, Dhaka", text: "Ami 1 dinei dokan chalu korechi. Order management eto sohoj hobe vabini.", rating: 5 },
      { name: "Nusrat Jahan", role: "Cosmetics seller, Chattogram", text: "bKash payment + courier integration — sob ek jaygay. Khub bhalo.", rating: 5 },
      { name: "Tanvir Ahmed", role: "Electronics store, Sylhet", text: "Support team onek helpful. Theme gulo dekhte premium lage.", rating: 4 },
    ],
    faq: [
      { q: "Do I need to know how to code?", a: "Not at all. Pick a theme, drag sections into place, and publish. Developers can still extend everything via API." },
      { q: "Which payments are supported?", a: "Cash on delivery, bKash/Nagad/Rocket (manual + via SSLCommerz), and cards/bank through SSLCommerz." },
      { q: "Can I use my own domain?", a: "Yes — connect any domain from Settings → Domains on paid plans." },
      { q: "Is there a free trial?", a: "Every plan starts with a 14-day free trial. No credit card required." },
    ],
    cta: {
      title: "Ready to start selling?",
      subtitle: "Join thousands of merchants building their dream store with Becho.",
      button: "Start free trial",
    },
  };
}

import type { CSSProperties } from "react";
import type { Theme, ThemeSection } from "../types";
import { heroArt, collectionArt } from "./demoArt";
export const FONTS: Record<Theme["font"], string> = { System: "system-ui, -apple-system, 'Segoe UI', sans-serif", Serif: "Georgia, 'Times New Roman', serif", Mono: "ui-monospace, Menlo, monospace" };
export const themeStyle = (t: Theme) => ({ "--ac": t.color, "--rad": t.radius + "px", fontFamily: FONTS[t.font] }) as CSSProperties;
export const SECTION_LABELS: Record<ThemeSection["type"], string> = {
  hero: "Slideshow hero", collections: "Collection list", featured: "Featured products", banner: "Banner",
  newsletter: "Newsletter signup", image_text: "Image with text", featured_collection: "Featured collection",
  testimonials: "Testimonials", richtext: "Rich text", faq: "FAQ", gallery: "Image gallery",
  deals: "Daily deals", cat_circles: "Category circles", promo_tiles: "Promo tiles", ptabs: "Tabbed products", cta_banner: "CTA banner",
};
export const SECTION_DEFAULTS: Record<ThemeSection["type"], Partial<ThemeSection>> = {
  hero: { slides: [{ img: "https://picsum.photos/seed/hero1/1600/900", title: "", sub: "", btnText: "Shop now", btnLink: "/shop/products" }] },
  collections: {},
  featured: { title: "Featured", count: 4 },
  banner: { text: "New banner" },
  newsletter: {},
  image_text: { img: collectionArt(41, "✨", 215), title: "Our story", body: "Tell customers what makes your store special.", btnText: "Learn more", btnLink: "/shop/blog" },
  featured_collection: { title: "Shop the collection" },
  testimonials: { title: "Loved by customers", testimonials: [{ name: "Happy customer", text: "Great quality and fast delivery!", stars: 5 }] },
  richtext: { title: "Welcome", body: "Add your message here." },
  faq: { title: "FAQ", faqs: [{ q: "How long is delivery?", a: "Delivery takes 2-4 working days inside the city." }] },
  gallery: { title: "Gallery", images: ["https://picsum.photos/seed/gal1/800/800", "https://picsum.photos/seed/gal2/800/800", "https://picsum.photos/seed/gal3/800/800"] },
  deals: { title: "Daily deals", count: 6 },
  cat_circles: { title: "Popular categories" },
  promo_tiles: { title: "Offers", tiles: [{ img: "https://picsum.photos/seed/tile1/800/600", title: "New arrivals", link: "/shop/products" }, { img: "https://picsum.photos/seed/tile2/800/600", title: "Bestsellers", link: "/shop/products" }] },
  ptabs: { title: "Trending now" },
  cta_banner: { title: "Become our partner", body: "Special deals for bulk and corporate orders.", btnText: "Find out more", btnLink: "/shop/blog", bg: "linear-gradient(135deg,#1B6EBB,#1A2A5E)" },
};

export interface ThemeDef { id: string; name: string; desc: string; theme: Theme }
const sec = (type: ThemeSection["type"], extra: Partial<ThemeSection> = {}): ThemeSection => ({ id: type + "-" + Math.random().toString(36).slice(2, 7), type, on: true, ...extra });
const slide = (seed: string, title = "", sub = "") => {
  // Deterministic gradient art (no external images — always loads, even offline).
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { img: heroArt(h % 997, h % 360), title, sub, btnText: "Shop now", btnLink: "/shop/products" };
};

export const THEMES: ThemeDef[] = [
  {
    id: "minimal", name: "Minimal", desc: "Clean and fast. Big product grid, simple slideshow.",
    theme: {
      name: "Minimal", template: "minimal", color: "#1B6EBB", font: "System", radius: 10, logoText: "",
      sections: [
        sec("hero", {
          slides: [
            { img: heroArt(11, 215), title: "New season essentials", sub: "Fresh styles for every day — shop the latest drops", btnText: "Shop now", btnLink: "/shop/products" },
            { img: heroArt(12, 32), title: "Sale up to 50% off", sub: "Bestsellers at their lowest prices. Hurry, ends soon", btnText: "Grab the deals", btnLink: "/shop/products" },
          ],
          promos: [
            { img: collectionArt(21, "👟", 350), title: "Footwear edit", sub: "From ৳2,500", link: "/shop/products" },
            { img: collectionArt(22, "👜", 210), title: "Bags & more", sub: "New arrivals", link: "/shop/products" },
            { img: collectionArt(23, "☕", 25), title: "Home picks", sub: "Under ৳5,000", link: "/shop/products" },
          ],
        }),
        sec("cat_circles", { title: "Popular categories" }),
        sec("deals", { title: "Daily deals", sub: "Hurry — offers end at midnight", count: 8 }),
        sec("featured", { title: "New collection", count: 8 }),
        sec("promo_tiles", {
          title: "Shop by mood", tiles: [
            { img: collectionArt(31, "🧥", 220), title: "Winter layers", link: "/shop/products" },
            { img: collectionArt(32, "💡", 45), title: "Home glow-up", link: "/shop/products" },
            { img: collectionArt(33, "🎒", 95), title: "Travel ready", link: "/shop/products" },
          ],
        }),
        sec("ptabs", { title: "Trending now" }),
        sec("image_text", { ...SECTION_DEFAULTS.image_text, img: collectionArt(41, "✨", 215) }),
        sec("testimonials", SECTION_DEFAULTS.testimonials),
        sec("cta_banner", { title: "Bulk & corporate orders?", body: "Special pricing and dedicated support for businesses.", btnText: "Find out more", btnLink: "/shop/blog", bg: "linear-gradient(135deg,#1B6EBB,#1A2A5E)" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "fashion", name: "Fashion", desc: "Editorial serif look for clothing and lifestyle brands.",
    theme: {
      name: "Fashion", template: "fashion", color: "#8a6d4b", font: "Serif", radius: 2, logoText: "",
      sections: [
        sec("hero", { slides: [slide("fsh-h1", "New season", "Timeless pieces, made to last"), slide("fsh-h2", "The edit", "Curated looks for every day")] }),
        sec("featured_collection", { title: "Shop the look" }),
        sec("gallery", { title: "@ourstore" }),
        sec("testimonials", { title: "What they say" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}", showPayments: true },
    },
  },
  {
    id: "bold", name: "Bold", desc: "High-energy colors and banners for gadgets and streetwear.",
    theme: {
      name: "Bold", template: "bold", color: "#5a31f4", font: "System", radius: 16, logoText: "",
      sections: [
        sec("banner", { text: "MEGA SALE — up to 50% off", bg: "#5a31f4" }),
        sec("hero", { slides: [slide("bld-h1", "Drop 01 is live", "Limited stock. Don't miss out."), slide("bld-h2", "Tech essentials", "Upgrade your everyday carry")] }),
        sec("featured", { title: "Bestsellers", count: 8 }),
        sec("richtext", { title: "Why shop with us?", body: "Fast delivery, easy returns, and support that actually replies." }),
        sec("faq"),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "craft", name: "Craft", desc: "Warm handmade feel for artisan and organic stores.",
    theme: {
      name: "Craft", template: "craft", color: "#b3541e", font: "Serif", radius: 18, logoText: "",
      sections: [
        sec("hero", { slides: [slide("crf-h1", "Handmade with love", "Small-batch goods from local makers")] }),
        sec("image_text", { title: "Our craft", body: "Every item is made slowly, in small batches, with care." }),
        sec("featured", { title: "Customer favorites", count: 4 }),
        sec("testimonials", { title: "Kind words" }),
        sec("faq"),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}", showPayments: false },
    },
  },
  {
    id: "gadget", name: "Gadget Dark", desc: "Dark neon theme for electronics and tech stores.",
    theme: {
      name: "Gadget Dark", template: "gadget", color: "#8b5cf6", font: "System", radius: 12, logoText: "",
      sections: [
        sec("banner", { text: "MEGA SALE — up to 40% off on selected gadgets", bg: "#7c3aed" }),
        sec("hero", { slides: [slide("gdg-h1", "Upgrade your tech life", "Premium gadgets that make life smarter"), slide("gdg-h2", "New arrivals", "The latest drops, first here")] }),
        sec("featured", { title: "Bestsellers", count: 8 }),
        sec("richtext", { title: "Why shop with us?", body: "100% genuine products, fast delivery, and easy 7-day returns." }),
        sec("faq"),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "jewel", name: "Jewellery Luxury", desc: "Black and gold elegance for jewellery brands.",
    theme: {
      name: "Jewellery Luxury", template: "jewel", color: "#c9a227", font: "Serif", radius: 4, logoText: "",
      sections: [
        sec("hero", { slides: [slide("jwl-h1", "Elegance that never fades", "Hallmarked gold & diamond jewellery"), slide("jwl-h2", "The wedding collection", "Celebrate your special day")] }),
        sec("featured_collection", { title: "Shop by category" }),
        sec("image_text", { title: "Crafted to perfection", body: "Every piece is handcrafted by master artisans and certified pure.", btnText: "Our story", btnLink: "/shop/blog" }),
        sec("testimonials", { title: "Loved by customers" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}", showPayments: true },
    },
  },
  {
    id: "kids", name: "Kids Playful", desc: "Bright and bouncy for toys and kids fashion.",
    theme: {
      name: "Kids Playful", template: "kids", color: "#ec4899", font: "System", radius: 24, logoText: "",
      sections: [
        sec("banner", { text: "MEGA TOY SALE — up to 50% off", bg: "#ec4899" }),
        sec("hero", { slides: [slide("kid-h1", "Play, learn & grow", "The best toys for your little ones"), slide("kid-h2", "New collection 2024", "Trendy fashion for kids")] }),
        sec("featured", { title: "Bestsellers", count: 8 }),
        sec("image_text", { title: "Safe for your little ones", body: "100% safe, non-toxic products, tested with love.", btnText: "Learn more", btnLink: "/shop/blog" }),
        sec("testimonials", { title: "Happy parents" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "beauty", name: "Beauty Glow", desc: "Soft rose theme for cosmetics and skincare.",
    theme: {
      name: "Beauty Glow", template: "beauty", color: "#e35d8f", font: "Serif", radius: 16, logoText: "",
      sections: [
        sec("hero", { slides: [slide("bty-h1", "Enhance your natural beauty", "Premium cosmetics for every skin type"), slide("bty-h2", "New skincare range", "Glow naturally every day")] }),
        sec("featured", { title: "Bestselling products", count: 8 }),
        sec("image_text", { title: "Clean & kind formulas", body: "Dermatologically tested, cruelty free, made with natural ingredients.", btnText: "Our promise", btnLink: "/shop/blog" }),
        sec("testimonials", { title: "What our customers say" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}", showPayments: true },
    },
  },
  {
    id: "organic", name: "Organic Fresh", desc: "Earthy greens for organic food and natural stores.",
    theme: {
      name: "Organic Fresh", template: "organic", color: "#2e7d32", font: "System", radius: 16, logoText: "",
      sections: [
        sec("hero", { slides: [slide("org-h1", "Fresh, organic, delivered", "Farm-fresh goodness to your door"), slide("org-h2", "100% natural", "No chemicals, no preservatives")] }),
        sec("featured_collection", { title: "Shop by category" }),
        sec("featured", { title: "Customer favorites", count: 8 }),
        sec("image_text", { title: "From our farms", body: "Sourced directly from trusted organic farms.", btnText: "Our story", btnLink: "/shop/blog" }),
        sec("testimonials", { title: "Kind words" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "pharma", name: "Pharmacy Care", desc: "Clean medical theme for pharmacy and healthcare.",
    theme: {
      name: "Pharmacy Care", template: "pharma", color: "#0d9488", font: "System", radius: 12, logoText: "",
      sections: [
        sec("banner", { text: "Free delivery on orders over ৳1,000", bg: "#0d9488" }),
        sec("hero", { slides: [slide("pha-h1", "Your trusted online pharmacy", "100% genuine medicines, delivered fast"), slide("pha-h2", "Healthcare essentials", "Everything for your family's health")] }),
        sec("featured", { title: "Best deals of the day", count: 8 }),
        sec("richtext", { title: "Why trust us?", body: "Licensed pharmacists, genuine products, and 24/7 support." }),
        sec("faq"),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "furniture", name: "Furniture Warm", desc: "Warm wood tones for furniture and home decor stores.",
    theme: {
      name: "Furniture Warm", template: "furniture", color: "#8b5a2b", font: "Serif", radius: 10, logoText: "",
      sections: [
        sec("banner", { text: "Free delivery on furniture orders over ৳5,000", bg: "#8b5a2b" }),
        sec("hero", { slides: [slide("fur-h1", "Furniture that feels like home", "Handpicked sofas, tables & decor"), slide("fur-h2", "Solid wood collection", "Built to last for decades")] }),
        sec("cat_circles", { title: "Shop by room" }),
        sec("featured", { title: "Bestsellers", count: 8 }),
        sec("richtext", { title: "Crafted to last", body: "Seasoned wood, honest joinery and a 5-year warranty on every frame." }),
        sec("testimonials", { title: "Loved by homeowners" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "sport", name: "Sport Active", desc: "High-energy red theme for sports, fitness and outdoor gear.",
    theme: {
      name: "Sport Active", template: "sport", color: "#dc2626", font: "System", radius: 14, logoText: "",
      sections: [
        sec("banner", { text: "Up to 40% off training gear — this week only", bg: "#dc2626" }),
        sec("hero", { slides: [slide("spo-h1", "Gear up. Go further.", "Cricket, football & fitness essentials"), slide("spo-h2", "New season drop", "Performance wear built for Bangladesh weather")] }),
        sec("deals", { title: "Deal of the day", sub: "Hurry — offers end at midnight", count: 4 }),
        sec("featured", { title: "Top sellers", count: 8 }),
        sec("testimonials", { title: "Athletes love us" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
  {
    id: "food", name: "Foodie Hub", desc: "Appetizing orange theme for restaurants, bakeries and food delivery.",
    theme: {
      name: "Foodie Hub", template: "food", color: "#f97316", font: "System", radius: 16, logoText: "",
      sections: [
        sec("banner", { text: "Free delivery on orders over ৳500", bg: "#f97316" }),
        sec("hero", { slides: [slide("foo-h1", "Craving something delicious?", "Order from the best kitchens in town"), slide("foo-h2", "Fresh from the oven", "Bakeries & desserts, delivered hot")] }),
        sec("cat_circles", { title: "Cuisines" }),
        sec("featured", { title: "Popular right now", count: 8 }),
        sec("testimonials", { title: "Food lovers say" }),
        sec("newsletter"),
      ],
      footer: { text: "© {year} {store}. All rights reserved.", showPayments: true },
    },
  },
];
export const DEFAULT_THEME: Theme = JSON.parse(JSON.stringify(THEMES[0].theme));
// Back-compat: old preset list now maps to full themes
export const THEME_PRESETS = THEMES;

export type Role = "super" | "merchant";
export type StaffRole = "Admin" | "Manager" | "Support";
export interface User { id: string; name: string; email: string; role: Role; staffRole: StaffRole; storeId: string | null; impersonatedBy?: string; emailVerified?: boolean; phone?: string; phoneVerified?: boolean }
export interface Variant {
  id: string; name: string; price: number; sku: string; stock: number; compareAt?: number; // strikethrough MRP for sale badges
  optionValues?: Record<string, string>; // e.g. { Size: "M", Color: "Red" } — filled by the variant matrix (Products 2.0)
  image?: string; // per-variant image override
  barcode?: string; weight?: number; // grams, used by shipping profiles
}
export interface Metafield { key: string; value: string }
export interface ProductOption { name: string; values: string[] } // e.g. { name: "Size", values: ["S","M","L"] } — drives the variant matrix
export interface Product {
  id: string; title: string; status: "Active" | "Draft"; collectionId: string; images: string[]; variants: Variant[]; seoTitle?: string; seoDesc?: string;
  description?: string; vendor?: string; productType?: string; tags?: string[];
  options?: ProductOption[]; // when present, variants are the cartesian product of these options
  metafields?: Metafield[]; digital?: boolean; digitalFile?: string; // digital = downloadable product, no shipping
  photo?: string; // real photo URL for demos (falls back to images[0] SVG on error)
  taxExempt?: boolean; // when true, no tax is charged on this product's variants
  video?: string; // optional product video URL (mp4), shown in the gallery
  preorder?: boolean; // allow purchase even when all variants are out of stock
  subscribable?: boolean; // customers can buy this on a recurring subscription plan
}
export interface Customer { id: string; name: string; email: string; phone?: string; notes?: string; addresses: string[]; wishlist?: string[]; tags?: string[]; points?: number; credit?: number; emailVerified?: boolean; phoneVerified?: boolean }
export interface OrderItem { variantId: string; qty: number }
export type PayStatus = "Pending" | "Paid" | "Refunded" | "Cancelled";
export type FulfillStatus = "Unfulfilled" | "Fulfilled" | "Cancelled";
export interface OrderEvent { at: number; text: string }
export interface Order { id: number; customerId: string; items: OrderItem[]; pay: PayStatus; ful: FulfillStatus; createdAt: number; refunded: number; log: OrderEvent[]; zoneId?: string; rateId?: string; code?: string; channel?: "pos"; giftApplied?: number; tracking?: TrackingInfo; locationId?: string; payMethod?: string; courierId?: string; trxId?: string }
export type Plan = "Starter" | "Growth" | "Pro";
export interface Invoice { id: string; date: number; plan: Plan; amount: number; status: "Paid" }
export interface PayMethod { kind: "card" | "bkash" | "nagad" | "rocket" | "sslcommerz"; label: string; last4?: string; trxId?: string }
export interface Store { id: string; name: string; sub: string; plan: Plan; status: "Active" | "Trial" | "Suspended"; currency: string; createdAt: number; gmv: number; card?: string; payMethod?: PayMethod; planExpiresAt?: number; invoices: Invoice[] }
export interface StoreRow extends Store { ownerEmail: string }
export interface NewStore { name: string; sub: string; plan: Plan; currency: string; industry: string }
export type CollectionKind = "manual" | "smart"; // smart = automated by conditions (defaults to "manual")
export interface CollectionCondition { field: "title" | "type" | "vendor" | "tag" | "price"; op: "contains" | "equals" | "gte" | "lte"; value: string }
export interface Collection { id: string; name: string; kind?: CollectionKind; conditions?: CollectionCondition[]; matchAll?: boolean; productIds?: string[]; sort?: "manual" | "newest" | "price-asc" | "price-desc" | "alpha"; image?: string }
export type DiscountKind = "code" | "automatic";
export interface Discount {
  id: string; code: string; type: "%" | "$"; value: number; active: boolean; used: number;
  kind?: DiscountKind; // defaults to "code"
  title?: string; // display name for automatic discounts
  minimum?: number; // minimum subtotal to apply
  usageLimit?: number; // max total uses; 0/undefined = unlimited
  startsAt?: number; endsAt?: number;
  buyQty?: number; getQty?: number; getPercent?: number; // buy-X-get-Y
  freeShipping?: boolean;
}
export interface ShippingRate {
  id: string; name: string; price: number;
  minSubtotal?: number; maxSubtotal?: number; // order value conditions
  minWeight?: number; maxWeight?: number; // kg conditions
  carrier?: string; perKg?: number; // carrier-calculated: price = base + perKg * kg
}
export interface ShippingZone { id: string; name: string; rate: number; rates?: ShippingRate[]; countries?: string; taxRegionId?: string; duties?: { collect: boolean; rate: number } }
export interface TaxRegion { id: string; name: string; rate: number }
export interface DeliveryProfile { id: string; name: string; productIds: string[]; zoneIds: string[] }
export interface TrackingInfo { carrier: string; number: string; url?: string; labelReady?: boolean }
export interface Settings { storeName: string; currency: string; zones: ShippingZone[]; freeOver: number; tax: { on: boolean; rate: number; inclusive: boolean }; taxRegions: TaxRegion[]; pay: { cod: boolean; card: boolean; methods?: Record<string, boolean>; testMode?: boolean; manualNumbers?: Record<string, string> }; rates?: Record<string, number>; seoDescription?: string; defaultLang?: "en" | "bn"; publishedLangs?: string[]; notifications?: { newOrderEmail?: string; lowStock: boolean; abandonedReminders: boolean; events?: Record<string, { email: boolean; sms: boolean }>; templates?: Record<string, { subject: string; emailBody: string; smsBody: string }>; sms?: { provider?: string; apiKey?: string; senderId?: string } }; checkout?: { guestCheckout: boolean; expressButtons: boolean; orderNotes: boolean; autoConfirmPaid?: boolean }; couriers?: Record<string, { on: boolean; creds: Record<string, string> }>; tracking?: { metaPixelId?: string; ga4Id?: string; gtmId?: string; tiktokId?: string }; emailSender?: { name?: string; email?: string }; brevo?: { apiKey?: string } }
export interface CheckoutInput { customer: { name: string; email: string; phone?: string }; items: OrderItem[]; zoneId: string; rateId?: string; code?: string; paymentMethod: string; giftCode?: string; note?: string; trxId?: string }
/** Public checkout order request — mirrors POST /stores/{id}/checkout/orders. */
export interface CheckoutOrderInput {
  customer: { name: string; email: string; phone?: string };
  items: { variantId: string | number; qty: number }[];
  paymentMethod: string;
  zoneId?: string; rateId?: string; code?: string; giftCode?: string; note?: string; trxId?: string;
}
export interface CheckoutOrderResult {
  id: number; orderNumber: string; totalMinor: number; currency: string; paymentMethod: string; status: string;
}
export interface PaymentIntentResult {
  redirectUrl: string; orderId: number; amountMinor: number; currency: string;
}
export interface StaffMember { id: string; name: string; email: string; role: StaffRole; permissions?: string[] }
export interface Campaign { id: string; name: string; channel: "Email" | "Social" | "Google Ads"; budget: number; spent: number; active: boolean; subject?: string; body?: string; audience?: string; audienceSegmentId?: string; status?: "Draft" | "Scheduled" | "Sent"; scheduledAt?: number; sentAt?: number; recipients?: number }
export type AutomationTrigger = "abandoned_checkout" | "welcome" | "winback";
export interface Automation { id: string; name: string; trigger: AutomationTrigger; active: boolean; delayHours: number; subject: string; body: string }
export interface Payout { id: string; date: number; amount: number; status: "Processing" | "Paid" }
export interface HeroSlide { img?: string; photo?: string; video?: string; title?: string; sub?: string; btnText?: string; btnLink?: string }
export interface FaqItem { q: string; a: string }
export interface Testimonial { name: string; text: string; stars: number }
export type SectionType = "hero" | "collections" | "featured" | "banner" | "newsletter" | "image_text" | "featured_collection" | "testimonials" | "richtext" | "faq" | "gallery" | "deals" | "cat_circles" | "promo_tiles" | "ptabs" | "cta_banner";
export interface ThemeSection { id: string; type: SectionType; on: boolean; title?: string; sub?: string; text?: string; count?: number; bg?: string; btnText?: string; btnLink?: string; slides?: HeroSlide[]; img?: string; body?: string; flip?: boolean; collectionId?: string; testimonials?: Testimonial[]; faqs?: FaqItem[]; images?: string[]; promos?: PromoTile[]; tiles?: PromoTile[] }
export interface PromoTile { img: string; title: string; sub?: string; link: string }
export interface ThemeFooter { text?: string; links?: { label: string; href: string }[]; showPayments?: boolean }
export interface Theme { name?: string; template?: string; color: string; font: "System" | "Serif" | "Mono"; radius: number; logoText: string; sections: ThemeSection[]; footer?: ThemeFooter }
export interface InstaImage { src: string; productId?: string }
export interface FaqItem { q: string; a: string }
export interface AppsConfig {
  bar: { on: boolean; text: string }; reviews: { on: boolean };
  emailPopups: { on: boolean; title: string; text: string; delaySec: number; code: string };
  liveChat: { on: boolean; welcome: string };
  currency: { on: boolean };
  instaFeed: { on: boolean; images: InstaImage[] };
  faqPage: { on: boolean; items: FaqItem[] };
  backInStock: { on: boolean };
  installed?: string[];
}
export interface Review { id: string; productId: string; name: string; stars: number; text: string; createdAt: number }
export interface Post { id: string; type: "post" | "page"; title: string; slug: string; body: string; published: boolean; createdAt: number; seoTitle?: string; seoDesc?: string }
export interface PosSaleInput { customerId?: string; items: OrderItem[]; code?: string; method: "cash" | "card" | "mobile" }
export interface TrackedOrder { id: number; pay: PayStatus; ful: FulfillStatus; createdAt: number; log: OrderEvent[]; items: { title: string; variant: string; qty: number }[] }
export type PlanPrices = Record<Plan, number>;
export interface GiftCard { id: string; code: string; initial: number; balance: number; active: boolean; createdAt: number }
export type EmailKey = "order_confirmation" | "order_shipped" | "order_refunded";
export interface EmailTemplate { key: EmailKey; subject: string; body: string; enabled: boolean }
export interface Announcement { id: string; title: string; body: string; createdAt: number }
export interface TicketReply { from: "merchant" | "support"; text: string; at: number }
export interface Ticket { id: string; storeId: string; storeName: string; subject: string; message: string; status: "Open" | "Closed"; createdAt: number; replies: TicketReply[] }
// ---- Foundation: entities for the roadmap phases (UI lands phase by phase) ----
export interface Location { id: string; name: string; address?: string; active: boolean; isDefault?: boolean }
export interface StockLevel { variantId: string; locationId: string; qty: number } // per-location breakdown; Variant.stock stays the aggregate
export interface StockTransfer { id: string; fromId: string; toId: string; items: { variantId: string; qty: number }[]; status: "Pending" | "Completed" | "Cancelled"; createdAt: number }
export interface DraftOrder { id: string; customerId?: string; items: OrderItem[]; note?: string; code?: string; zoneId?: string; status: "Open" | "Completed"; createdAt: number }
export interface ReturnItem { variantId: string; qty: number; reason?: string }
export interface OrderReturn { id: string; orderId: number; items: ReturnItem[]; status: "Requested" | "Approved" | "Completed" | "Declined"; refundAmount: number; createdAt: number }
export interface SegmentCondition { field: "totalSpent" | "ordersCount" | "tag"; op: "gte" | "lte" | "eq" | "contains"; value: string }
export interface CustomerSegment { id: string; name: string; conditions: SegmentCondition[] }
export interface AbandonedCheckout { id: string; email: string; name?: string; items: OrderItem[]; createdAt: number; recovered: boolean }
export interface StockAlert { id: string; productId: string; email: string; createdAt: number; notified: boolean }
export interface Domain { id: string; domain: string; primary: boolean; status: "Pending" | "Connected" | "Error" }

// ---- loyalty / rewards ----
export interface LoyaltySettings { enabled: boolean; earnPer: number; earnPoints: number; redeemPoints: number; redeemValue: number }
// ---- subscriptions (recurring customer purchases) ----
export interface SubPlan { id: string; productId: string; interval: "weekly" | "monthly" | "quarterly"; discountPct: number; active: boolean }
export interface Subscription { id: string; customerId: string; planId: string; status: "active" | "paused" | "cancelled"; nextAt: number; createdAt: number }
// ---- product bundles / kits ----
export interface BundleItem { productId: string; variantId?: string; qty: number }
export interface Bundle { id: string; name: string; items: BundleItem[]; price: number; image?: string; active: boolean }
// ---- URL redirects ----
export interface Redirect { id: string; from: string; to: string }
// ---- Landing page CMS (controlled from super admin) ----
export interface LandingFeature { icon: string; title: string; desc: string }
export interface LandingTestimonial { name: string; role: string; text: string; rating: number }
export interface LandingFaq { q: string; a: string }
export interface LandingContent {
  announcement: { on: boolean; text: string };
  hero: { title: string; titleAccent: string; subtitle: string; cta: string; note: string };
  features: LandingFeature[];
  pricing: { starter: number; growth: number; pro: number; note: string };
  themes: { visible: string[]; featured: string };
  testimonials: LandingTestimonial[];
  faq: LandingFaq[];
  cta: { title: string; subtitle: string; button: string };
}
// ---- webhooks + API keys ----
export interface Webhook { id: string; event: string; url: string; active: boolean }
export interface ApiKey { id: string; name: string; key: string; createdAt: number; lastUsed?: number }
// ---- staff activity log ----
export interface ActivityEntry { id: string; at: number; actor: string; action: string; detail?: string }

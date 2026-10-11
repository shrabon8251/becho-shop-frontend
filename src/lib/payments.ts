import type { Settings } from "../types";

export type PayKind = "mfs" | "card" | "cod" | "aggregator" | "manual";
export interface PayProvider {
  id: string;
  name: string;
  kind: PayKind;
  color: string;      // brand color for badges / gateway header
  tagline: string;    // i18n key or plain EN shown under name
  envKeys: string[];  // backend env vars the real integration needs
}

// Becho's final payment lineup (Md's decision, 2026-10-08):
// - COD: no integration needed
// - Manual bKash / Nagad / Rocket: customer sends money, enters TrxID, merchant verifies
// - SSLCommerz: the ONE gateway — cards (Visa/Mastercard/Amex), bKash, Nagad, Rocket, bank
// Dropped for now (no backend implementation — showing them would mean fake payments):
// direct bKash/Nagad/Rocket/Upay API integrations and standalone Card.
// Secrets live on the backend; the frontend only toggles providers and
// runs the checkout UI. `envKeys` documents what the backend must configure.
export const PAYMENT_PROVIDERS: PayProvider[] = [
  { id: "cod", name: "Cash on delivery", kind: "cod", color: "#16A34A", tagline: "Pay when you receive", envKeys: [] },
  { id: "sslcommerz", name: "SSLCommerz", kind: "aggregator", color: "#17479E", tagline: "Cards (Visa/Mastercard/Amex), bKash, Nagad, Rocket & bank", envKeys: ["SSLCZ_STORE_ID", "SSLCZ_STORE_PASSWORD"] },
  { id: "manual-bkash", name: "bKash (manual)", kind: "manual", color: "#E2136E", tagline: "Send money to our number, enter TrxID", envKeys: [] },
  { id: "manual-nagad", name: "Nagad (manual)", kind: "manual", color: "#F6921E", tagline: "Send money to our number, enter TrxID", envKeys: [] },
  { id: "manual-rocket", name: "Rocket (manual)", kind: "manual", color: "#8C3494", tagline: "Send money to our number, enter TrxID", envKeys: [] },
];

export interface PaymentsConfig {
  methods: Record<string, boolean>;
  testMode: boolean;
}

const DEFAULTS: Record<string, boolean> = { cod: true, sslcommerz: true, "manual-bkash": false, "manual-nagad": false, "manual-rocket": false };

/** True for methods whose payment is captured by a gateway (auto-confirmable). */
export function isGatewayMethod(id: string): boolean {
  const p = providerById(id);
  return !!p && (p.kind === "mfs" || p.kind === "card" || p.kind === "aggregator");
}

/** Receiving number the merchant configured for a manual MFS method. */
export function manualNumber(pay: Settings["pay"], id: string): string {
  return pay.manualNumbers?.[id] ?? "";
}

/** Merge legacy {cod,card} flags with the newer per-method map. */
export function paymentsConfig(pay: Settings["pay"]): PaymentsConfig {
  const methods: Record<string, boolean> = { ...DEFAULTS };
  if (pay.methods) for (const p of PAYMENT_PROVIDERS) if (pay.methods[p.id] !== undefined) methods[p.id] = pay.methods[p.id];
  else { // legacy shape
    methods.cod = pay.cod;
  }
  return { methods, testMode: pay.testMode ?? true };
}

export function enabledProviders(pay: Settings["pay"]): PayProvider[] {
  const cfg = paymentsConfig(pay);
  return PAYMENT_PROVIDERS.filter((p) => cfg.methods[p.id]);
}

export function providerById(id: string): PayProvider | undefined {
  return PAYMENT_PROVIDERS.find((p) => p.id === id);
}

/**
 * NOTE: mockCharge was deleted (2026-10-09). Faking a gateway charge in the
 * frontend is a live fake-payment primitive — online payments MUST go through
 * POST /stores/{id}/payments/intents → gateway redirect → server callback.
 */

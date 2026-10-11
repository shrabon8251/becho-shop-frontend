export interface CourierField { key: string; label: string; secret?: boolean }
export interface Courier {
  id: string;
  name: string;
  color: string;
  tagline: string;
  fields: CourierField[]; // credentials the backend needs (never stored in plain UI state beyond the mock)
}

// Top Bangladeshi couriers. Real API calls happen on the backend;
// the frontend only stores the merchant's credentials + on/off toggles,
// and runs the assignment UI. `fields` documents what the backend must configure.
export const COURIERS: Courier[] = [
  { id: "pathao", name: "Pathao Courier", color: "#D32F2F", tagline: "Same-day delivery inside Dhaka", fields: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", secret: true }] },
  { id: "redx", name: "RedX", color: "#E4002B", tagline: "Nationwide delivery network", fields: [{ key: "api_token", label: "API Access Token", secret: true }] },
  { id: "steadfast", name: "Steadfast", color: "#1565C0", tagline: "Cash-on-delivery specialists", fields: [{ key: "api_key", label: "API Key", secret: true }, { key: "secret_key", label: "Secret Key", secret: true }] },
  { id: "paperfly", name: "Paperfly", color: "#F9A825", tagline: "Door-to-door across Bangladesh", fields: [{ key: "username", label: "Username" }, { key: "password", label: "Password", secret: true }] },
  { id: "ecourier", name: "eCourier", color: "#00897B", tagline: "Reliable logistics partner", fields: [{ key: "api_key", label: "API Key", secret: true }] },
  { id: "sundarban", name: "Sundarban Courier", color: "#B71C1C", tagline: "Nationwide courier & parcel service", fields: [{ key: "api_key", label: "API Key", secret: true }, { key: "merchant_id", label: "Merchant ID" }] },
  { id: "sa-paribahan", name: "SA Paribahan", color: "#2E7D32", tagline: "Trusted transport across Bangladesh", fields: [{ key: "api_key", label: "API Key", secret: true }, { key: "merchant_id", label: "Merchant ID" }] },
  { id: "ajr", name: "AJR Courier", color: "#EF6C00", tagline: "Fast courier & e-commerce delivery", fields: [{ key: "api_key", label: "API Key", secret: true }] },
];

export interface CourierConfig { on: boolean; creds: Record<string, string> }
export type CourierSettings = Record<string, CourierConfig>;

export function courierSettings(raw?: CourierSettings): CourierSettings {
  const out: CourierSettings = {};
  for (const c of COURIERS) out[c.id] = { on: false, creds: {}, ...(raw?.[c.id] ?? {}) };
  return out;
}

export function enabledCouriers(raw?: CourierSettings): Courier[] {
  const cfg = courierSettings(raw);
  return COURIERS.filter((c) => cfg[c.id].on);
}

export function courierById(id?: string): Courier | undefined {
  return COURIERS.find((c) => c.id === id);
}

/**
 * Mock consignment creation. Production: POST /api/couriers/:id/consignments
 * on the backend, which talks to the courier's API and returns a tracking ID.
 */
export function mockConsign(courierId: string, _orderId: number): Promise<{ trackingId: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prefix = courierId.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
      resolve({ trackingId: `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}` });
    }, 1200);
  });
}

/** Mock tracking timeline for a consignment. Production: GET /api/couriers/:id/track/:trackingId. */
export function mockTrackingTimeline(trackingId: string): { at: number; text: string }[] {
  const now = Date.now();
  return [
    { at: now - 1000 * 60 * 60 * 30, text: `Consignment created (${trackingId})` },
    { at: now - 1000 * 60 * 60 * 26, text: "Picked up from merchant" },
    { at: now - 1000 * 60 * 60 * 12, text: "Arrived at sorting hub" },
    { at: now - 1000 * 60 * 60 * 3, text: "Out for delivery" },
  ];
}

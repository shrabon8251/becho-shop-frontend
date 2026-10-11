// Fraud detection (frontend + mock).
// Production: the backend calls the courier's fraud-check API (Steadfast /
// Pathao / RedX expose parcel history by customer phone) and an IP
// geolocation service. The browser must never hold those API keys.
// The mock below generates deterministic results from the phone number so
// demos are stable: the same number always returns the same history.

export type FraudRisk = "low" | "medium" | "high" | "unknown";

export interface FraudResult {
  phone: string;
  totalParcels: number;
  delivered: number;
  cancelled: number;
  returned: number;
  successRate: number; // 0-100
  risk: FraudRisk;
  firstSeen: string | null;
  lastSeen: string | null;
  couriers: string[];
  checkedAt: number;
}

export interface IpInfo {
  ip: string;
  city: string;
  country: string;
  vpn: boolean;
  ordersFromIp: number;
}

/** Deterministic hash so mock results are stable per phone number. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const COURIER_NAMES = ["Steadfast", "Pathao", "RedX", "Paperfly", "eCourier"];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 864e5).toLocaleDateString();
}

/**
 * Mock courier fraud-check lookup. Production: POST the phone number to the
 * courier's fraud-check endpoint server-side and map their response here.
 */
export function checkFraud(rawPhone: string): FraudResult {
  const phone = rawPhone.replace(/\D/g, "");
  const h = hash(phone);
  // ~18% of numbers have no courier history at all.
  const totalParcels = h % 100 < 18 ? 0 : 1 + (h % 47);
  if (totalParcels === 0) {
    return {
      phone, totalParcels: 0, delivered: 0, cancelled: 0, returned: 0,
      successRate: 0, risk: "unknown", firstSeen: null, lastSeen: null,
      couriers: [], checkedAt: Date.now(),
    };
  }
  // Skew the distribution: most customers are genuine.
  const profile = h % 100;
  const failRate = profile < 62 ? 0.05 + ((h >> 3) % 10) / 100      // good: ~5-15% fail
    : profile < 85 ? 0.22 + ((h >> 5) % 12) / 100                      // shaky: ~22-34% fail
    : 0.55 + ((h >> 7) % 30) / 100;                                   // risky: 55-85% fail
  const failed = Math.min(totalParcels - 1, Math.round(totalParcels * failRate));
  const cancelled = Math.round(failed * ((h >> 9) % 60) / 100);
  const returned = failed - cancelled;
  const delivered = totalParcels - failed;
  const successRate = Math.round((delivered / totalParcels) * 100);
  const risk: FraudRisk = successRate >= 80 ? "low" : successRate >= 50 ? "medium" : "high";
  const couriers = COURIER_NAMES.filter((_, i) => (h >> (i + 2)) % 3 === 0).slice(0, 3);
  if (couriers.length === 0) couriers.push(COURIER_NAMES[h % COURIER_NAMES.length]);
  return {
    phone, totalParcels, delivered, cancelled, returned, successRate, risk,
    firstSeen: daysAgo(30 + (h % 300)), lastSeen: daysAgo(h % 14),
    couriers, checkedAt: Date.now(),
  };
}

/** Risk badge meta for UI. */
export const RISK_META: Record<FraudRisk, { color: string; bg: string }> = {
  low: { color: "#166534", bg: "#dcfce7" },
  medium: { color: "#92400e", bg: "#fef3c7" },
  high: { color: "#991b1b", bg: "#fee2e2" },
  unknown: { color: "#475569", bg: "#f1f5f9" },
};

/** Mock IP intelligence for an order. Production: capture the checkout IP
 * server-side and enrich it with a geolocation / VPN-detection service. */
export function mockIpInfo(seed: string): IpInfo {
  const h = hash(seed || "order");
  const cities: [string, string][] = [["Dhaka", "Bangladesh"], ["Chattogram", "Bangladesh"], ["Sylhet", "Bangladesh"], ["Khulna", "Bangladesh"], ["Rajshahi", "Bangladesh"], ["Barishal", "Bangladesh"]];
  const [city, country] = cities[h % cities.length];
  return {
    ip: `103.${(h % 200) + 20}.${(h >> 4) % 255}.${(h >> 9) % 255}`,
    city, country,
    vpn: h % 100 < 8,
    ordersFromIp: 1 + (h % 6),
  };
}

const HIST_KEY = "becho-fraud-history";
export function fraudHistory(): FraudResult[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]"); } catch { return []; }
}
export function saveFraudCheck(r: FraudResult) {
  try {
    const h = [r, ...fraudHistory().filter((x) => x.phone !== r.phone)].slice(0, 20);
    localStorage.setItem(HIST_KEY, JSON.stringify(h));
  } catch { /* ignore */ }
}

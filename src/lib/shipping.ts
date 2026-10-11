import type { DeliveryProfile, OrderItem, Product, ShippingRate, ShippingZone } from "../types";

/** All rates for a zone; falls back to the legacy single rate. */
export function zoneRates(z: ShippingZone): ShippingRate[] {
  return z.rates?.length ? z.rates : [{ id: `${z.id}-std`, name: "Standard", price: z.rate }];
}

/** Carrier rates are calculated from weight: base price + perKg × kg. */
export function rateCost(r: ShippingRate, weightKg: number): number {
  return r.carrier && r.perKg ? r.price + r.perKg * weightKg : r.price;
}

function condOk(v: number | undefined, min?: number, max?: number): boolean {
  if (v === undefined) return true;
  if (min !== undefined && v < min) return false;
  if (max !== undefined && v > max) return false;
  return true;
}

/** Rates whose subtotal/weight conditions are met. Pass undefined to skip that filter. */
export function applicableRates(z: ShippingZone, subtotal?: number, weightKg?: number): ShippingRate[] {
  return zoneRates(z).filter(
    (r) => condOk(subtotal, r.minSubtotal, r.maxSubtotal) && condOk(weightKg, r.minWeight, r.maxWeight),
  );
}

/** Total cart weight in kg (variant weight is stored in grams). */
export function cartWeight(items: OrderItem[], weights: Map<string, number>): number {
  return items.reduce((a, i) => a + ((weights.get(i.variantId) ?? 0) / 1000) * i.qty, 0);
}

/**
 * Zones available for a cart given delivery profiles. Products in a custom
 * profile restrict the cart to that profile's zones; the cart must satisfy
 * every profile represented (intersection). Products without a profile use
 * all zones.
 */
export function availableZones(zones: ShippingZone[], profiles: DeliveryProfile[], items: OrderItem[], products: Product[]): ShippingZone[] {
  const vToP = new Map<string, string>();
  for (const p of products) for (const v of p.variants) vToP.set(v.id, p.id);
  let allowed: Set<string> | null = null;
  for (const i of items) {
    const pid = vToP.get(i.variantId);
    if (!pid) continue;
    const prof = profiles.find((pr) => pr.productIds.includes(pid));
    if (!prof) continue;
    const zs = new Set<string>(prof.zoneIds);
    allowed = allowed ? new Set<string>([...allowed].filter((z: string) => zs.has(z))) : zs;
  }
  if (!allowed) return zones;
  const ok: Set<string> = allowed;
  return zones.filter((z) => ok.has(z.id));
}

/** Pick a rate: the requested one if applicable, otherwise the cheapest applicable. */
export function pickRate(z: ShippingZone, subtotal: number, weightKg: number | undefined, rateId?: string): ShippingRate | undefined {
  const list = applicableRates(z, subtotal, weightKg);
  const cost = (r: ShippingRate) => rateCost(r, weightKg ?? 0);
  return list.find((r) => r.id === rateId) ?? [...list].sort((a, b) => cost(a) - cost(b))[0];
}

export const MOCK_CARRIERS = ["Pathao", "RedX", "eCourier", "Sundarban", "DHL"];

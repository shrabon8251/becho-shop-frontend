import type { Order, Product } from "../types";
export const priceMap = (products: Product[]) => new Map(products.flatMap((p) => p.variants.map((v) => [v.id, v.price] as const)));
export const orderTotal = (o: Order, prices: Map<string, number>) => o.items.reduce((a, i) => a + (prices.get(i.variantId) ?? 0) * i.qty, 0);

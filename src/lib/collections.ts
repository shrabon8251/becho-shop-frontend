import type { Collection, CollectionCondition, Product } from "../types";

const textOp = (text: string, op: string, value: string): boolean => {
  const t = text.toLowerCase(), v = value.trim().toLowerCase();
  if (!v) return false;
  return op === "equals" ? t === v : t.includes(v);
};

/** Does one smart-collection condition match the product? */
export function matchesCondition(p: Product, c: CollectionCondition): boolean {
  switch (c.field) {
    case "title": return textOp(p.title, c.op, c.value);
    case "type": return textOp(p.productType ?? "", c.op, c.value);
    case "vendor": return textOp(p.vendor ?? "", c.op, c.value);
    case "tag": return (p.tags ?? []).some((t) => textOp(t, c.op, c.value));
    case "price": {
      const n = parseFloat(c.value);
      if (Number.isNaN(n)) return false;
      const prices = p.variants.map((v) => v.price);
      if (c.op === "gte") return prices.some((x) => x >= n);
      if (c.op === "lte") return prices.some((x) => x <= n);
      return prices.some((x) => x === n);
    }
  }
}

/** Does the product belong to a smart (automated) collection? Empty conditions match nothing. */
export function smartMatches(p: Product, c: Collection): boolean {
  const conds = (c.conditions ?? []).filter((x) => x.value.trim() !== "");
  if (!conds.length) return false;
  return c.matchAll === false
    ? conds.some((x) => matchesCondition(p, x))
    : conds.every((x) => matchesCondition(p, x));
}

const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));

/**
 * Products in a collection, in display order.
 * - smart: products matching the conditions (live).
 * - manual: products in productIds order; products whose legacy collectionId points here are appended.
 */
export function collectionProducts(c: Collection, products: Product[]): Product[] {
  let list: Product[];
  if (c.kind === "smart") {
    list = products.filter((p) => smartMatches(p, c));
  } else {
    const ids = c.productIds ?? [];
    const order = new Map(ids.map((id, i) => [id, i]));
    list = products
      .filter((p) => order.has(p.id) || p.collectionId === c.id)
      .sort((a, b) => (order.get(a.id) ?? ids.length) - (order.get(b.id) ?? ids.length));
  }
  switch (c.sort) {
    case "price-asc": return [...list].sort((a, b) => minPrice(a) - minPrice(b));
    case "price-desc": return [...list].sort((a, b) => minPrice(b) - minPrice(a));
    case "alpha": return [...list].sort((a, b) => a.title.localeCompare(b.title));
    case "newest": return [...list].reverse();
    default: return list;
  }
}

export const collectionCount = (c: Collection, products: Product[]): number => collectionProducts(c, products).length;

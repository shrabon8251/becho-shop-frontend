import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shopStore } from "../lib/shop";
import type { OrderItem } from "../types";
interface CartState {
    items: OrderItem[]; code: string; open: boolean; setOpen(o: boolean): void;
    add(id: string, qty: number, max: number): void;
    setQty(id: string, qty: number, max: number): void;
    remove(id: string): void; setCode(c: string): void; clear(): void;
}
// Scoped per store, like the shopper session: items added on one shop's
// storefront must never appear in another shop's cart (separate localStorage key).
export const useCart = create<CartState>()(persist((set) => ({
    items: [], code: "", open: false, setOpen: (open) => set({ open }),
    add: (id, qty, max) => set((s) => { const ex = s.items.find((i) => i.variantId === id); const q = Math.min((ex?.qty ?? 0) + qty, max); return { items: ex ? s.items.map((i) => (i.variantId === id ? { ...i, qty: q } : i)) : [...s.items, { variantId: id, qty: q }] }; }),
    setQty: (id, qty, max) => set((s) => ({ items: s.items.map((i) => (i.variantId === id ? { ...i, qty: Math.min(Math.max(1, qty), max) } : i)) })),
    remove: (id) => set((s) => ({ items: s.items.filter((i) => i.variantId !== id) })),
    setCode: (code) => set({ code }),
    clear: () => set({ items: [], code: "" }),
}), { name: `cart:${shopStore()}`, partialize: (s) => ({ items: s.items, code: s.code }) }));

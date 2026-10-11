import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shopStore } from "../lib/shop";
import type { Customer } from "../types";
interface ShopperState { customer: Customer | null; set(c: Customer | null): void }
// Scoped per store: a customer account created on one shop's storefront
// never leaks into another shop's storefront (separate localStorage key).
export const useShopper = create<ShopperState>()(persist((set) => ({ customer: null, set: (customer) => set({ customer }) }), { name: `shopper:${shopStore()}` }));

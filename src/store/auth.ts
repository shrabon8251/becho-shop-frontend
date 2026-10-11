import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api";
import type { User } from "../types";
interface AuthState { user: User | null; login(e: string, p: string): Promise<void>; signup(n: string, e: string, p: string, ph?: string, termsAcceptedAt?: string): Promise<void>; google(idToken: string): Promise<void>; logout(): void; setStoreId(id: string): void; origin: User | null; impersonate(u: User): void; exitImpersonation(): void }
// Persisted so a page refresh keeps the merchant logged in. Only the plain
// data (user + origin) is stored; the functions are re-created on load.
export const useAuth = create<AuthState>()(persist((set) => ({
  user: null,
  origin: null,
  login: async (e, p) => set({ user: await api.auth.login(e, p) }),
  signup: async (n, e, p, ph, termsAcceptedAt) => set({ user: await api.auth.signup(n, e, p, ph, termsAcceptedAt) }),
  google: async (idToken) => set({ user: await api.auth.google(idToken) }),
  logout: () => {
    try { localStorage.removeItem("token"); } catch { /* ignore */ }
    set({ user: null, origin: null });
  },
  impersonate: (u) => set((s) => ({ origin: s.user, user: u })),
  exitImpersonation: () => set((s) => ({ user: s.origin, origin: null })),
  setStoreId: (id) => set((s) => ({ user: s.user ? { ...s.user, storeId: id } : null })),
}), {
  name: "becho-merchant-auth",
  partialize: (s) => ({ user: s.user, origin: s.origin }) as AuthState,
}));

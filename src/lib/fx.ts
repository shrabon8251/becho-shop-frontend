import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "../types";
import { money } from "./money";
import { BN } from "./i18n";
interface LocaleState { lang: "en" | "bn"; currency: string | null; setLang(l: "en" | "bn"): void; setCurrency(c: string | null): void }
export const useLocale = create<LocaleState>()(persist((set) => ({ lang: "en", currency: null, setLang: (lang) => set({ lang }), setCurrency: (currency) => set({ currency }) }), { name: "locale" }));
export function useT() {
  const lang = useLocale((s) => s.lang);
  return (k: string) => (lang === "bn" ? BN[k] : undefined) ?? k;
}
/** Display-only conversion. Orders are always charged in the store's base currency. */
export function useFx(settings?: Settings) {
  const chosen = useLocale((s) => s.currency);
  const base = settings?.currency ?? "BDT";
  const cur = settings && chosen && settings.rates?.[chosen] ? chosen : base;
  const rate = settings?.rates?.[cur] ?? 1;
  return { cur, rate, fmt: (n: number) => money(n * rate, cur) };
}

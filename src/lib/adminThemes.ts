// Target: src/lib/adminThemes.ts — NEW file (Phase 1.3).
// All 10 admin colour themes. The merchant picks 1 in the topbar colour
// picker; the choice is saved in localStorage ("admin-theme") and applied
// as data-admin-theme on <html>. Gradient themes paint the whole page
// background with the gradient; cards are a darker glass shade of the
// same gradient with white text (see premium-theme.css). No backend
// change: this is a per-browser admin preference, like the old toggle.
export interface AdminTheme {
    id: string;
    name: string;
    /** Gradient start (page background). */
    from: string;
    /** Gradient end (page background). */
    to: string;
    /** Primary accent: buttons, selected nav, charts. */
    accent: string;
    /** Second accent: alternating chart bars, donut slice 2. */
    gold: string;
    /** True when text on the theme is white (all except Light). */
    dark: boolean;
}

export const ADMIN_THEMES: AdminTheme[] = [
    { id: "light", name: "Light", from: "#f2f2f7", to: "#ffffff", accent: "#6c4cf1", gold: "#c9a227", dark: false },
    { id: "black", name: "Black", from: "#08080c", to: "#121218", accent: "#8b7bff", gold: "#f0b429", dark: true },
    { id: "deep-wine", name: "Deep Wine", from: "#3a1519", to: "#651e24", accent: "#ff5c7a", gold: "#f0b429", dark: true },
    { id: "dark-navy", name: "Dark to Navy", from: "#362722", to: "#54413a", accent: "#e0a458", gold: "#7fb3d5", dark: true },
    { id: "midnight-blue", name: "Midnight Blue", from: "#000443", to: "#0130f6", accent: "#3b82f6", gold: "#22d3ee", dark: true },
    { id: "oceanic", name: "Oceanic Blue", from: "#013d5b", to: "#0d7552", accent: "#14b8a6", gold: "#a3e635", dark: true },
    { id: "black-cherry", name: "Black Cherry", from: "#2b0013", to: "#651025", accent: "#ec4899", gold: "#f59e0b", dark: true },
    { id: "deep-coffee", name: "Deep Coffee", from: "#251603", to: "#b84512", accent: "#f97316", gold: "#fbbf24", dark: true },
    { id: "jade-green", name: "Jade Green", from: "#0b7350", to: "#98bec1", accent: "#2dd4bf", gold: "#f0b429", dark: true },
    { id: "electric-royal", name: "Electric Royal Blue", from: "#77a7ff", to: "#2848fa", accent: "#5b8cff", gold: "#f0b429", dark: true },
];

export const ADMIN_THEME_KEY = "admin-theme";
export const DEFAULT_ADMIN_THEME = "light";

/** Old toggle values ("dark"/"light") map to the new ids; unknown → Light. */
export function resolveAdminThemeId(stored: string | null): string {
    if (stored === "dark") return "black";
    if (stored === "light") return "light";
    return ADMIN_THEMES.some((t) => t.id === stored) ? (stored as string) : DEFAULT_ADMIN_THEME;
}

export function getAdminTheme(id: string): AdminTheme {
    return ADMIN_THEMES.find((t) => t.id === id) ?? ADMIN_THEMES[0];
}

/** Apply a theme id: sets data-admin-theme (the CSS tokens) and keeps
 *  data-theme="dark"/"light" for anything that still reads it. */
export function applyAdminTheme(id: string) {
    const theme = getAdminTheme(resolveAdminThemeId(id));
    try {
        document.documentElement.setAttribute("data-admin-theme", theme.id);
        document.documentElement.setAttribute("data-theme", theme.dark ? "dark" : "light");
        localStorage.setItem(ADMIN_THEME_KEY, theme.id);
    } catch { /* private mode: theme still applies for this session */ }
}

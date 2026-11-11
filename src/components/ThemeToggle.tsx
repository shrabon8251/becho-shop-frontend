// Target: src/components/ThemeToggle.tsx — replace this file.
// Phase 1.3: the sun/moon toggle is replaced by a colour picker with all
// 10 admin themes (Light, Black + 8 gradients). Same export name, so
// AdminLayout.tsx needs NO change. Picking a swatch applies the theme
// instantly (data-admin-theme on <html>) and saves it to localStorage
// ("admin-theme"). Old stored values migrate: "dark" -> "black".
import { useEffect, useState } from "react";
import { ADMIN_THEMES, applyAdminTheme, getAdminTheme, resolveAdminThemeId, ADMIN_THEME_KEY } from "../lib/adminThemes";

export function ThemeToggle() {
    const [current, setCurrent] = useState(() => {
        try { return resolveAdminThemeId(localStorage.getItem(ADMIN_THEME_KEY)); } catch { return "light"; }
    });
    const [open, setOpen] = useState(false);
    useEffect(() => { applyAdminTheme(current); }, [current]);
    const theme = getAdminTheme(current);
    const pick = (id: string) => { setCurrent(id); setOpen(false); };
    return (
        <div className="theme-picker-wrap">
            <button
                type="button"
                className="theme-picker-btn"
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={`Admin theme: ${theme.name}. Change theme`}
                title={`Theme: ${theme.name}`}
                onClick={() => setOpen(!open)}
            >
                <span className="theme-picker-swatch" aria-hidden style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }} />
                <span>{theme.name}</span>
                <span aria-hidden>{open ? "▴" : "▾"}</span>
            </button>
            {open && (
                <>
                    <div className="bell-scrim" onClick={() => setOpen(false)} />
                    <div className="theme-picker-drop" role="menu">
                        <h4>Theme colour</h4>
                        <p>Pick one — it applies instantly.</p>
                        <div className="theme-picker-grid">
                            {ADMIN_THEMES.map((t, i) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={"theme-swatch" + (t.id === current ? " on" : "")}
                                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})`, animationDelay: `${i * 20}ms` }}
                                    aria-label={t.name}
                                    title={t.name}
                                    onClick={() => pick(t.id)}
                                />
                            ))}
                        </div>
                        <div className="theme-picker-current">Active: <b>{theme.name}</b></div>
                    </div>
                </>
            )}
        </div>
    );
}

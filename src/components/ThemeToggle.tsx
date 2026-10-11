import { useEffect, useState } from "react";

/** Dark/light theme toggle for the admin panel. Persists to localStorage. */
export function ThemeToggle() {
    const [dark, setDark] = useState(() => {
        try { return localStorage.getItem("admin-theme") === "dark"; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        try { localStorage.setItem("admin-theme", dark ? "dark" : "light"); } catch { /* noop */ }
    }, [dark]);
    return (
        <button
            className="theme-toggle"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark(!dark)}
        >
            {dark ? "☀️" : "🌙"}
        </button>
    );
}

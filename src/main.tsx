import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { toast } from "./components/polaris";
import "./styles.css";
import "./premium-theme.css";

// BUG-45 fix: global safety net against silent failures. Any promise
// rejection that no handler caught — e.g. a save() without try/catch whose
// API call failed (network blip, 500, 403, validation error) — now surfaces
// as an error toast instead of dying quietly with the user seeing nothing.
// Pages that already catch their own errors (e.g. Products.tsx) are
// unaffected: a caught rejection never reaches this listener, so there is
// no double toast.
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const reason: unknown = e.reason;
    const msg = reason instanceof Error ? reason.message
        : typeof reason === "string" ? reason
            : "Request failed";
    if (msg) toast(msg, true);
});

createRoot(document.getElementById("root")!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);

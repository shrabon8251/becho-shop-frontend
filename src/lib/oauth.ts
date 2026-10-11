export interface GoogleProfile { name: string; email: string }

declare global {
  interface Window { google?: { accounts: { id: {
    initialize(o: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }): void;
    prompt(cb?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void): void;
  } } } }
}

let gsiLoading: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load Google sign-in"));
      document.head.appendChild(s);
    });
  }
  return gsiLoading;
}

/**
 * Real Google sign-in via Google Identity Services. Returns the raw ID token
 * (JWT credential) which the backend verifies server-side. Requires the
 * VITE_GOOGLE_CLIENT_ID env var.
 */
export async function requestGoogleIdToken(): Promise<string> {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  if (!clientId) throw new Error("Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID)");
  await loadGsi();
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (v: string) => { if (!settled) { settled = true; resolve(v); } };
    const fail = (e: Error) => { if (!settled) { settled = true; reject(e); } };
    try {
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => r?.credential ? done(r.credential) : fail(new Error("Google sign-in was cancelled")),
      });
      window.google!.accounts.id.prompt((n) => {
        if (n.isNotDisplayed() || n.isSkippedMoment()) fail(new Error("Google sign-in popup was blocked or dismissed"));
      });
    } catch (e) { fail(e as Error); }
    setTimeout(() => fail(new Error("Google sign-in timed out")), 120000);
  });
}

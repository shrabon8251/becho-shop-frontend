import { httpApi } from "./http";
import type { Api } from "./types";
/**
 * Normalize the API base URL once at startup: trim whitespace, drop trailing
 * slashes. A whitespace-only value counts as unset instead of building broken
 * bases like "   /stores/…", and a trailing slash no longer produces "//stores/…" paths.
 */
function resolveApiUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const url = raw?.trim().replace(/\/+$/, "");
  return url ? url : undefined;
}
const url = resolveApiUrl();
/** Always false now — there is no mock/demo backend. Kept for import compatibility. */
export const isMock = false;
/** True when no backend is configured — the app cannot function without VITE_API_URL. */
export const noBackend = !url;
/**
 * Recursive proxy: any property access (api.platform, api.platform.landing, ...)
 * returns another proxy, and calling it as a function returns a rejected promise.
 * Without this, `api.platform.landing.get()` would throw
 * "Cannot read properties of undefined" during render → blank page.
 */
function noBackendProxy(): unknown {
  const fn = () => Promise.reject(new Error("Backend not connected. Set VITE_API_URL to your backend URL and redeploy."));
  return new Proxy(fn, {
    get: () => noBackendProxy(),
    apply: () => fn(),
  });
}
/** The API client. Returns rejected promises with a clear error if VITE_API_URL is not set. */
export const api: Api = url ? httpApi(url) : (noBackendProxy() as unknown as Api);

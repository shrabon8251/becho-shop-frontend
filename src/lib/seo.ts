import { useEffect } from "react";
/** Client-side only. Search engines that do not run JavaScript need SSR or prerendering to see this. */
export function useSeo(title?: string, description?: string, suffix?: string) {
  useEffect(() => {
    if (title) document.title = suffix ? `${title} | ${suffix}` : title;
    if (!description) return;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", description.slice(0, 160));
  }, [title, description, suffix]);
}

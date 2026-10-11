/** Replace {{variable}} placeholders in an email template. */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}
export const EMAIL_VARS = ["name", "store", "email"];
/** Turn a datetime-local input value into a timestamp. */
export function localInputToTs(v: string): number {
  return v ? new Date(v).getTime() : 0;
}
export function tsToLocalInput(ts: number): string {
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

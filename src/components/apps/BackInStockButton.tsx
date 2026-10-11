import { useState } from "react";
import { api } from "../../api";
import { useT } from "../../lib/fx";
import { shopStore } from "../../lib/shop";
import { toast } from "../polaris";
import type { AppsConfig } from "../../types";

/** Back in Stock app: "Notify me" on sold-out products; merchant sends alerts from admin. */
export function BackInStockButton({ apps, productId }: { apps: AppsConfig; productId: string }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (!apps.backInStock.on) return null;
  const submit = async () => {
    if (!email.includes("@")) return;
    try {
      await api.stockAlerts.subscribe(shopStore(), productId, email);
      setDone(true);
    } catch { toast(t("Something went wrong")); }
  };
  if (done) return <p className="ok-t">🔔 {t("We'll email you when it's back!")}</p>;
  if (!open) return <button className="btn s wide" onClick={() => setOpen(true)}>🔔 {t("Notify me when available")}</button>;
  return (
    <div className="app-bis">
      <input type="email" placeholder={t("Email")} aria-label={t("Email")} value={email}
        onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button className="btn s" disabled={!email.includes("@")} onClick={submit}>{t("Notify me")}</button>
    </div>
  );
}

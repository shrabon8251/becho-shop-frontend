import { useState } from "react";
import { api } from "../api";
import { EmptyState, Loading, Page } from "../components/polaris";
import { useLoad } from "../lib/useLoad";
import { useAuth } from "../store/auth";
import { useT } from "../lib/fx";
export default function ActivityLog() {
  const t = useT();
  const storeId = useAuth((s) => s.user!.storeId!);
  const { data } = useLoad(() => api.activity.list(storeId), [storeId]);
  const [q, setQ] = useState("");
  if (!data) return <Loading />;
  const shown = [...data].sort((a, b) => b.at - a.at)
    .filter((e) => !q.trim() || `${e.actor} ${e.action} ${e.detail ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Page title={t("Activity log")}>
      <div className="row" style={{ marginBottom: 12 }}>
        <input type="search" aria-label={t("Filter activity")} placeholder={t("Filter by actor, action or detail…")} value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 340 }} />
        <span className="mu-t">{shown.length} {t("entries")}</span>
      </div>
      {shown.length ? (
        <div className="card flush"><table><thead><tr><th>{t("Time")}</th><th>{t("Actor")}</th><th>{t("Action")}</th><th>{t("Detail")}</th></tr></thead>
          <tbody>{shown.map((e) => (
            <tr key={e.id}><td className="mu-t" style={{ whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleString()}</td>
              <td>{e.actor}</td><td><span className="mono">{e.action}</span></td><td className="mu-t">{e.detail ?? "—"}</td></tr>))}</tbody></table></div>
      ) : (
        <EmptyState art="📋" title={t("No activity yet")} text={t("Key actions in the store will be recorded here.")} />
      )}
    </Page>
  );
}

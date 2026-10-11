import type { ReactNode } from "react";
import { useT } from "../lib/fx";
const colors: Record<string, string> = { Paid: "ok", Fulfilled: "ok", Active: "ok", Pending: "wa", Unfulfilled: "wa", Trial: "wa", Draft: "mu", Refunded: "er", Cancelled: "er", Suspended: "er", Processing: "wa", Completed: "ok", Requested: "wa", Approved: "ok", Declined: "er", Connected: "ok", Error: "er", Open: "wa", Closed: "mu", Sent: "ok", Scheduled: "wa", Manual: "mu", Automated: "ok" };
export const Badge = ({ t: label }: { t: string }) => { const t = useT(); return <span className={`badge ${colors[label] ?? "mu"}`}>{t(label)}</span>; };
export const Card = ({ children }: { children: ReactNode }) => <div className="card">{children}</div>;

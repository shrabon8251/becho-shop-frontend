import type { StaffMember, StaffRole } from "../types";
export interface Perm { id: string; label: string }
export const PERMS: Perm[] = [
  { id: "orders.view", label: "View orders" },
  { id: "orders.manage", label: "Create & fulfill orders" },
  { id: "products.view", label: "View products" },
  { id: "products.manage", label: "Create & edit products" },
  { id: "customers.view", label: "View customers" },
  { id: "customers.manage", label: "Edit customers & segments" },
  { id: "discounts.manage", label: "Create & edit discounts" },
  { id: "marketing.manage", label: "Run marketing & emails" },
  { id: "settings.manage", label: "Change store settings" },
  { id: "staff.manage", label: "Manage staff & permissions" },
];
/** Role defaults when a member has no explicit permission list. */
const ROLE_DEFAULTS: Record<Exclude<StaffRole, "Admin">, string[]> = {
  Manager: PERMS.filter((p) => p.id !== "staff.manage" && p.id !== "settings.manage").map((p) => p.id),
  Support: ["orders.view", "orders.manage", "customers.view", "customers.manage", "products.view"],
};
/** Admins always have every permission. */
export function can(staff: Pick<StaffMember, "role" | "permissions">, permId: string): boolean {
  if (staff.role === "Admin") return true;
  const perms = staff.permissions ?? ROLE_DEFAULTS[staff.role as Exclude<StaffRole, "Admin">] ?? [];
  return perms.includes(permId);
}
/**
 * Backend ↔ frontend role mapping.
 * The real backend sends lowercase staff roles ("owner" | "admin" | "staff" |
 * "support"); the frontend's StaffRole union is capitalized
 * ("Admin" | "Manager" | "Support"). Normalize at the API boundary —
 * otherwise a real-backend login ends up with an empty sidebar and zero
 * permissions. Unknown roles fail closed to the least-privilege "Support".
 */
export function normalizeStaffRole(raw: unknown): StaffRole {
  switch (String(raw ?? "").toLowerCase()) {
    case "owner":
    case "admin": return "Admin";
    case "staff":
    case "manager": return "Manager";
    case "support": return "Support";
    default: return "Support";
  }
}
/** Decode the backend-signed JWT payload (no signature verification — that's the backend's job). */
export function jwtClaims(): Record<string, unknown> | null {
  try {
    const t = localStorage.getItem("token");
    const part = t?.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}
/**
 * Is this a platform admin? The backend-signed JWT's platform_admin claim is
 * authoritative (the /auth/login response carries role="merchant" for
 * everyone, so the role string can't be used). A forged localStorage token
 * only unlocks the UI shell — every platform API call re-verifies the
 * signature server-side. In mock mode (no JWT) the mock role is trusted.
 */
export function isPlatformAdmin(role: string | null | undefined): boolean {
    const c = jwtClaims();
    // Backend-signed JWT is authoritative: /auth/login returns role="merchant"
    // for everyone (see StorefrontAuthController.toFrontendUser), so the
    // platform_admin claim — not the role string — decides. Checking the role
    // first would lock the real platform admin out of the SuperAdmin UI.
    if (c) return c.platform_admin === true;
    // Mock mode (no JWT to cross-check): trust the mock role.
    return role === "super";
}

export function effectivePerms(staff: Pick<StaffMember, "role" | "permissions">): string[] {
  if (staff.role === "Admin") return PERMS.map((p) => p.id);
  return staff.permissions ?? ROLE_DEFAULTS[staff.role as Exclude<StaffRole, "Admin">] ?? [];
}

import { api } from "../api";
import type { PlanPrices } from "../types";
import { PLANS } from "./plans";
import { useLoad } from "./useLoad";
import { jwtClaims } from "./perms";

/**
 * Plan prices. GET /platform/plans is PLATFORM_ADMIN-only — a merchant's
 * JWT would just 403 (and spam the backend log with AuthorizationDenied
 * stack traces), so only platform admins fetch live prices; everyone
 * else uses the built-in defaults.
 */
export function usePlans(): PlanPrices {
  const { data } = useLoad(
    () => (jwtClaims()?.platform_admin === true ? api.platform.plans.get() : Promise.resolve(null)),
    []
  );
  return data ?? PLANS;
}

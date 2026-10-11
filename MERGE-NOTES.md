# Merge notes (2026-10-10 ~00:30)

Base: side-chat working copies (backend: 4 new tasks; frontend: storefront wiring).
QA fixes re-applied on top:

Backend:
- StoreInventoryController: IDOR guards (store-scoped location/variant checks)
- StoreScope.isNewId: infinite recursion removed
- 5 public endpoints (checkout/orders, payments/intents, phone send/verify-otp,
  stock-alerts subscribe): scope.require -> StoreScope.lid (merchant list/notify untouched)
- application.yml: fixed spring.data/spring.mail nesting + redis password/ssl
- Migrations: V34/V35/V36 duplicates renumbered -> V40/V41/V42; V39 added;
  overlapping migrations kept byte-identical (Flyway checksum safety)
- R2Config/R2Properties/GiftCardRepository/RedisConfig: Md's D:\ versions kept
- deploy.sh sources .env; unused bcprov removed; stale db/migration deleted

Frontend:
- useShopData: allSettled + error field + ShopData type (adapted to api.storefront.*)
- ShopLayout: dismissible warning banner for partial failures
- mockCharge deleted; impersonation button hidden; isPlatformAdmin JWT-claim
  authoritative; withToken accepts accessToken|token
- api/index.ts: kept side-chat's noBackendProxy version (better than throw)

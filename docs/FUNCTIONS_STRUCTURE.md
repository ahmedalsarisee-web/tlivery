# Cloud Functions structure

Feature modules own callables. `src/index.ts` only sets global options and re-exports stable callable names (clients must not change).

```text
functions/src/
  index.ts                 # entry: setGlobalOptions + re-exports
  helpers.ts               # validation / permissions constants
  jordanLocations.ts
  shared/
    admin.ts               # Firebase Admin app, db, auth
    auth.ts                # requireCompanyStaff, claims, applicants
    input.ts               # requiredAlias, serializeTimestamp
    pagination.ts          # cursor encode/decode, page helpers
    run.ts                 # HttpsError / InputError wrapper
    search.ts              # normalize* + searchTokens builders
    types.ts
    index.ts               # shared barrel
  companies/
    callables.ts           # applications, issued users, employees, resolveLoginEmail
    index.ts
  drivers/
    callables.ts           # invites, list, profile, register, outcomes
    index.ts
  orders/
    index.ts               # registerOrderCallables(...)
  finance/
    index.ts               # registerFinanceCallables(...) + ledger helpers
  scripts/
```

## Rules

1. **Export names stay stable** (`listCompanyDrivers`, `createOrder`, …).
2. **No business logic in `index.ts`.**
3. Shared auth/pagination/search live under `shared/`.
4. Cross-feature use explicit imports (e.g. orders → `postOrderDeliveryLedger` from finance).
5. Later features (`tracking/`, `notifications/`, …) follow the same folder + barrel pattern.

## Deploy

```bash
cd functions && npm run build
npx --prefix functions firebase deploy --only functions
```

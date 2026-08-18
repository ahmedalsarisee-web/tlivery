# Firebase Scalability Upgrade

**Date:** July 2026  
**Project:** Wasel (`wasel-47a78`)  
**Scope:** Backend Cloud Functions + Mobile + Web clients  

This document describes the scalability work that moved list APIs from full-collection / in-memory filtering to Firestore-native queries with cursor pagination, denormalized search fields, finance summaries, and automatic legacy backfill.

---

## 1. Why we did this

As companies grow toward **thousands of drivers, accounts, and finance rows**, the previous pattern did not scale:

| Old pattern | Problem at scale |
|---|---|
| Load entire collection into the function | High read cost, slow responses, memory pressure |
| Filter / sort / slice in memory | O(N) per request; worse with search |
| Offset-style `page` only | Skipping pages still scanned earlier pages |
| Join profile docs per row (N+1) | Extra reads for every list item |
| Hub totals by scanning all finance accounts | Expensive every time the finance home opened |

**Goal:** Keep responses fast and predictable as data grows, with the same behavior on **mobile and web**.

---

## 2. What changed (high level)

1. **Cursor-based pagination** on list APIs (`nextCursor` + optional `page` compatibility).
2. **Denormalized list/search fields** written on create/update (and backfilled for old docs).
3. **Server-side search** via `searchTokens` / prefix range queries (not client-only filtering for primary lists).
4. **Finance summary document** so hub totals do not require a full account scan when the summary exists.
5. **Composite Firestore indexes** for the new query shapes.
6. **Client hooks/screens** updated to pass `page` / `pageSize` / `cursor` and render paginated results.
7. **Lazy backfill** so existing production docs without the new fields still appear in lists.

---

## 3. Architecture overview

```text
┌─────────────────┐     ┌─────────────────┐
│  WaselMobile    │     │ WaselWebPlatform│
│  hooks/services │     │  hooks/services │
└────────┬────────┘     └────────┬────────┘
         │  HTTPS callable        │
         └───────────┬────────────┘
                     ▼
         ┌───────────────────────┐
         │ Cloud Functions       │
         │ index.ts / finance.ts │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │ Firestore             │
         │ drivers / users /     │
         │ financeAccounts /     │
         │ financeTransactions / │
         │ financeCompanySummaries│
         └───────────────────────┘
```

**Shared contract (typical list response):**

```ts
{
  items | drivers | clients | merchants | parties | transactions: [...],
  total: number,
  page: number,
  pageSize: number,
  hasMore: boolean,
  nextCursor: string | null
}
```

**Shared request params:**

| Param | Meaning |
|---|---|
| `q` | Search string (normalized server-side) |
| `status` | Optional status filter (`all` = no filter) |
| `page` | 1-based page (compat path when no cursor) |
| `pageSize` | Page size (clamped; defaults differ by API) |
| `cursor` | Opaque base64url cursor for the next page |

---

## 4. Backend helpers (shared patterns)

Implemented in `functions/src/index.ts` and/or `functions/src/finance.ts`.

### 4.1 Normalization & search tokens

- `normalizeLower(value)` — trim + lowercase for sort/search keys.
- `normalizeDigits(value)` — digits-only for phone matching.
- `buildSearchTokens([...])` — token set stored as `searchTokens` array for `array-contains` queries.
- `normalizeDriverDocFields(...)` — writes:
  - `fullNameLower`
  - `phoneDigits`
  - `plateNumberLower`
  - `licenseNumberLower`
  - `searchTokens`
- `normalizeIssuedUserDocFields(...)` — writes:
  - `usernameLower`
  - `displayNameLower`
  - `emailLower`
  - `searchTokens`

These fields are set on **create** and **update** paths (drivers, issued users, employees, invite accept / approve flows).

### 4.2 Cursor encoding

```ts
encodeCursor(value, id)  // base64url(JSON({ value, id }))
decodeCursor(raw, field) // validates and returns { value, id }
```

Cursors always include the **sort field value + document id** so ties are stable with:

```ts
.orderBy(sortField, "asc").orderBy(FieldPath.documentId(), "asc")
.startAfter(cursor.value, cursor.id)
```

### 4.3 Pagination params

- `parsePage(input)` — default `1`, minimum `1`.
- `parsePageSize(input, default, max)` — e.g. drivers/issued users default `20`, max `50`; ledger often default `25`, max `100`.

### 4.4 Page walking without a cursor

If the client sends `page > 1` **without** `cursor`, the function walks forward page-by-page using `limit(pageSize)` until it reaches the requested page. Prefer `nextCursor` for large datasets (cheaper and more stable).

---

## 5. List APIs — how each one works

### 5.1 Drivers — `listCompanyDrivers`

**File:** `functions/src/index.ts`  
**Collection:** `drivers`  
**Auth:** company staff with `drivers:manage` or `orders:write`

**Query shape:**

1. `where("companyId", "==", companyId)`
2. Optional `where("status", "==", status)`
3. Optional `where("searchTokens", "array-contains", q)` (normalized `q`)
4. `orderBy("fullNameLower").orderBy(documentId)`
5. `limit(pageSize + 1)` (+ `startAfter` when cursor/page walk applies)
6. Filter out `status === "removed"` in the page mapping path
7. Return `drivers`, `total`, `page`, `pageSize`, `hasMore`, `nextCursor`

**Used by:** Mobile Drivers screen, Web Drivers page, assign-driver dropdowns that call the same list API with search.

### 5.2 Issued users (clients / merchants / employees)

**Shared helper:** `listCompanyIssuedUsers(admin, role, input)`  
**Wrappers:**

| Callable | Role filter |
|---|---|
| `listCompanyClients` | `client` |
| `listCompanyMerchants` | `merchant` |
| `listCompanyEmployees` | `company_employee` |

**Collection:** `users`  

**Query shape:**

1. `where("companyId", "==", companyId)`
2. `where("role", "==", role)`
3. Optional status filter
4. Optional `searchTokens` `array-contains`
5. `orderBy("usernameLower").orderBy(documentId)`
6. Paginate; map to `{ id, username, displayName, email, status, permissions, companyId }`

**Used by:** Unified issued accounts (web), employees tab (mobile), related client hooks on both platforms.

### 5.3 Finance parties — `listFinanceParties`

**File:** `functions/src/finance.ts`  
**Collection:** `financeAccounts`  
**Input:** `kind: "driver" | "client"`, plus `q` / `page` / `pageSize` / `cursor`

**Query shape:**

1. `companyId` + `partyType == kind`
2. If `q`: prefix range on `partyNameLower` (`>= q` and `<= q\uf8ff`)
3. `orderBy("partyNameLower").orderBy(documentId)`
4. Paginate; expose `displayBalanceJod` (driver balance inverted for UI)

### 5.4 Finance ledger — `listFinanceTransactions`

**Collection:** `financeTransactions`  
Cursor-paginated by `createdAt` (+ document id), with optional party filters. Returns `hasMore` / `nextCursor` like the other lists.

### 5.5 Finance hub — `listFinanceHub`

Uses **`financeCompanySummaries/{companyId}`** when present for driver/client counts and totals.

Summary is maintained when accounts are created or balances change via `ensureAccountInBatch` → `updateFinanceSummaryInBatch`.

If no summary exists yet, hub can still derive totals from accounts (migration / first-use path). Going forward, writes keep the summary warm so hub stays O(1) reads.

---

## 6. Legacy backfill (empty-list bug fix)

### Symptom

- UI showed **total / “1–1 of 1”** but **no rows**
- Same on mobile and web

### Root cause

Firestore **`count()`** includes documents that match equality filters even if a later **`orderBy` field is missing**.  
Documents created **before** denormalization had no `fullNameLower` / `usernameLower` / `partyNameLower`, so:

- `total` > 0  
- ordered query returned **zero docs**

### Fix (deployed)

On page 1, if `totalCount > 0` and the ordered snapshot is empty (and no cursor):

| API area | Backfill function | Missing field |
|---|---|---|
| Drivers | `backfillDriverListFields(companyId)` | `fullNameLower` (+ related search fields) |
| Issued users | `backfillIssuedUserListFields(companyId, role)` | `usernameLower` (+ search fields) |
| Finance parties | `backfillFinanceAccountListFields(companyId)` | `partyNameLower` |

Backfill walks the company subset in batches (~400), writes only docs missing the key field, then **retries the list query**.

After the first successful open for a company, data stays correct for subsequent loads.

---

## 7. Firestore indexes

**File:** `firestore.indexes.json` (deployed with Firebase)

Important **new / extended** composites:

### Drivers

- `companyId` + `fullNameLower`
- `companyId` + `status` + `fullNameLower`
- `companyId` + `searchTokens` (CONTAINS) + `fullNameLower`
- `companyId` + `status` + `searchTokens` (CONTAINS) + `fullNameLower`

### Users (issued accounts / employees)

- `companyId` + `role` + `usernameLower`
- `companyId` + `role` + `status` + `usernameLower`
- `companyId` + `role` + `searchTokens` (CONTAINS) + `usernameLower`
- `companyId` + `role` + `status` + `searchTokens` (CONTAINS) + `usernameLower`

### Finance accounts

- `companyId` + `partyType` + `partyNameLower`

Indexes must finish building in the Firebase console before heavy filtered/sorted traffic; missing indexes surface as failed queries with a console index-creation link.

---

## 8. Client implementation

### 8.1 Layers (both platforms)

| Layer | Mobile | Web |
|---|---|---|
| Callable types | `WorkflowCallableAdapter.ts` | `workflowCallables.ts` |
| Service | `WorkflowService.ts` | `workflowService.ts` |
| Hooks | `useWorkflow.ts`, `useFinance.ts` | same names under `src/hooks` |
| Models | `workflow.model.ts` | `workflow.ts` |

Hooks pass `q`, `status`, `page`, `pageSize`, and optionally `cursor` in the React Query key so cache entries stay correct per filter/page.

### 8.2 Screens / pages

| Surface | Behavior |
|---|---|
| **Drivers** (mobile + web) | Server search + status; page / infinite scroll; shows `total` from API |
| **Employees** (mobile) | Paginated issued-user employees list |
| **Issued accounts** (web unified clients/merchants) | Fetches via paginated callables (pageSize up to 50), then local merge/sort for the unified table |
| **Finance party lists** | Mobile appends pages on scroll; web Previous/Next |
| **Finance ledger** | Same pattern as parties |

Search inputs use **debounce** (e.g. ~400ms) so each keystroke does not spam callables.

### 8.3 Pagination UX difference

- **Mobile:** typically accumulate rows (`useEffect` append when `page` increases / `hasMore`).
- **Web:** often page controls (`Previous` / `Next`) using `page` + `hasMore` / `total`.

Both consume the **same backend contract**.

---

## 9. Write-path consistency

Whenever a listable entity is created or updated, denormalized fields must stay in sync:

| Event | What we write |
|---|---|
| Create / update driver | `normalizeDriverDocFields` |
| Accept invite / approve driver application | same driver fields |
| Create / update issued user or employee | `normalizeIssuedUserDocFields` |
| Create / update finance account balance | `partyNameLower` + finance summary deltas |

If a future feature adds a new list filter, add:

1. Denormalized field(s) on write  
2. Composite index  
3. Query in the list callable  
4. Backfill for existing docs (or a one-off migration)

---

## 10. Deploy checklist

```bash
# From repo root
cd functions && npm run build

# Deploy functions (and indexes when indexes change)
npx --prefix functions firebase deploy --only functions
npx --prefix functions firebase deploy --only firestore:indexes
```

**Verify after deploy:**

1. Open Drivers — count matches visible rows.  
2. Open Clients/Merchants (issued accounts) — rows appear with empty search + “All”.  
3. Open Employees — list loads.  
4. Open Finance parties / ledger — pages load; hub totals look sane.  
5. Type a known name in search — results narrow server-side.  
6. First load after upgrade may briefly backfill; reload should stay fast.

---

## 11. Operational notes & limits

| Topic | Detail |
|---|---|
| **Hot list warm instances** | `listOrders`, `listCompanyDrivers`, `listCompanyDriverInvites`, `listCompanyClients`, `listCompanyMerchants` use `minInstances: 1` to cut cold starts (~3–5s → warm). Costs one always-on instance per function. |
| **Mobile tab deferral** | Tabs use `lazy` + focus-gated queries so merchants/clients/employees/invites do not fetch until those screens open. |
| **Search model** | Token / prefix style — not full-text (Algolia/Elastic). Good for names, usernames, phones/plates tokens we store. |
| **Page walking** | Prefer `nextCursor` over large `page` numbers. |
| **Backfill cost** | One-time (or rare) write burst per company when missing fields are detected. |
| **Removed drivers** | Still counted in some status-unaware counts unless filtered; list mapping excludes `removed`. |
| **Index lag** | New indexes can take minutes to hours on large collections. |

---

## 12. Files touched (reference)

### Backend

- `functions/src/index.ts` — thin entry (globals + re-exports)
- `functions/src/shared/` — admin, auth, pagination, search, run
- `functions/src/companies/` — applications, issued users, employees
- `functions/src/drivers/` — invites, fleet list/profile, driver auth
- `functions/src/orders/` — order callables
- `functions/src/finance/` — hub, parties, ledger, summary
- `firestore.indexes.json` — composites for new queries
- See also [FUNCTIONS_STRUCTURE.md](./FUNCTIONS_STRUCTURE.md)  

### Mobile

- `WaselMobile/src/models/workflow.model.ts`  
- `WaselMobile/src/firebase/functions/WorkflowCallableAdapter.ts`  
- `WaselMobile/src/services/WorkflowService.ts`  
- `WaselMobile/src/hooks/useWorkflow.ts`  
- `WaselMobile/src/hooks/useFinance.ts`  
- Drivers / Employees / Finance screens under `WaselMobile/src/features/...`

### Web

- `WaselWebPlatform/src/models/workflow.ts`  
- `WaselWebPlatform/src/firebase/workflowCallables.ts`  
- `WaselWebPlatform/src/services/workflowService.ts`  
- `WaselWebPlatform/src/hooks/useWorkflow.ts`  
- `WaselWebPlatform/src/hooks/useFinance.ts`  
- `DriversPage`, `UnifiedIssuedAccountsPage`, finance pages under `WaselWebPlatform/src/pages/`

---

## 13. Current status

| Item | Status |
|---|---|
| Cursor pagination on key list APIs | Done & deployed |
| Denormalized search/sort fields on writes | Done & deployed |
| Finance summary for hub | Done & deployed |
| Client mobile + web alignment | Done |
| Firestore indexes | Added & deployed |
| Legacy empty-list backfill | Done & deployed |
| Production verification | Refresh lists after deploy; first open may backfill |

**Verdict:** Implementation is in good shape for scaling to large company datasets, with the empty-list production bug addressed by lazy backfill. Prefer cursors and keep write paths updating denormalized fields for long-term health.

---

## 14. Suggested follow-ups (optional)

1. One-shot Admin migration script for all companies (avoids first-request backfill latency).  
2. Replace remaining client-side filter layers with pure server pages where lists exceed tens of thousands.  
3. Consider dedicated typeahead callable for assign-driver dropdowns with smaller `pageSize`.  
4. Monitor Cloud Functions latency + Firestore read counts after traffic grows.

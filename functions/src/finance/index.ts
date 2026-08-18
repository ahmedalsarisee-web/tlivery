import {getApps, initializeApp} from "firebase-admin/app";
import {
  FieldValue,
  FieldPath,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Query,
  type WriteBatch,
} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
  type CallableRequest,
} from "firebase-functions/v2/https";
import {
  InputError,
  objectInput,
  optionalString,
  requiredString,
  type CompanyPermission,
} from "../helpers";

if (!getApps().length) initializeApp();

const db = getFirestore();

type Request = CallableRequest<unknown>;
type RunFn = <T>(operation: () => Promise<T>) => Promise<T>;
type RequireCompanyStaffFn = (
  request: Request,
  permission?: CompanyPermission | CompanyPermission[],
) => Promise<{uid: string; companyId: string; role: string}>;

export type FinancePartyType = "driver" | "client";

type FinanceTxType = "order_delivery" | "settlement" | "adjustment";
type CursorPayload = {value: string; id: string};

function actor(request: Request): {uid: string; token: Record<string, unknown>} {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  return {
    uid: request.auth.uid,
    token: request.auth.token as Record<string, unknown>,
  };
}

async function resolveProfile(uid: string): Promise<{
  role: string | null;
  companyId: string | null;
  status: string | null;
  displayName: string | null;
}> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) {
    return {role: null, companyId: null, status: null, displayName: null};
  }
  const role = snap.get("role");
  const companyId = snap.get("companyId");
  const status = snap.get("status");
  const displayName = snap.get("displayName") ?? snap.get("name");
  return {
    role: typeof role === "string" ? role : null,
    companyId: typeof companyId === "string" ? companyId : null,
    status: typeof status === "string" ? status : null,
    displayName: typeof displayName === "string" ? displayName : null,
  };
}

function financeAccountId(
  companyId: string,
  partyType: FinancePartyType,
  partyUserId: string,
): string {
  return `${companyId}_${partyType}_${partyUserId}`;
}

function deliveryTxId(orderId: string, partyType: FinancePartyType): string {
  return `order_delivery_${orderId}_${partyType}`;
}

function serializeTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as {toDate: unknown}).toDate === "function"
  ) {
    return (value as {toDate: () => Date}).toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function normalizeLower(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

const LIST_BACKFILL_BATCH = 400;

/** Backfill sort fields on legacy finance account docs missing partyNameLower. */
async function backfillFinanceAccountListFields(companyId: string): Promise<void> {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  for (;;) {
    let query: Query = db
      .collection("financeAccounts")
      .where("companyId", "==", companyId)
      .limit(LIST_BACKFILL_BATCH);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    const snap = await query.get();
    if (snap.empty) {
      return;
    }
    const batch = db.batch();
    let writes = 0;
    for (const doc of snap.docs) {
      if (doc.get("partyNameLower") == null) {
        const partyName = String(doc.get("partyName") ?? "");
        batch.update(doc.ref, {
          partyNameLower: normalizeLower(partyName),
          updatedAt: FieldValue.serverTimestamp(),
        });
        writes += 1;
      }
    }
    if (writes > 0) {
      await batch.commit();
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < LIST_BACKFILL_BATCH) {
      return;
    }
  }
}

function encodeCursor(value: string, id: string): string {
  return Buffer.from(JSON.stringify({value, id} satisfies CursorPayload)).toString(
    "base64url",
  );
}

function decodeCursor(raw: unknown, field: string): CursorPayload | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as CursorPayload;
    if (!parsed?.id || typeof parsed.id !== "string" || typeof parsed.value !== "string") {
      throw new Error("invalid");
    }
    return parsed;
  } catch {
    throw new InputError(field, `${field} must be a valid cursor.`);
  }
}

function parsePageSize(
  input: Record<string, unknown>,
  fallback = 20,
  max = 50,
): number {
  const raw = Number(input.pageSize ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.min(max, Math.max(1, Math.floor(raw)));
}

function parsePage(input: Record<string, unknown>): number {
  const raw = Number(input.page ?? 1);
  if (!Number.isFinite(raw)) {
    return 1;
  }
  return Math.max(1, Math.floor(raw));
}

function financeSummaryRef(companyId: string) {
  return db.doc(`financeCompanySummaries/${companyId}`);
}

function summaryDeltaForParty(partyType: FinancePartyType, deltaJod: number): number {
  return partyType === "driver" ? -deltaJod : deltaJod;
}

function updateFinanceSummaryInBatch(
  batch: WriteBatch,
  params: {
    companyId: string;
    partyType: FinancePartyType;
    deltaJod: number;
    createdAccount: boolean;
  },
) {
  const fieldKey = params.partyType === "driver" ? "drivers" : "clients";
  batch.set(
    financeSummaryRef(params.companyId),
    {
      companyId: params.companyId,
      [`${fieldKey}.count`]: FieldValue.increment(params.createdAccount ? 1 : 0),
      [`${fieldKey}.totalJod`]: FieldValue.increment(
        summaryDeltaForParty(params.partyType, params.deltaJod),
      ),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

function mapAccount(id: string, data: DocumentData) {
  return {
    id,
    companyId: String(data.companyId ?? ""),
    partyType: String(data.partyType ?? "") as FinancePartyType,
    partyUserId: String(data.partyUserId ?? ""),
    partyName: String(data.partyName ?? ""),
    balanceJod: typeof data.balanceJod === "number" ? data.balanceJod : 0,
    partyNameLower: String(data.partyNameLower ?? ""),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function mapTransaction(id: string, data: DocumentData) {
  return {
    id,
    companyId: String(data.companyId ?? ""),
    accountId: String(data.accountId ?? ""),
    partyType: String(data.partyType ?? "") as FinancePartyType,
    partyUserId: String(data.partyUserId ?? ""),
    amountJod: typeof data.amountJod === "number" ? data.amountJod : 0,
    type: String(data.type ?? "adjustment") as FinanceTxType,
    orderId: typeof data.orderId === "string" ? data.orderId : null,
    orderReference:
      typeof data.orderReference === "string" ? data.orderReference : null,
    note: typeof data.note === "string" ? data.note : "",
    createdByUserId: String(data.createdByUserId ?? ""),
    createdAt: serializeTimestamp(data.createdAt),
  };
}

async function ensureAccountInBatch(
  batch: WriteBatch,
  params: {
    companyId: string;
    partyType: FinancePartyType;
    partyUserId: string;
    partyName: string;
    deltaJod: number;
  },
): Promise<string> {
  const accountId = financeAccountId(
    params.companyId,
    params.partyType,
    params.partyUserId,
  );
  const accountRef = db.doc(`financeAccounts/${accountId}`);
  const snap = await accountRef.get();
  if (!snap.exists) {
    batch.set(accountRef, {
      companyId: params.companyId,
      partyType: params.partyType,
      partyUserId: params.partyUserId,
      partyName: params.partyName,
      partyNameLower: normalizeLower(params.partyName),
      balanceJod: params.deltaJod,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    updateFinanceSummaryInBatch(batch, {
      companyId: params.companyId,
      partyType: params.partyType,
      deltaJod: params.deltaJod,
      createdAccount: true,
    });
  } else {
    batch.set(
      accountRef,
      {
        partyName: params.partyName || snap.get("partyName") || "",
        partyNameLower: normalizeLower(
          params.partyName || (snap.get("partyName") as string | undefined) || "",
        ),
        balanceJod: FieldValue.increment(params.deltaJod),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    updateFinanceSummaryInBatch(batch, {
      companyId: params.companyId,
      partyType: params.partyType,
      deltaJod: params.deltaJod,
      createdAccount: false,
    });
  }
  return accountId;
}

/**
 * Post party-centric ledger rows for a delivered order.
 * Driver: −amountJod; client/merchant creator: +amountJod (fee = 0).
 * Idempotent via deterministic transaction ids.
 */
export async function postOrderDeliveryLedger(params: {
  companyId: string;
  orderId: string;
  orderReference: string;
  customerName: string;
  amountJod: number;
  driverId: string;
  driverName: string;
  createdByUserId: string;
  createdByRole: string;
}): Promise<void> {
  const amount = Number.isFinite(params.amountJod)
    ? Math.max(0, params.amountJod)
    : 0;
  const note = `طلب ${params.orderReference} · ${params.customerName}`.slice(
    0,
    200,
  );

  const driverTxRef = db.doc(
    `financeTransactions/${deliveryTxId(params.orderId, "driver")}`,
  );
  const existingDriverTx = await driverTxRef.get();
  if (existingDriverTx.exists) {
    return;
  }

  const batch = db.batch();
  const driverDelta = -amount;
  const driverAccountId = await ensureAccountInBatch(batch, {
    companyId: params.companyId,
    partyType: "driver",
    partyUserId: params.driverId,
    partyName: params.driverName || "Driver",
    deltaJod: driverDelta,
  });
  batch.set(driverTxRef, {
    companyId: params.companyId,
    accountId: driverAccountId,
    partyType: "driver",
    partyUserId: params.driverId,
    amountJod: driverDelta,
    type: "order_delivery",
    orderId: params.orderId,
    orderReference: params.orderReference,
    note,
    createdByUserId: params.driverId,
    createdAt: FieldValue.serverTimestamp(),
  });

  const isIssuedClient =
    params.createdByRole === "client" || params.createdByRole === "merchant";
  if (isIssuedClient && params.createdByUserId) {
    const clientProfile = await resolveProfile(params.createdByUserId);
    const clientName =
      clientProfile.displayName ||
      (params.createdByRole === "merchant" ? "Merchant" : "Client");
    const clientDelta = amount; // fee = 0 for now
    const clientAccountId = await ensureAccountInBatch(batch, {
      companyId: params.companyId,
      partyType: "client",
      partyUserId: params.createdByUserId,
      partyName: clientName,
      deltaJod: clientDelta,
    });
    const clientTxRef = db.doc(
      `financeTransactions/${deliveryTxId(params.orderId, "client")}`,
    );
    batch.set(clientTxRef, {
      companyId: params.companyId,
      accountId: clientAccountId,
      partyType: "client",
      partyUserId: params.createdByUserId,
      amountJod: clientDelta,
      type: "order_delivery",
      orderId: params.orderId,
      orderReference: params.orderReference,
      note,
      createdByUserId: params.driverId,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export function registerFinanceCallables(deps: {
  requireCompanyStaff: RequireCompanyStaffFn;
  run: RunFn;
}) {
  const {requireCompanyStaff, run} = deps;

  const listFinanceHub = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "accounts:read");
      const summarySnap = await financeSummaryRef(staff.companyId).get();
      if (summarySnap.exists) {
        return {
          drivers: {
            count: Number(summarySnap.get("drivers.count") ?? 0),
            totalJod: Number(summarySnap.get("drivers.totalJod") ?? 0),
          },
          clients: {
            count: Number(summarySnap.get("clients.count") ?? 0),
            totalJod: Number(summarySnap.get("clients.totalJod") ?? 0),
          },
        };
      }

      const snap = await db
        .collection("financeAccounts")
        .where("companyId", "==", staff.companyId)
        .get();

      let driversTotalOwedToCompany = 0;
      let clientsTotalOwedByCompany = 0;
      let driverCount = 0;
      let clientCount = 0;

      for (const doc of snap.docs) {
        const partyType = doc.get("partyType");
        const balance =
          typeof doc.get("balanceJod") === "number" ? doc.get("balanceJod") : 0;
        if (partyType === "driver") {
          driverCount += 1;
          driversTotalOwedToCompany += -balance;
        } else if (partyType === "client") {
          clientCount += 1;
          clientsTotalOwedByCompany += balance;
        }
      }

      return {
        drivers: {
          count: driverCount,
          totalJod: driversTotalOwedToCompany,
        },
        clients: {
          count: clientCount,
          totalJod: clientsTotalOwedByCompany,
        },
      };
    }),
  );

  const listFinanceParties = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "accounts:read");
      const input = objectInput(request.data ?? {});
      const kind = requiredString(input, "kind", 16);
      if (kind !== "driver" && kind !== "client") {
        throw new HttpsError("invalid-argument", "kind must be driver|client.");
      }
      const q = normalizeLower(optionalString(input, "q", 120));
      const page = parsePage(input);
      const pageSize = parsePageSize(input, 20, 50);
      const cursor = decodeCursor(input.cursor, "cursor");
      let query: Query = db
        .collection("financeAccounts")
        .where("companyId", "==", staff.companyId)
        .where("partyType", "==", kind);
      if (q) {
        query = query.where("partyNameLower", ">=", q).where("partyNameLower", "<=", `${q}\uf8ff`);
      }
      const totalSnapshot = await query.count().get();
      const orderedBase = query
        .orderBy("partyNameLower", "asc")
        .orderBy(FieldPath.documentId(), "asc");
      let ordered = orderedBase;
      let activeCursor = cursor;
      if (!activeCursor && page > 1) {
        for (let currentPage = 1; currentPage < page; currentPage += 1) {
          let stepQuery: Query = orderedBase;
          if (activeCursor) {
            stepQuery = orderedBase.startAfter(activeCursor.value, activeCursor.id);
          }
          const stepSnap = await stepQuery.limit(pageSize).get();
          const lastStepDoc = stepSnap.docs[stepSnap.docs.length - 1];
          if (!lastStepDoc) {
            return {
              parties: [],
              total: totalSnapshot.data().count,
              pageSize,
              page,
              hasMore: false,
              nextCursor: null,
            };
          }
          activeCursor = {
            value: String(lastStepDoc.get("partyNameLower") ?? ""),
            id: lastStepDoc.id,
          };
        }
      }
      if (activeCursor) {
        ordered = ordered.startAfter(activeCursor.value, activeCursor.id);
      }
      const totalCount = totalSnapshot.data().count;
      let snap = await ordered.limit(pageSize + 1).get();
      if (totalCount > 0 && snap.empty && page === 1 && !activeCursor) {
        await backfillFinanceAccountListFields(staff.companyId);
        snap = await ordered.limit(pageSize + 1).get();
      }
      const pageDocs = snap.docs.slice(0, pageSize);
      const parties = pageDocs.map((doc) => {
        const account = mapAccount(doc.id, doc.data());
        const displayBalanceJod =
          kind === "driver" ? -account.balanceJod : account.balanceJod;
        return {
          ...account,
          displayBalanceJod,
        };
      });
      const lastDoc = pageDocs[pageDocs.length - 1];
      const nextCursor =
        snap.docs.length > pageSize && lastDoc
          ? encodeCursor(String(lastDoc.get("partyNameLower") ?? ""), lastDoc.id)
          : null;
      return {
        parties,
        total: totalCount,
        pageSize,
        page,
        hasMore: Boolean(nextCursor),
        nextCursor,
      };
    }),
  );

  const listFinanceTransactions = onCall((request) =>
    run(async () => {
      const current = actor(request);
      const profile = await resolveProfile(current.uid);
      if (profile.status === "disabled" || profile.status === "suspended") {
        throw new HttpsError("permission-denied", "Account is not active.");
      }

      const input = objectInput(request.data ?? {});
      const partyUserIdInput = optionalString(input, "partyUserId", 128);
      const partyTypeInput = optionalString(input, "partyType", 16);
      const page = parsePage(input);
      const pageSize = parsePageSize(input, 25, 100);
      const cursor = decodeCursor(input.cursor, "cursor");

      const tokenRole =
        typeof current.token.role === "string" ? current.token.role : null;
      const role = profile.role ?? tokenRole;
      const tokenCompanyId =
        typeof current.token.companyId === "string"
          ? current.token.companyId
          : null;
      const companyId = profile.companyId ?? tokenCompanyId;

      const isStaff =
        role === "company_admin" ||
        role === "company_employee" ||
        role === "super_admin";

      let partyUserId: string;
      let partyType: FinancePartyType;
      let invertForViewer = false;

      if (isStaff) {
        await requireCompanyStaff(request, "accounts:read");
        if (!partyUserIdInput || !partyTypeInput) {
          throw new HttpsError(
            "invalid-argument",
            "partyUserId and partyType are required for company staff.",
          );
        }
        if (partyTypeInput !== "driver" && partyTypeInput !== "client") {
          throw new HttpsError(
            "invalid-argument",
            "partyType must be driver|client.",
          );
        }
        partyUserId = partyUserIdInput;
        partyType = partyTypeInput;
        invertForViewer = true;
      } else if (role === "driver") {
        partyUserId = current.uid;
        partyType = "driver";
      } else if (role === "client" || role === "merchant") {
        partyUserId = current.uid;
        partyType = "client";
      } else {
        throw new HttpsError("permission-denied", "Not allowed.");
      }

      if (!companyId) {
        throw new HttpsError("failed-precondition", "Company is required.");
      }

      const accountId = financeAccountId(companyId, partyType, partyUserId);
      const accountSnap = await db.doc(`financeAccounts/${accountId}`).get();
      const account = accountSnap.exists
        ? mapAccount(accountId, accountSnap.data() ?? {})
        : {
            id: accountId,
            companyId,
            partyType,
            partyUserId,
            partyName: profile.displayName || "",
            balanceJod: 0,
            updatedAt: null,
          };

      const txBaseQuery = db
        .collection("financeTransactions")
        .where("accountId", "==", accountId)
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc");
      let txQuery = txBaseQuery;
      let activeCursor = cursor;
      if (!activeCursor && page > 1) {
        for (let currentPage = 1; currentPage < page; currentPage += 1) {
          let stepQuery: Query = txBaseQuery;
          if (activeCursor) {
            stepQuery = txBaseQuery.startAfter(
              Timestamp.fromDate(new Date(activeCursor.value)),
              activeCursor.id,
            );
          }
          const stepSnap = await stepQuery.limit(pageSize).get();
          const lastStepDoc = stepSnap.docs[stepSnap.docs.length - 1];
          if (!lastStepDoc) {
            return {
              account: {
                ...account,
                displayBalanceJod: invertForViewer ? -account.balanceJod : account.balanceJod,
              },
              invertForViewer,
              transactions: [],
              pageSize,
              page,
              hasMore: false,
              nextCursor: null,
            };
          }
          activeCursor = {
            value:
              serializeTimestamp(lastStepDoc.get("createdAt")) ??
              new Date(0).toISOString(),
            id: lastStepDoc.id,
          };
        }
      }
      if (activeCursor) {
        const cursorDate = new Date(activeCursor.value);
        txQuery = txBaseQuery.startAfter(
          Timestamp.fromDate(cursorDate),
          activeCursor.id,
        );
      }
      const txSnap = await txQuery.limit(pageSize + 1).get();

      const pageDocs = txSnap.docs.slice(0, pageSize);
      const transactions = pageDocs.map((doc) => {
        const row = mapTransaction(doc.id, doc.data());
        return {
          ...row,
          displayAmountJod: invertForViewer ? -row.amountJod : row.amountJod,
        };
      });
      const lastTx = pageDocs[pageDocs.length - 1];
      const nextCursor =
        txSnap.docs.length > pageSize && lastTx
          ? encodeCursor(
              serializeTimestamp(lastTx.get("createdAt")) ?? new Date(0).toISOString(),
              lastTx.id,
            )
          : null;

      const displayBalanceJod = invertForViewer
        ? -account.balanceJod
        : account.balanceJod;

      return {
        account: {
          ...account,
          displayBalanceJod,
        },
        invertForViewer,
        transactions,
        pageSize,
        page,
        hasMore: Boolean(nextCursor),
        nextCursor,
      };
    }),
  );

  const addFinanceEntry = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "accounts:write");
      const input = objectInput(request.data);
      const partyUserId = requiredString(input, "partyUserId", 128);
      const partyTypeRaw = requiredString(input, "partyType", 16);
      if (partyTypeRaw !== "driver" && partyTypeRaw !== "client") {
        throw new HttpsError(
          "invalid-argument",
          "partyType must be driver|client.",
        );
      }
      const partyType = partyTypeRaw as FinancePartyType;
      const amountRaw = input.amountJod;
      if (typeof amountRaw !== "number" || !Number.isFinite(amountRaw)) {
        throw new InputError("amountJod", "amountJod must be a number.");
      }
      // Company enters amount from party perspective (same as party ledger signs).
      const amountJod = Math.round(amountRaw * 1000) / 1000;
      if (amountJod === 0) {
        throw new InputError("amountJod", "amountJod must be non-zero.");
      }
      const note = optionalString(input, "note", 200) ?? "";
      const typeRaw = optionalString(input, "type", 32) ?? "settlement";
      const type: FinanceTxType =
        typeRaw === "adjustment" ? "adjustment" : "settlement";

      const partyProfile = await resolveProfile(partyUserId);
      if (!partyProfile.companyId || partyProfile.companyId !== staff.companyId) {
        throw new HttpsError(
          "permission-denied",
          "Party does not belong to your company.",
        );
      }
      if (partyType === "driver" && partyProfile.role !== "driver") {
        throw new HttpsError("invalid-argument", "User is not a driver.");
      }
      if (
        partyType === "client" &&
        partyProfile.role !== "client" &&
        partyProfile.role !== "merchant"
      ) {
        throw new HttpsError("invalid-argument", "User is not a client.");
      }

      const partyName = partyProfile.displayName || partyUserId;
      const batch = db.batch();
      const accountId = await ensureAccountInBatch(batch, {
        companyId: staff.companyId,
        partyType,
        partyUserId,
        partyName,
        deltaJod: amountJod,
      });
      const txRef = db.collection("financeTransactions").doc();
      batch.set(txRef, {
        companyId: staff.companyId,
        accountId,
        partyType,
        partyUserId,
        amountJod,
        type,
        orderId: null,
        orderReference: null,
        note,
        createdByUserId: staff.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      const accountSnap = await db.doc(`financeAccounts/${accountId}`).get();
      return {
        transactionId: txRef.id,
        account: mapAccount(accountId, accountSnap.data() ?? {}),
      };
    }),
  );

  return {
    listFinanceHub,
    listFinanceParties,
    listFinanceTransactions,
    addFinanceEntry,
  };
}

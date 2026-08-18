import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
  type CallableRequest,
} from "firebase-functions/v2/https";
import {
  formatPublicLocation,
  parsePublicLocation,
  type PublicOrderLocation,
} from "../jordanLocations";
import {postOrderDeliveryLedger} from "../finance";
import {
  normalizedPhone,
  objectInput,
  optionalString,
  requiredString,
  type CompanyPermission,
} from "../helpers";
import {hotListCallableOptions} from "../shared/callableOptions";

if (!getApps().length) initializeApp();

const db = getFirestore();
const auth = getAuth();

type Request = CallableRequest<unknown>;

type OrderStatus =
  | "pendingCompany"
  | "companyAccepted"
  | "driverAssigned"
  | "onRoute"
  /** @deprecated legacy — treated as onRoute */
  | "shipped"
  | "cancelled"
  | "delivered";

const LISTABLE_ORDER_STATUSES = new Set([
  "pendingCompany",
  "companyAccepted",
  "driverAssigned",
  "onRoute",
  "shipped",
  "cancelled",
  "delivered",
]);

/** Role-oriented list buckets (mobile chips) → Firestore status values. */
const ORDER_STATUS_BUCKETS: Record<string, string[]> = {
  pending: ["pendingCompany"],
  active: ["companyAccepted", "driverAssigned", "onRoute", "shipped"],
  /** قيد الجلب — approved, awaiting collection complete. */
  toReceive: ["companyAccepted"],
  /** قيد التعيين — collected, awaiting / ready for driver. */
  needsDriver: ["driverAssigned"],
  onTheWay: ["onRoute", "shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

/** Expand filter status for buckets + legacy aliases (shipped ↔ onRoute). */
function expandStatusFilter(status: string | null): string[] | null {
  if (!status || status === "all") {
    return null;
  }
  const bucket = ORDER_STATUS_BUCKETS[status];
  if (bucket) {
    return bucket;
  }
  if (!LISTABLE_ORDER_STATUSES.has(status)) {
    throw new HttpsError("invalid-argument", "Unsupported order status filter.");
  }
  if (status === "onRoute") {
    return ["onRoute", "shipped"];
  }
  if (status === "shipped") {
    return ["shipped", "onRoute"];
  }
  return [status];
}

function withStatusFilter(query: Query, statuses: string[] | null): Query {
  if (!statuses || statuses.length === 0) {
    return query;
  }
  if (statuses.length === 1) {
    return query.where("status", "==", statuses[0]);
  }
  return query.where("status", "in", statuses);
}

function normalizeSearchField(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Free-text match on order identity / customer / addresses / assignment. */
function matchesOrderSearch(
  data: DocumentData,
  q: string | null,
  id?: string,
): boolean {
  if (!q) {
    return true;
  }
  const fields = [
    id,
    data.reference,
    data.customerName,
    data.customerPhone,
    data.pickupAddress,
    data.dropoffAddress,
    data.driverName,
    data.companyName,
  ];
  return fields.some((field) => normalizeSearchField(field).includes(q));
}

function filterOrdersBySearch(
  docs: Array<{id: string; data: DocumentData}>,
  q: string | null,
  pageSize: number,
): Array<{id: string; data: DocumentData}> {
  const filtered = q
    ? docs.filter((row) => matchesOrderSearch(row.data, q, row.id))
    : docs;
  return filtered.slice(0, pageSize);
}

function isIndexBuildingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as {code?: number | string}).code;
  const details = String((error as {details?: string}).details ?? "");
  const message = String((error as {message?: string}).message ?? "");
  return (
    code === 9 ||
    code === "failed-precondition" ||
    details.includes("requires an index") ||
    message.includes("requires an index") ||
    details.includes("currently building") ||
    message.includes("currently building")
  );
}

/**
 * Run ordered query with optional status. If composite status indexes are still
 * building, fall back to unfiltered fetch + in-memory status filter.
 */
async function fetchOrderedOrderDocs(
  base: Query,
  statusFilter: string[] | null,
  pageSize: number,
): Promise<Array<{id: string; data: DocumentData}>> {
  const run = async (statuses: string[] | null, limit: number) => {
    const snap = await withStatusFilter(base, statuses)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      data: docSnap.data(),
    }));
  };

  try {
    return await run(statusFilter, pageSize);
  } catch (error) {
    if (!statusFilter || !isIndexBuildingError(error)) {
      throw error;
    }
    const docs = await run(null, Math.min(100, Math.max(pageSize * 5, 50)));
    const allowed = new Set(statusFilter);
    return docs
      .filter((doc) => allowed.has(String(doc.data.status ?? "")))
      .slice(0, pageSize);
  }
}

type CreatedByRole =
  | "client"
  | "merchant"
  | "company_admin"
  | "company_employee";

function isIssuedAccountRole(
  role: string | null | undefined,
): role is "client" | "merchant" {
  return role === "client" || role === "merchant";
}

type TimelineEvent = {
  status: OrderStatus;
  at: Timestamp;
  note?: string;
};

export type OrderActor = {
  uid: string;
  companyId: string;
  role: string;
};

type RequireCompanyStaffFn = (
  request: Request,
  permission?: CompanyPermission | CompanyPermission[],
) => Promise<OrderActor>;

type RunFn = <T>(operation: () => Promise<T>) => Promise<T>;

function actor(request: Request): {uid: string; token: Record<string, unknown>} {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  return {
    uid: request.auth.uid,
    token: request.auth.token as Record<string, unknown>,
  };
}

async function resolveProfile(
  uid: string,
): Promise<{role: string | null; companyId: string | null; status: string | null}> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) {
    return {role: null, companyId: null, status: null};
  }
  const role = snap.get("role");
  const companyId = snap.get("companyId");
  const status = snap.get("status");
  return {
    role: typeof role === "string" ? role : null,
    companyId: typeof companyId === "string" ? companyId : null,
    status: typeof status === "string" ? status : null,
  };
}

async function healRoleClaims(
  uid: string,
  role: string,
  companyId: string | null,
): Promise<void> {
  try {
    const user = await auth.getUser(uid);
    const existing = user.customClaims ?? {};
    if (existing.role === role && existing.companyId === companyId) {
      return;
    }
    await auth.setCustomUserClaims(uid, {
      ...existing,
      role,
      ...(companyId ? {companyId} : {companyId: null}),
    });
  } catch {
    // Non-fatal: request can still proceed from profile.
  }
}

async function requireIssuedAccountCreator(
  request: Request,
): Promise<OrderActor> {
  const current = actor(request);
  const tokenRole =
    typeof current.token.role === "string" ? current.token.role : null;
  const tokenCompanyId =
    typeof current.token.companyId === "string"
      ? current.token.companyId
      : null;

  const profile = await resolveProfile(current.uid);
  if (profile.status === "disabled" || profile.status === "suspended") {
    throw new HttpsError("permission-denied", "Account is not active.");
  }

  // Profile is source of truth for issued accounts (token claims are often stale).
  const role = profile.role ?? tokenRole;
  const companyId = profile.companyId ?? tokenCompanyId;

  if (!isIssuedAccountRole(role) || !companyId) {
    throw new HttpsError(
      "permission-denied",
      "Client or merchant account required.",
    );
  }

  if (tokenRole !== role || tokenCompanyId !== companyId) {
    void healRoleClaims(current.uid, role, companyId);
  }

  return {uid: current.uid, companyId, role};
}

/** Short sequential tracking number, e.g. "12580" (UI shows #12580). */
async function nextOrderReference(): Promise<string> {
  const counterRef = db.doc("counters/orders");
  const seq = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current =
      typeof snap.get("seq") === "number" && Number.isFinite(snap.get("seq"))
        ? Math.max(0, Math.floor(snap.get("seq") as number))
        : 12000;
    const next = current + 1;
    tx.set(counterRef, {seq: next, updatedAt: FieldValue.serverTimestamp()}, {
      merge: true,
    });
    return next;
  });
  return String(seq);
}

function timelineEvent(status: OrderStatus, note?: string): TimelineEvent {
  return {
    status,
    at: Timestamp.now(),
    ...(note ? {note} : {}),
  };
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

function mapPublicLocation(value: unknown): PublicOrderLocation | null {
  return parsePublicLocation(value);
}

function mapOrder(id: string, data: DocumentData) {
  const timeline = Array.isArray(data.timeline)
    ? data.timeline.map((item: DocumentData) => ({
        status: String(item.status ?? ""),
        at: serializeTimestamp(item.at) ?? new Date(0).toISOString(),
        note: typeof item.note === "string" ? item.note : undefined,
      }))
    : [];

  return {
    id,
    reference: String(data.reference ?? id),
    companyId: String(data.companyId ?? ""),
    createdByUserId: String(data.createdByUserId ?? ""),
    createdByRole: String(data.createdByRole ?? ""),
    createdByName:
      typeof data.createdByName === "string" && data.createdByName.trim()
        ? data.createdByName.trim()
        : null,
    clientId:
      typeof data.clientId === "string" && data.clientId
        ? data.clientId
        : null,
    customerName: String(data.customerName ?? ""),
    customerPhone: String(data.customerPhone ?? ""),
    pickupAddress: String(data.pickupAddress ?? ""),
    dropoffAddress: String(data.dropoffAddress ?? ""),
    pickupLocation: mapPublicLocation(data.pickupLocation),
    dropoffLocation: mapPublicLocation(data.dropoffLocation),
    amountJod: typeof data.amountJod === "number" ? data.amountJod : 0,
    isCod: Boolean(data.isCod),
    notes:
      typeof data.notes === "string" && data.notes.trim()
        ? data.notes.trim()
        : null,
    status: String(data.status ?? "pendingCompany"),
    driverId:
      typeof data.driverId === "string" && data.driverId
        ? data.driverId
        : null,
    driverName:
      typeof data.driverName === "string" && data.driverName
        ? data.driverName
        : null,
    driverPhone:
      typeof data.driverPhone === "string" && data.driverPhone
        ? data.driverPhone
        : null,
    companyName:
      typeof data.companyName === "string" ? data.companyName : null,
    companyCode:
      typeof data.companyCode === "string" ? data.companyCode : null,
    timeline,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

async function loadCompanyMeta(companyId: string): Promise<{
  name: string | null;
  code: string | null;
}> {
  const snap = await db.doc(`companies/${companyId}`).get();
  if (!snap.exists) {
    return {name: null, code: null};
  }
  const name =
    (typeof snap.get("name") === "string" && snap.get("name")) ||
    (typeof snap.get("companyName") === "string" && snap.get("companyName")) ||
    null;
  const code =
    typeof snap.get("code") === "string" ? (snap.get("code") as string) : null;
  return {name, code};
}

async function loadUserDisplayName(uid: string): Promise<string | null> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) {
    return null;
  }
  const fullName =
    typeof snap.get("fullName") === "string"
      ? (snap.get("fullName") as string).trim()
      : "";
  const displayName =
    typeof snap.get("displayName") === "string"
      ? (snap.get("displayName") as string).trim()
      : "";
  return fullName || displayName || null;
}

function canViewOrder(
  order: DocumentData,
  viewer: {uid: string; role: string; companyId: string | null},
): boolean {
  if (viewer.role === "client" || viewer.role === "merchant") {
    return (
      order.createdByUserId === viewer.uid ||
      order.clientId === viewer.uid
    );
  }
  if (viewer.role === "driver") {
    return order.driverId === viewer.uid;
  }
  if (
    viewer.role === "company_admin" ||
    viewer.role === "company_employee"
  ) {
    return (
      typeof viewer.companyId === "string" &&
      order.companyId === viewer.companyId
    );
  }
  return false;
}

async function resolveViewer(
  request: Request,
  requireCompanyStaff: RequireCompanyStaffFn,
): Promise<{uid: string; role: string; companyId: string | null}> {
  const current = actor(request);
  const tokenRole =
    typeof current.token.role === "string" ? current.token.role : null;
  const tokenCompanyId =
    typeof current.token.companyId === "string"
      ? current.token.companyId
      : null;

  const profile = await resolveProfile(current.uid);
  if (profile.status === "disabled" || profile.status === "suspended") {
    throw new HttpsError("permission-denied", "Account is not active.");
  }

  // Always prefer Firestore profile — issued clients often have missing/stale
  // custom claims even after a forced ID token refresh on the client.
  const role = profile.role ?? tokenRole;
  const companyId = profile.companyId ?? tokenCompanyId;

  if (role === "company_admin" || role === "company_employee") {
    const staff = await requireCompanyStaff(request, [
      "orders:read",
      "orders:write",
    ]);
    return {uid: staff.uid, role: staff.role, companyId: staff.companyId};
  }

  if (role === "client" || role === "merchant" || role === "driver") {
    if (isIssuedAccountRole(role) && !companyId) {
      throw new HttpsError("permission-denied", "Client company required.");
    }
    if (tokenRole !== role || tokenCompanyId !== companyId) {
      void healRoleClaims(current.uid, role, companyId);
    }
    return {uid: current.uid, role, companyId};
  }

  throw new HttpsError("permission-denied", "Not allowed to view orders.");
}

export function registerOrderCallables(deps: {
  requireCompanyStaff: RequireCompanyStaffFn;
  run: RunFn;
}) {
  const {requireCompanyStaff, run} = deps;

  const createOrder = onCall((request) =>
    run(async () => {
      const input = objectInput(request.data);
      const customerName = optionalString(input, "customerName", 120) ?? "";
      let customerPhone = "";
      for (const field of ["customerPhone", "phoneNumber", "phone"] as const) {
        const raw = input[field];
        if (typeof raw === "string" && raw.trim()) {
          customerPhone = normalizedPhone(raw.trim());
          break;
        }
      }
      const pickupLocation = parsePublicLocation(input.pickupLocation);
      const dropoffLocation = parsePublicLocation(input.dropoffLocation);
      const pickupAddress =
        optionalString(input, "pickupAddress", 500) ??
        (pickupLocation ? formatPublicLocation(pickupLocation, "ar") : "");
      const dropoffAddress =
        optionalString(input, "dropoffAddress", 500) ??
        (dropoffLocation ? formatPublicLocation(dropoffLocation, "ar") : "");
      const amountJod =
        typeof input.amountJod === "number" && Number.isFinite(input.amountJod)
          ? Math.max(0, input.amountJod)
          : 0;
      const isCod = input.isCod !== false;
      const notes = optionalString(input, "notes", 2000);

      const hasAnyDetail =
        Boolean(customerName) ||
        Boolean(customerPhone) ||
        Boolean(pickupLocation) ||
        Boolean(dropoffLocation) ||
        Boolean(pickupAddress) ||
        Boolean(dropoffAddress) ||
        Boolean(notes) ||
        amountJod > 0;
      if (!hasAnyDetail) {
        throw new HttpsError(
          "invalid-argument",
          "Provide at least one order detail.",
        );
      }

      let creator: OrderActor;
      let status: OrderStatus;
      let clientId: string | null = null;
      let createdByRole: CreatedByRole;

      const current = actor(request);
      const tokenRole =
        typeof current.token.role === "string" ? current.token.role : null;

      if (isIssuedAccountRole(tokenRole)) {
        creator = await requireIssuedAccountCreator(request);
        status = "pendingCompany";
        clientId = creator.uid;
        createdByRole = creator.role === "merchant" ? "merchant" : "client";
      } else {
        // Also allow profile-based issued account if token stale
        const profile = await resolveProfile(current.uid);
        if (isIssuedAccountRole(profile.role) && profile.companyId) {
          creator = {
            uid: current.uid,
            companyId: profile.companyId,
            role: profile.role as string,
          };
          status = "pendingCompany";
          clientId = current.uid;
          createdByRole =
            profile.role === "merchant" ? "merchant" : "client";
        } else {
          creator = await requireCompanyStaff(request, "orders:write");
          status = "companyAccepted";
          createdByRole =
            creator.role === "company_admin"
              ? "company_admin"
              : "company_employee";
        }
      }

      const companyMeta = await loadCompanyMeta(creator.companyId);
      const createdByName = await loadUserDisplayName(creator.uid);
      const ref = db.collection("orders").doc();
      const reference = await nextOrderReference();
      const event = timelineEvent(status, "Order created");

      await ref.set({
        companyId: creator.companyId,
        createdByUserId: creator.uid,
        createdByRole,
        createdByName,
        clientId,
        customerName,
        customerPhone,
        pickupAddress,
        dropoffAddress,
        pickupLocation,
        dropoffLocation,
        amountJod,
        isCod,
        notes: notes ?? null,
        reference,
        status,
        driverId: null,
        driverName: null,
        companyName: companyMeta.name,
        companyCode: companyMeta.code,
        timeline: [event],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const snap = await ref.get();
      return {
        orderId: ref.id,
        status,
        order: mapOrder(ref.id, snap.data() ?? {}),
      };
    }),
  );

  const listOrders = onCall(hotListCallableOptions, (request) =>
    run(async () => {
      const viewer = await resolveViewer(request, requireCompanyStaff);
      const input = objectInput(request.data ?? {});
      const pageSizeRaw =
        typeof input.pageSize === "number" ? input.pageSize : 50;
      const pageSize = Math.min(100, Math.max(1, Math.floor(pageSizeRaw)));
      const statusFilter = expandStatusFilter(
        optionalString(input, "status", 64),
      );
      const qRaw = optionalString(input, "q", 120);
      const q = qRaw ? qRaw.trim().toLowerCase() : null;
      // Search needs a wider pool; Firestore has no full-text index here.
      const fetchLimit = q
        ? Math.min(100, Math.max(pageSize * 5, 50))
        : pageSize;

      if (viewer.role === "client" || viewer.role === "merchant") {
        // Match plan: createdByUserId or clientId (issued accounts use both on create).
        const [byCreator, byClient] = await Promise.all([
          fetchOrderedOrderDocs(
            db.collection("orders").where("createdByUserId", "==", viewer.uid),
            statusFilter,
            fetchLimit,
          ),
          fetchOrderedOrderDocs(
            db.collection("orders").where("clientId", "==", viewer.uid),
            statusFilter,
            fetchLimit,
          ),
        ]);
        const byId = new Map<string, DocumentData>();
        for (const row of [...byCreator, ...byClient]) {
          byId.set(row.id, row.data);
        }
        const ranked = [...byId.entries()]
          .map(([id, data]) => ({id, data}))
          .sort((a, b) => {
            const aAt = serializeTimestamp(a.data.createdAt) ?? "";
            const bAt = serializeTimestamp(b.data.createdAt) ?? "";
            return aAt < bAt ? 1 : aAt > bAt ? -1 : 0;
          });
        const docs = filterOrdersBySearch(ranked, q, pageSize);
        const orders = docs.map((row) => mapOrder(row.id, row.data));
        return {orders, total: orders.length};
      }

      if (viewer.role === "driver") {
        const docs = filterOrdersBySearch(
          await fetchOrderedOrderDocs(
            db.collection("orders").where("driverId", "==", viewer.uid),
            statusFilter,
            fetchLimit,
          ),
          q,
          pageSize,
        );
        const orders = docs.map((row) => mapOrder(row.id, row.data));
        return {orders, total: orders.length};
      }

      const accountId =
        optionalString(input, "accountId", 128) ??
        optionalString(input, "clientId", 128);

      if (accountId) {
        const accountSnap = await db.doc(`users/${accountId}`).get();
        if (
          !accountSnap.exists ||
          accountSnap.get("companyId") !== viewer.companyId
        ) {
          throw new HttpsError(
            "not-found",
            "Account not found in this company.",
          );
        }
        const accountRole = accountSnap.get("role");
        if (accountRole !== "client" && accountRole !== "merchant") {
          throw new HttpsError(
            "permission-denied",
            "Order history is only available for clients and merchants.",
          );
        }

        const [byCreator, byClient] = await Promise.all([
          fetchOrderedOrderDocs(
            db
              .collection("orders")
              .where("createdByUserId", "==", accountId),
            statusFilter,
            fetchLimit,
          ),
          fetchOrderedOrderDocs(
            db.collection("orders").where("clientId", "==", accountId),
            statusFilter,
            fetchLimit,
          ),
        ]);
        const byId = new Map<string, DocumentData>();
        for (const row of [...byCreator, ...byClient]) {
          if (row.data.companyId === viewer.companyId) {
            byId.set(row.id, row.data);
          }
        }
        const ranked = [...byId.entries()]
          .map(([id, data]) => ({id, data}))
          .sort((a, b) => {
            const aAt = serializeTimestamp(a.data.createdAt) ?? "";
            const bAt = serializeTimestamp(b.data.createdAt) ?? "";
            return aAt < bAt ? 1 : aAt > bAt ? -1 : 0;
          });
        const docs = filterOrdersBySearch(ranked, q, pageSize);
        const orders = docs.map((row) => mapOrder(row.id, row.data));
        return {orders, total: orders.length};
      }

      const docs = filterOrdersBySearch(
        await fetchOrderedOrderDocs(
          db.collection("orders").where("companyId", "==", viewer.companyId),
          statusFilter,
          fetchLimit,
        ),
        q,
        pageSize,
      );
      const orders = docs.map((row) => mapOrder(row.id, row.data));
      return {orders, total: orders.length};
    }),
  );

  const getOrder = onCall((request) =>
    run(async () => {
      const viewer = await resolveViewer(request, requireCompanyStaff);
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const snap = await db.doc(`orders/${orderId}`).get();
      if (!snap.exists) {
        throw new HttpsError("not-found", "Order not found.");
      }
      const data = snap.data() ?? {};
      if (!canViewOrder(data, viewer)) {
        throw new HttpsError("permission-denied", "Order not visible.");
      }
      return {order: mapOrder(snap.id, data)};
    }),
  );

  const acceptOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const ref = db.doc(`orders/${orderId}`);
      const snap = await ref.get();
      if (!snap.exists || snap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }
      if (snap.get("status") !== "pendingCompany") {
        throw new HttpsError(
          "failed-precondition",
          "Only pending company orders can be accepted.",
        );
      }
      const event = timelineEvent("companyAccepted", "Accepted by company");
      await ref.update({
        status: "companyAccepted",
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const updated = await ref.get();
      return {
        orderId,
        status: "companyAccepted",
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  const cancelOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const ref = db.doc(`orders/${orderId}`);
      const snap = await ref.get();
      if (!snap.exists || snap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }
      if (snap.get("status") !== "pendingCompany") {
        throw new HttpsError(
          "failed-precondition",
          "Only pending company orders can be rejected.",
        );
      }
      const event = timelineEvent("cancelled", "Rejected by company");
      await ref.update({
        status: "cancelled",
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const updated = await ref.get();
      return {
        orderId,
        status: "cancelled",
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  const assignDriverToOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const driverId = requiredString(input, "driverId", 128);

      const orderRef = db.doc(`orders/${orderId}`);
      const driverRef = db.doc(`drivers/${driverId}`);
      const [orderSnap, driverSnap] = await Promise.all([
        orderRef.get(),
        driverRef.get(),
      ]);

      if (!orderSnap.exists || orderSnap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }
      if (
        !driverSnap.exists ||
        driverSnap.get("companyId") !== staff.companyId
      ) {
        throw new HttpsError("not-found", "Driver not found in this company.");
      }

      const status = String(orderSnap.get("status") ?? "");
      // Assign only from قيد التعيين; reassign while قيد التوصيل.
      const canFreshAssign = status === "driverAssigned";
      const canReassign = status === "onRoute" || status === "shipped";
      if (!canFreshAssign && !canReassign) {
        throw new HttpsError(
          "failed-precondition",
          "Driver can only be assigned after pickup is completed.",
        );
      }

      const driverName =
        (typeof driverSnap.get("fullName") === "string" &&
          driverSnap.get("fullName")) ||
        (typeof driverSnap.get("displayName") === "string" &&
          driverSnap.get("displayName")) ||
        "Driver";
      const driverPhoneRaw =
        (typeof driverSnap.get("phoneNumber") === "string" &&
          driverSnap.get("phoneNumber")) ||
        (typeof driverSnap.get("phone") === "string" &&
          driverSnap.get("phone")) ||
        null;
      const driverPhone =
        typeof driverPhoneRaw === "string" && driverPhoneRaw.trim()
          ? driverPhoneRaw.trim()
          : null;

      const nextStatus = "onRoute";
      const event = timelineEvent(
        "onRoute",
        canReassign
          ? `Reassigned to ${driverName} — out for delivery`
          : `Assigned to ${driverName} — out for delivery`,
      );
      await orderRef.update({
        driverId,
        driverName,
        driverPhone,
        status: nextStatus,
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const previousDriverId = orderSnap.get("driverId");
      if (typeof previousDriverId === "string" && previousDriverId && previousDriverId !== driverId) {
        await db.doc(`drivers/${previousDriverId}`).set(
          {
            activeOrders: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }
      if (previousDriverId !== driverId) {
        await driverRef.set(
          {
            activeOrders: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }

      const updated = await orderRef.get();
      return {
        orderId,
        status: nextStatus,
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  const unassignDriverFromOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists || orderSnap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }
      const previousDriverId = orderSnap.get("driverId");
      if (typeof previousDriverId !== "string" || !previousDriverId) {
        throw new HttpsError("failed-precondition", "Order has no driver.");
      }

      const currentStatus = String(orderSnap.get("status") ?? "");
      if (currentStatus !== "onRoute" && currentStatus !== "shipped") {
        throw new HttpsError(
          "failed-precondition",
          "Driver can only be unassigned while the order is out for delivery.",
        );
      }

      const event = timelineEvent(
        "driverAssigned",
        "Driver unassigned — awaiting assignment",
      );
      await orderRef.update({
        driverId: null,
        driverName: null,
        driverPhone: null,
        status: "driverAssigned",
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await db.doc(`drivers/${previousDriverId}`).set(
        {
          activeOrders: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

      const updated = await orderRef.get();
      return {
        orderId,
        status: "driverAssigned",
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  /**
   * Company staff hard-deletes an early-queue order (pending / accepted, no transit).
   */
  const deleteOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");
      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists || orderSnap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }

      const status = String(orderSnap.get("status") ?? "");
      if (status !== "pendingCompany" && status !== "companyAccepted" && status !== "driverAssigned") {
        throw new HttpsError(
          "failed-precondition",
          "Only orders before delivery can be deleted.",
        );
      }
      if (status === "driverAssigned" && orderSnap.get("driverId")) {
        throw new HttpsError(
          "failed-precondition",
          "Unassign the driver before deleting this order.",
        );
      }

      const previousDriverId = orderSnap.get("driverId");
      await orderRef.delete();

      if (typeof previousDriverId === "string" && previousDriverId) {
        await db.doc(`drivers/${previousDriverId}`).set(
          {
            activeOrders: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }

      await db.doc(`auditLogs/order_deleted:${orderId}`).set({
        orderId,
        companyId: staff.companyId,
        deletedBy: staff.uid,
        previousStatus: status,
        reference:
          typeof orderSnap.get("reference") === "string"
            ? orderSnap.get("reference")
            : null,
        at: FieldValue.serverTimestamp(),
      });

      return {orderId, status: "deleted"};
    }),
  );

  /**
   * Company staff completes pickup/collection (قيد الجلب → قيد التعيين).
   * Callable name kept for client compatibility.
   * companyAccepted → driverAssigned (awaiting driver; no driverId yet).
   */
  const driverReceiveOrder = onCall((request) =>
    run(async () => {
      const staff = await requireCompanyStaff(request, "orders:write");

      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists || orderSnap.get("companyId") !== staff.companyId) {
        throw new HttpsError("not-found", "Order not found.");
      }
      const status = String(orderSnap.get("status") ?? "");
      if (status !== "companyAccepted") {
        throw new HttpsError(
          "failed-precondition",
          "Only orders awaiting pickup can be marked collected.",
        );
      }

      const event = timelineEvent(
        "driverAssigned",
        "Pickup completed — awaiting driver assignment",
      );
      await orderRef.update({
        status: "driverAssigned",
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await orderRef.get();
      return {
        orderId,
        status: "driverAssigned",
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  /**
   * Assigned driver marks order delivered.
   * onRoute (or legacy shipped) → delivered + finance ledger posts.
   */
  const driverDeliverOrder = onCall((request) =>
    run(async () => {
      const viewer = await resolveViewer(request, requireCompanyStaff);
      if (viewer.role !== "driver") {
        throw new HttpsError("permission-denied", "Driver account required.");
      }

      const input = objectInput(request.data);
      const orderId = requiredString(input, "orderId", 128);
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found.");
      }
      if (orderSnap.get("driverId") !== viewer.uid) {
        throw new HttpsError(
          "permission-denied",
          "This order is not assigned to you.",
        );
      }
      const status = String(orderSnap.get("status") ?? "");
      if (status !== "onRoute" && status !== "shipped") {
        throw new HttpsError(
          "failed-precondition",
          "Order is not on route for delivery.",
        );
      }

      const event = timelineEvent("delivered", "Driver delivered order");
      await orderRef.update({
        status: "delivered",
        timeline: FieldValue.arrayUnion(event),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const data = orderSnap.data() ?? {};
      const companyId = String(data.companyId ?? "");
      const amountJod =
        typeof data.amountJod === "number" && Number.isFinite(data.amountJod)
          ? data.amountJod
          : 0;
      const reference = String(data.reference ?? orderId);
      const customerName = String(data.customerName ?? "");
      const driverName = String(data.driverName ?? "");
      const createdByUserId = String(data.createdByUserId ?? "");
      const createdByRole = String(data.createdByRole ?? "");

      if (companyId) {
        await postOrderDeliveryLedger({
          companyId,
          orderId,
          orderReference: reference,
          customerName,
          amountJod,
          driverId: viewer.uid,
          driverName,
          createdByUserId,
          createdByRole,
        });
      }

      const driverRef = db.doc(`drivers/${viewer.uid}`);
      await driverRef.set(
        {
          activeOrders: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

      const updated = await orderRef.get();
      return {
        orderId,
        status: "delivered",
        order: mapOrder(orderId, updated.data() ?? {}),
      };
    }),
  );

  return {
    createOrder,
    listOrders,
    getOrder,
    acceptOrder,
    cancelOrder,
    assignDriverToOrder,
    unassignDriverFromOrder,
    deleteOrder,
    driverReceiveOrder,
    driverDeliverOrder,
  };
}

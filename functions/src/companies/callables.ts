import {FieldValue, FieldPath, type Query} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {RESET_VALUE} from "firebase-functions/v2/options";
import {
  InputError,
  assertPendingTransition,
  normalizedPhone,
  normalizedUsername,
  objectInput,
  optionalString,
  requiredString,
  sanitizePermissions,
  stableApplicationId,
  type CompanyPermission,
} from "../helpers";
import {
  auth,
  db,
  decodeCursor,
  encodeCursor,
  normalizeIssuedUserDocFields,
  normalizeLower,
  parsePage,
  parsePageSize,
  requireCompanyStaff,
  requireRole,
  requireVerifiedApplicant,
  requiredAlias,
  run,
  setRoleClaims,
  type IssuedUserRole,
} from "../shared";

const LIST_BACKFILL_BATCH = 400;

/** Backfill sort/search fields on legacy issued-user docs missing usernameLower. */
async function backfillIssuedUserListFields(
  companyId: string,
  role: IssuedUserRole,
): Promise<void> {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  for (;;) {
    let query: Query = db
      .collection("users")
      .where("companyId", "==", companyId)
      .where("role", "==", role)
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
      if (doc.get("usernameLower") == null) {
        const data = doc.data();
        const username = String(data.displayName ?? data.username ?? "");
        batch.update(
          doc.ref,
          normalizeIssuedUserDocFields({
            username,
            fullName: String(data.fullName ?? username),
            email: typeof data.email === "string" ? data.email : null,
          }),
        );
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

export const submitCompanyApplication = onCall((request) =>
  run(async () => {
    const uid = requireVerifiedApplicant(request);
    const input = objectInput(request.data);
    const companyName = requiredString(input, "companyName", 160);
    const registrationNumber = requiredAlias(
      input,
      ["commercialRegistrationNumber", "commercialRegister", "registrationNumber"],
      80,
    );
    const contactName = requiredString(input, "contactName", 120);
    const phoneNumber = normalizedPhone(requiredAlias(input, ["phoneNumber", "phone"], 24));
    const email = optionalString(input, "email", 200) ??
      (typeof request.auth?.token.email === "string" ? request.auth.token.email : null);
    const city = optionalString(input, "city", 120);
    const address = optionalString(input, "address", 500);
    const companyCode = optionalString(input, "companyCode", 40);
    const notes = optionalString(input, "notes", 1000);
    const maxDrivers = typeof input.maxDrivers === "number" ? input.maxDrivers : 20;
    const displayName = typeof request.auth?.token.name === "string" ?
      request.auth.token.name : contactName;
    const applicationId = stableApplicationId("company", uid);
    const ref = db.doc(`companyApplications/${applicationId}`);

    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) {
        if (existing.get("status") === "rejected") {
          tx.update(ref, {
            companyName,
            registrationNumber,
            commercialRegistrationNumber: registrationNumber,
            commercialRegister: registrationNumber,
            contactName,
            phoneNumber,
            phone: phoneNumber,
            email,
            city,
            address,
            companyCode,
            notes,
            maxDrivers,
            status: "pending",
            rejectionReason: null,
            reviewNote: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
          return {applicationId, status: "pending"};
        }
        return {applicationId, status: existing.get("status") as string};
      }
      tx.create(ref, {
        applicantUid: uid,
        userId: uid,
        companyName,
        registrationNumber,
        commercialRegistrationNumber: registrationNumber,
        commercialRegister: registrationNumber,
        contactName,
        phoneNumber,
        phone: phoneNumber,
        email,
        city,
        address,
        companyCode,
        notes,
        maxDrivers,
        status: "pending",
        rejectionReason: null,
        reviewNote: null,
        companyId: null,
        createdAt: FieldValue.serverTimestamp(),
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        db.doc(`users/${uid}`),
        {
          uid,
          displayName,
          email,
          phoneNumber: null,
          role: null,
          companyId: null,
          status: "pending",
          lastLoginAt: null,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      return {applicationId, status: "pending"};
    });
    return result;
  }),
);

export const approveCompanyApplication = onCall((request) =>
  run(async () => {
    const adminUid = requireRole(request, "super_admin");
    const input = objectInput(request.data);
    const applicationId = requiredString(input, "applicationId", 180);
    const ref = db.doc(`companyApplications/${applicationId}`);
    let applicantUid = "";
    let companyId = "";

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Application not found.");
      applicantUid = snapshot.get("applicantUid") as string;
      companyId = `company_${applicantUid}`;
      assertPendingTransition(snapshot.get("status"), "approved");
      tx.set(
        db.doc(`companies/${companyId}`),
        {
          code: snapshot.get("companyCode") ?? companyId.slice(-8).toUpperCase(),
          name: snapshot.get("companyName"),
          companyName: snapshot.get("companyName"),
          legalName: snapshot.get("companyName"),
          registrationNumber: snapshot.get("registrationNumber"),
          commercialRegistrationNumber: snapshot.get("registrationNumber"),
          address: {
            city: snapshot.get("city") ?? "",
            area: null,
            street: null,
            details: snapshot.get("address") ?? "",
            location: null,
          },
          contact: {
            name: snapshot.get("contactName"),
            email: snapshot.get("email") ?? "",
            phoneNumber: snapshot.get("phoneNumber"),
          },
          maxDrivers: snapshot.get("maxDrivers") ?? 20,
          status: "active",
          adminUid: applicantUid,
          createdByUserId: applicantUid,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: snapshot.get("createdAt") ?? FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.set(
        db.doc(`users/${applicantUid}`),
        {
          uid: applicantUid,
          role: "company_admin",
          companyId,
          status: "active",
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.update(ref, {
        status: "approved",
        companyId,
        reviewedBy: adminUid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.doc(`auditLogs/company_application_approved:${applicationId}`), {
        action: "company_application_approved",
        actorUid: adminUid,
        entityType: "companyApplication",
        entityId: applicationId,
        companyId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await setRoleClaims(applicantUid, "company_admin", companyId);
    return {applicationId, companyId, status: "approved"};
  }),
);

export const rejectCompanyApplication = onCall((request) =>
  run(async () => {
    const adminUid = requireRole(request, "super_admin");
    const input = objectInput(request.data);
    const applicationId = requiredString(input, "applicationId", 180);
    const reason = requiredString(input, "reason", 500);
    const ref = db.doc(`companyApplications/${applicationId}`);
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Application not found.");
      assertPendingTransition(snapshot.get("status"), "rejected");
      tx.update(ref, {
        status: "rejected",
        rejectionReason: reason,
        reviewNote: reason,
        reviewedBy: adminUid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.doc(`auditLogs/company_application_rejected:${applicationId}`), {
        action: "company_application_rejected",
        actorUid: adminUid,
        entityType: "companyApplication",
        entityId: applicationId,
        companyId: null,
        metadata: {reason},
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return {applicationId, status: "rejected"};
  }),
);

function employeeEmail(username: string, companyId: string): string {
  const safeCompany = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "co";
  return `${username}+${safeCompany}@employees.wasel.app`;
}

function clientEmail(username: string, companyId: string): string {
  const safeCompany = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "co";
  return `${username}+${safeCompany}@clients.wasel.app`;
}

function merchantEmail(username: string, companyId: string): string {
  const safeCompany = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "co";
  return `${username}+${safeCompany}@merchants.wasel.app`;
}

function issuedUserEmail(
  role: IssuedUserRole,
  username: string,
  companyId: string,
): string {
  if (role === "client") return clientEmail(username, companyId);
  if (role === "merchant") return merchantEmail(username, companyId);
  return employeeEmail(username, companyId);
}

async function createCompanyIssuedUser(args: {
  admin: {uid: string; companyId: string; role: string};
  role: IssuedUserRole;
  username: string;
  password: string;
  fullName: string;
  permissions?: CompanyPermission[];
  auditAction: string;
  entityType: string;
}): Promise<{userId: string; username: string; companyId: string; status: string}> {
  const {
    admin,
    role,
    username,
    password,
    fullName,
    permissions = [],
    auditAction,
    entityType,
  } = args;
  const email = issuedUserEmail(role, username, admin.companyId);

  const existingUsername = await db
    .collection("users")
    .where("displayName", "==", username)
    .limit(1)
    .get();
  if (!existingUsername.empty) {
    throw new HttpsError("already-exists", "Username is already taken.");
  }

  let user;
  try {
    user = await auth.createUser({
      email,
      password,
      displayName: username,
      emailVerified: true,
    });
  } catch (error: unknown) {
    const code = (error as {code?: string}).code;
    if (code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Account already exists.");
    }
    throw error;
  }

  const uid = user.uid;
  const normalizedFields = normalizeIssuedUserDocFields({
    username,
    fullName,
    email,
  });
  await db.doc(`users/${uid}`).set({
    uid,
    role,
    companyId: admin.companyId,
    status: "active",
    displayName: username,
    fullName,
    email,
    phoneNumber: null,
    profileComplete: true,
    permissions,
    createdBy: admin.uid,
    lastLoginAt: null,
    ...normalizedFields,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.doc(`auditLogs/${auditAction}:${uid}`).set({
    action: auditAction,
    actorUid: admin.uid,
    entityType,
    entityId: uid,
    companyId: admin.companyId,
    createdAt: FieldValue.serverTimestamp(),
  });
  await setRoleClaims(uid, role, admin.companyId);
  return {
    userId: uid,
    username,
    companyId: admin.companyId,
    status: "active",
  };
}

async function listCompanyIssuedUsers(
  admin: {uid: string; companyId: string},
  role: IssuedUserRole,
  input: Record<string, unknown>,
) {
  const q = normalizeLower(optionalString(input, "q", 120));
  const status = optionalString(input, "status", 40);
  const page = parsePage(input);
  const pageSize = parsePageSize(input, 20, 50);
  const cursor = decodeCursor(input.cursor, "cursor");

  let query: Query = db
    .collection("users")
    .where("companyId", "==", admin.companyId)
    .where("role", "==", role);
  if (status && status !== "all") {
    query = query.where("status", "==", status);
  }
  if (q) {
    query = query.where("searchTokens", "array-contains", q);
  }

  const totalSnapshot = await query.count().get();
  const orderedBase = query
    .orderBy("usernameLower", "asc")
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
          items: [],
          total: totalSnapshot.data().count,
          pageSize,
          page,
          hasMore: false,
          nextCursor: null,
        };
      }
      activeCursor = {
        value: String(lastStepDoc.get("usernameLower") ?? ""),
        id: lastStepDoc.id,
      };
    }
  }
  if (activeCursor) {
    ordered = ordered.startAfter(activeCursor.value, activeCursor.id);
  }
  const totalCount = totalSnapshot.data().count;
  let snapshot = await ordered.limit(pageSize + 1).get();
  if (totalCount > 0 && snapshot.empty && page === 1 && !activeCursor) {
    await backfillIssuedUserListFields(admin.companyId, role);
    snapshot = await ordered.limit(pageSize + 1).get();
  }
  const docs = snapshot.docs;
  const pageDocs = docs.slice(0, pageSize);
  const items = pageDocs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      username: (data.displayName as string) ?? "",
      displayName:
        (data.fullName as string) ?? (data.displayName as string) ?? "",
      email: (data.email as string) ?? null,
      phoneNumber:
        (data.phoneNumber as string | null) ??
        (data.phone as string | null) ??
        null,
      status: (data.status as string) ?? "active",
      permissions: sanitizePermissions(data.permissions),
      companyId: admin.companyId,
    };
  });
  const lastDoc = pageDocs[pageDocs.length - 1];
  const nextCursor =
    docs.length > pageSize && lastDoc
      ? encodeCursor(String(lastDoc.get("usernameLower") ?? ""), lastDoc.id)
      : null;

  return {
    items,
    total: totalCount,
    pageSize,
    page,
    hasMore: Boolean(nextCursor),
    nextCursor,
  };
}

async function disableCompanyIssuedUser(
  admin: {uid: string; companyId: string},
  role: IssuedUserRole,
  userId: string,
  auditAction: string,
  entityType: string,
) {
  const userRef = db.doc(`users/${userId}`);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Account not found.");
  }
  if (snap.get("companyId") !== admin.companyId || snap.get("role") !== role) {
    throw new HttpsError("permission-denied", "Account is not in this company.");
  }

  await userRef.set(
    {
      status: "disabled",
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
  await auth.updateUser(userId, {disabled: true});
  await db.doc(`auditLogs/${auditAction}:${userId}`).set({
    action: auditAction,
    actorUid: admin.uid,
    entityType,
    entityId: userId,
    companyId: admin.companyId,
    createdAt: FieldValue.serverTimestamp(),
  });
  return {userId, status: "disabled"};
}

export const createCompanyEmployee = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "employees:manage");
    const input = objectInput(request.data);
    const username = normalizedUsername(requiredString(input, "username", 32));
    const password = requiredString(input, "password", 128);
    if (password.length < 8) {
      throw new InputError("password", "Password must be at least 8 characters.");
    }
    const fullName =
      optionalString(input, "displayName", 120) ??
      optionalString(input, "fullName", 120) ??
      username;
    const permissions = sanitizePermissions(input.permissions).filter(
      (key) => admin.role === "company_admin" || key !== "employees:manage",
    );
    const created = await createCompanyIssuedUser({
      admin,
      role: "company_employee",
      username,
      password,
      fullName,
      permissions,
      auditAction: "employee_created",
      entityType: "employee",
    });
    return {
      employeeId: created.userId,
      companyId: created.companyId,
      username: created.username,
      status: created.status,
    };
  }),
);

export const createCompanyClient = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "customers:manage");
    const input = objectInput(request.data);
    const username = normalizedUsername(requiredString(input, "username", 32));
    const password = requiredString(input, "password", 128);
    if (password.length < 8) {
      throw new InputError("password", "Password must be at least 8 characters.");
    }
    const fullName =
      optionalString(input, "displayName", 120) ??
      optionalString(input, "fullName", 120) ??
      username;
    const created = await createCompanyIssuedUser({
      admin,
      role: "client",
      username,
      password,
      fullName,
      permissions: [],
      auditAction: "client_created",
      entityType: "client",
    });
    return {
      clientId: created.userId,
      companyId: created.companyId,
      username: created.username,
      status: created.status,
    };
  }),
);

export const createCompanyMerchant = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "merchants:manage");
    const input = objectInput(request.data);
    const username = normalizedUsername(requiredString(input, "username", 32));
    const password = requiredString(input, "password", 128);
    if (password.length < 8) {
      throw new InputError("password", "Password must be at least 8 characters.");
    }
    const fullName =
      optionalString(input, "displayName", 120) ??
      optionalString(input, "fullName", 120) ??
      username;
    const created = await createCompanyIssuedUser({
      admin,
      role: "merchant",
      username,
      password,
      fullName,
      permissions: ["orders:read"],
      auditAction: "merchant_created",
      entityType: "merchant",
    });
    return {
      merchantId: created.userId,
      companyId: created.companyId,
      username: created.username,
      status: created.status,
    };
  }),
);

export const listCompanyClients = onCall({
  minInstances: RESET_VALUE,
  maxInstances: 10,
}, (request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "customers:manage");
    const input = objectInput(request.data ?? {});
    const result = await listCompanyIssuedUsers(admin, "client", input);
    return {
      clients: result.items,
      total: result.total,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }),
);

export const listCompanyMerchants = onCall({
  minInstances: RESET_VALUE,
  maxInstances: 10,
}, (request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, [
      "merchants:read",
      "merchants:manage",
    ]);
    const input = objectInput(request.data ?? {});
    const result = await listCompanyIssuedUsers(admin, "merchant", input);
    return {
      merchants: result.items,
      total: result.total,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }),
);

export const deleteCompanyClient = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "customers:manage");
    const input = objectInput(request.data);
    const clientId = requiredString(input, "clientId", 128);
    const result = await disableCompanyIssuedUser(
      admin,
      "client",
      clientId,
      "client_deleted",
      "client",
    );
    return {clientId: result.userId, status: result.status};
  }),
);

export const deleteCompanyMerchant = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "merchants:manage");
    const input = objectInput(request.data);
    const merchantId = requiredString(input, "merchantId", 128);
    const result = await disableCompanyIssuedUser(
      admin,
      "merchant",
      merchantId,
      "merchant_deleted",
      "merchant",
    );
    return {merchantId: result.userId, status: result.status};
  }),
);

export const listCompanyEmployees = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "employees:manage");
    const input = objectInput(request.data ?? {});
    const result = await listCompanyIssuedUsers(admin, "company_employee", input);

    return {
      employees: result.items,
      total: result.total,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }),
);

export const updateCompanyEmployee = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "employees:manage");
    const input = objectInput(request.data);
    const employeeId = requiredString(input, "employeeId", 128);
    const userRef = db.doc(`users/${employeeId}`);
    const snap = await userRef.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Employee not found.");
    }
    if (
      snap.get("companyId") !== admin.companyId ||
      snap.get("role") !== "company_employee"
    ) {
      throw new HttpsError("permission-denied", "Employee is not in this company.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.permissions !== undefined) {
      patch.permissions = sanitizePermissions(input.permissions).filter(
        (key) => admin.role === "company_admin" || key !== "employees:manage",
      );
    }
    if (input.displayName !== undefined || input.fullName !== undefined) {
      patch.fullName =
        optionalString(input, "displayName", 120) ??
        optionalString(input, "fullName", 120);
      patch.displayName = patch.fullName;
    }
    if (input.status !== undefined) {
      const status = requiredString(input, "status", 20);
      if (status !== "active" && status !== "suspended" && status !== "disabled") {
        throw new InputError("status", "Invalid employee status.");
      }
      patch.status = status;
      if (status === "disabled" || status === "suspended") {
        await auth.updateUser(employeeId, {disabled: status === "disabled"});
      } else {
        await auth.updateUser(employeeId, {disabled: false});
      }
    }

    const nextFullName =
      typeof patch.fullName === "string" ?
        patch.fullName :
        ((snap.get("fullName") as string | undefined) ??
          (snap.get("displayName") as string | undefined) ??
          "");
    const nextUsername =
      ((snap.get("displayName") as string | undefined) ?? nextFullName);
    const nextEmail =
      ((snap.get("email") as string | undefined) ?? null);
    Object.assign(
      patch,
      normalizeIssuedUserDocFields({
        username: nextUsername,
        fullName: nextFullName,
        email: nextEmail,
      }),
    );

    await userRef.set(patch, {merge: true});
    return {employeeId, status: "updated"};
  }),
);

export const deleteCompanyEmployee = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "employees:manage");
    const input = objectInput(request.data);
    const employeeId = requiredString(input, "employeeId", 128);
    const userRef = db.doc(`users/${employeeId}`);
    const snap = await userRef.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Employee not found.");
    }
    if (
      snap.get("companyId") !== admin.companyId ||
      snap.get("role") !== "company_employee"
    ) {
      throw new HttpsError("permission-denied", "Employee is not in this company.");
    }

    await userRef.set(
      {
        status: "disabled",
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    await auth.updateUser(employeeId, {disabled: true});
    await db.doc(`auditLogs/employee_deleted:${employeeId}`).set({
      action: "employee_deleted",
      actorUid: admin.uid,
      entityType: "employee",
      entityId: employeeId,
      companyId: admin.companyId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {employeeId, status: "disabled"};
  }),
);

/** Resolves username → email for password sign-in (employees / username accounts). */
export const resolveLoginEmail = onCall((request) =>
  run(async () => {
    const input = objectInput(request.data);
    const raw =
      optionalString(input, "username", 64) ??
      optionalString(input, "login", 64) ??
      optionalString(input, "email", 254) ??
      optionalString(input, "phoneNumber", 24) ??
      optionalString(input, "phone", 24);
    if (!raw) {
      throw new InputError("username", "Login identifier is required.");
    }
    const trimmed = raw.trim();

    // Real email login (invite-registered clients).
    if (trimmed.includes("@")) {
      const email = trimmed.toLowerCase();
      try {
        const user = await auth.getUserByEmail(email);
        const profile = await db.doc(`users/${user.uid}`).get();
        if (profile.exists && profile.get("status") === "disabled") {
          throw new HttpsError("failed-precondition", "Account is disabled.");
        }
        return {email};
      } catch (error: unknown) {
        if (error instanceof HttpsError) throw error;
        const code = (error as {code?: string}).code;
        if (code === "auth/user-not-found") {
          throw new HttpsError("not-found", "Account not found.");
        }
        throw error;
      }
    }

    // Phone login (E.164 or national digits).
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 10) {
      let phoneE164: string | null = null;
      try {
        phoneE164 = normalizedPhone(
          trimmed.startsWith("+") ? trimmed : `+${digits}`,
        );
      } catch {
        phoneE164 = null;
      }
      if (phoneE164) {
        try {
          const user = await auth.getUserByPhoneNumber(phoneE164);
          const email =
            typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
          if (!email || !email.includes("@")) {
            throw new HttpsError(
              "failed-precondition",
              "Account has no login email.",
            );
          }
          const profile = await db.doc(`users/${user.uid}`).get();
          if (profile.exists && profile.get("status") === "disabled") {
            throw new HttpsError("failed-precondition", "Account is disabled.");
          }
          return {email, phoneNumber: phoneE164};
        } catch (error: unknown) {
          if (error instanceof HttpsError) throw error;
          const code = (error as {code?: string}).code;
          if (code !== "auth/user-not-found") throw error;
        }
        const byPhone = await db
          .collection("users")
          .where("phoneNumber", "==", phoneE164)
          .limit(1)
          .get();
        if (!byPhone.empty) {
          const data = byPhone.docs[0].data();
          const email =
            typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
          if (!email || !email.includes("@")) {
            throw new HttpsError(
              "failed-precondition",
              "Account has no login email.",
            );
          }
          if (data.status === "disabled") {
            throw new HttpsError("failed-precondition", "Account is disabled.");
          }
          return {email, phoneNumber: phoneE164};
        }
      }
    }

    const username = normalizedUsername(trimmed.slice(0, 32));
    const snapshot = await db
      .collection("users")
      .where("displayName", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty) {
      throw new HttpsError("not-found", "Account not found.");
    }
    const data = snapshot.docs[0].data();
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      throw new HttpsError("failed-precondition", "Account has no login email.");
    }
    if (data.status === "disabled") {
      throw new HttpsError("failed-precondition", "Account is disabled.");
    }
    return {email};
  }),
);

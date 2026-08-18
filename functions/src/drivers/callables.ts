import {randomBytes} from "node:crypto";
import {
  FieldValue,
  FieldPath,
  Timestamp,
  type Query,
} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {RESET_VALUE} from "firebase-functions/v2/options";
import {
  InputError,
  assertPendingTransition,
  normalizedInviteCode,
  normalizedPhone,
  objectInput,
  optionalString,
  randomInviteCode,
  requiredString,
  stableApplicationId,
} from "../helpers";
import {
  auth,
  db,
  buildSearchTokens,
  decodeCursor,
  encodeCursor,
  normalizeDriverDocFields,
  normalizeIssuedUserDocFields,
  normalizeLower,
  parsePage,
  parsePageSize,
  requireCompanyStaff,
  requireDriverApplicant,
  requirePhoneApplicant,
  requireRole,
  requiredAlias,
  run,
  serializeTimestamp,
  setRoleClaims,
  type Request,
} from "../shared";

const LIST_BACKFILL_BATCH = 400;

/** Backfill sort/search fields on legacy driver docs missing fullNameLower. */
async function backfillDriverListFields(companyId: string): Promise<void> {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  for (;;) {
    let query: Query = db
      .collection("drivers")
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
      if (doc.get("fullNameLower") == null) {
        const data = doc.data();
        batch.update(
          doc.ref,
          normalizeDriverDocFields({
            fullName: String(data.fullName ?? data.displayName ?? ""),
            phoneNumber: String(data.phoneNumber ?? data.phone ?? ""),
            vehicleType: String(data.vehicleType ?? ""),
            plateNumber: String(data.plateNumber ?? ""),
            licenseNumber: String(data.licenseNumber ?? ""),
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

export const createDriverInvite = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const input = objectInput(request.data);
    const note = optionalString(input, "note", 500);
    const rawPhoneNumber = optionalString(input, "phoneNumber", 24) ??
      optionalString(input, "phone", 24);
    const phoneNumber = rawPhoneNumber ? normalizedPhone(rawPhoneNumber) : null;
    const days = input.expiresInDays ?? 7;
    if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > 30) {
      throw new InputError("expiresInDays", "expiresInDays must be an integer from 1 to 30.");
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomInviteCode(randomBytes(8));
      const ref = db.doc(`driverInvites/${code}`);
      try {
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(ref);
          if (existing.exists) throw new HttpsError("already-exists", "Invite collision.");
          tx.create(ref, {
            code,
            companyId: admin.companyId,
            createdBy: admin.uid,
            phoneNumber,
            phone: phoneNumber,
            status: "pending",
            note,
            expiresAt: Timestamp.fromMillis(Date.now() + days * 86_400_000),
            createdAt: FieldValue.serverTimestamp(),
          });
          tx.set(db.doc(`auditLogs/driver_invite_created:${code}`), {
            action: "driver_invite_created",
            actorUid: admin.uid,
            entityType: "driverInvite",
            entityId: code,
            companyId: admin.companyId,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        return {
          inviteId: code,
          inviteCode: code,
          code,
          phoneNumber,
          expiresInDays: days,
        };
      } catch (error) {
        if (!(error instanceof HttpsError) || error.code !== "already-exists") throw error;
      }
    }
    throw new HttpsError("resource-exhausted", "Could not allocate an invite code.");
  }),
);

export const createDriverByPhone = onCall((request) =>
  run(async () => {
    await requireCompanyStaff(request, "drivers:manage");
    throw new HttpsError(
      "permission-denied",
      "Companies must invite drivers via WhatsApp. Direct driver creation is disabled.",
    );
  }),
);

export const acceptDriverInvite = onCall((request) =>
  run(async () => {
    const applicant = await requireDriverApplicant(request);
    const input = objectInput(request.data);
    const inviteCode = normalizedInviteCode(requiredString(input, "inviteCode", 8));
    const displayName = requiredAlias(input, ["fullName", "displayName"], 120);
    const vehicleType = optionalString(input, "vehicleType", 30) ?? "car";
    const plateNumber = optionalString(input, "plateNumber", 60) ?? "";
    const licenseNumber = optionalString(input, "licenseNumber", 80) ?? "";
    const inviteRef = db.doc(`driverInvites/${inviteCode}`);
    const driverRef = db.doc(`drivers/${applicant.uid}`);
    const userRef = db.doc(`users/${applicant.uid}`);
    let companyId = "";

    await db.runTransaction(async (tx) => {
      const [invite, existingDriver, existingUser] = await Promise.all([
        tx.get(inviteRef),
        tx.get(driverRef),
        tx.get(userRef),
      ]);
      if (!invite.exists) throw new HttpsError("not-found", "Invite not found.");
      companyId = invite.get("companyId") as string;
      const invitedPhoneNumber = invite.get("phoneNumber") as string | null;
      if (invitedPhoneNumber && invitedPhoneNumber !== applicant.phoneNumber) {
        throw new HttpsError(
          "permission-denied",
          "This invitation belongs to another phone number.",
        );
      }
      if (
        existingDriver.exists &&
        existingDriver.get("companyId") &&
        existingDriver.get("companyId") !== companyId
      ) {
        throw new HttpsError("failed-precondition", "Driver belongs to another company.");
      }
      if (
        existingUser.exists &&
        existingUser.get("companyId") &&
        existingUser.get("companyId") !== companyId
      ) {
        throw new HttpsError("failed-precondition", "Driver belongs to another company.");
      }
      if (
        existingUser.exists &&
        existingUser.get("role") === "driver" &&
        existingUser.get("status") === "active" &&
        existingUser.get("companyId") === companyId
      ) {
        // Already joined — still ensure the drivers/{uid} profile exists for company lists.
        if (!existingDriver.exists) {
          const normalizedFields = normalizeDriverDocFields({
            fullName: displayName,
            phoneNumber: applicant.phoneNumber,
            vehicleType,
            plateNumber,
            licenseNumber,
          });
          tx.set(driverRef, {
            uid: applicant.uid,
            companyId,
            phoneNumber: applicant.phoneNumber,
            phone: applicant.phoneNumber,
            displayName,
            fullName: displayName,
            userId: applicant.uid,
            vehicleType,
            plateNumber,
            licenseNumber,
            status: "active",
            activeOrders: 0,
            rating: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            successRate: 0,
            badges: [],
            experienceStartedAt: FieldValue.serverTimestamp(),
            source: "invite",
            inviteCode,
            ...normalizedFields,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        return;
      }
      if (
        !["open", "pending"].includes(invite.get("status") as string) ||
        (invite.get("claimedBy") && invite.get("claimedBy") !== applicant.uid)
      ) {
        throw new HttpsError("failed-precondition", "Invite is not available.");
      }
      const expiresAt = invite.get("expiresAt") as Timestamp;
      if (!expiresAt || expiresAt.toMillis() <= Date.now()) {
        throw new HttpsError("failed-precondition", "Invite has expired.");
      }

      const normalizedDriverFields = normalizeDriverDocFields({
        fullName: displayName,
        phoneNumber: applicant.phoneNumber,
        vehicleType,
        plateNumber,
        licenseNumber,
      });
      tx.set(
        driverRef,
        {
          uid: applicant.uid,
          companyId,
          phoneNumber: applicant.phoneNumber,
          phone: applicant.phoneNumber,
          displayName,
          fullName: displayName,
          userId: applicant.uid,
          vehicleType,
          plateNumber,
          licenseNumber,
          status: "active",
          activeOrders: 0,
          rating: 0,
          completedOrders: existingDriver.get("completedOrders") ?? 0,
          cancelledOrders: existingDriver.get("cancelledOrders") ?? 0,
          successRate: existingDriver.get("successRate") ?? 0,
          badges: existingDriver.get("badges") ?? [],
          experienceStartedAt:
            existingDriver.get("experienceStartedAt") ??
            FieldValue.serverTimestamp(),
          source: "invite",
          inviteCode,
          ...normalizedDriverFields,
          createdAt: existingDriver.get("createdAt") ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      const normalizedUserFields = normalizeIssuedUserDocFields({
        username: displayName,
        fullName: displayName,
        email:
          typeof existingUser.get("email") === "string" ? existingUser.get("email") : null,
      });
      tx.set(
        userRef,
        {
          uid: applicant.uid,
          role: "driver",
          companyId,
          status: "active",
          phoneNumber: applicant.phoneNumber,
          displayName,
          lastLoginAt: null,
          fullName: displayName,
          ...normalizedUserFields,
          createdAt: existingUser.get("createdAt") ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.update(inviteRef, {
        status: "accepted",
        claimedBy: applicant.uid,
        usedBy: applicant.uid,
        usedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.doc(`auditLogs/driver_invite_accepted:${inviteCode}:${applicant.uid}`), {
        action: "driver_invite_accepted",
        actorUid: applicant.uid,
        entityType: "driverInvite",
        entityId: inviteCode,
        companyId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await setRoleClaims(applicant.uid, "driver", companyId);
    await ensureDriverProfile(applicant.uid);
    return {driverId: applicant.uid, companyId, status: "active"};
  }),
);

/** @deprecated Prefer acceptDriverInvite — kept for legacy pending applications. */
export const submitDriverApplication = onCall((request) =>
  run(async () => {
    const applicant = requirePhoneApplicant(request);
    const input = objectInput(request.data);
    const inviteCode = normalizedInviteCode(requiredString(input, "inviteCode", 8));
    const displayName = requiredAlias(input, ["fullName", "displayName"], 120);
    const vehicleType = optionalString(input, "vehicleType", 30) ?? "car";
    const plateNumber = optionalString(input, "plateNumber", 60) ?? "";
    const licenseNumber = optionalString(input, "licenseNumber", 80) ?? "";
    const applicationId = stableApplicationId("driver", applicant.uid);
    const inviteRef = db.doc(`driverInvites/${inviteCode}`);
    const applicationRef = db.doc(`driverApplications/${applicationId}`);

    const result = await db.runTransaction(async (tx) => {
      const [invite, existing] = await Promise.all([
        tx.get(inviteRef),
        tx.get(applicationRef),
      ]);
      if (!invite.exists) throw new HttpsError("not-found", "Invite not found.");
      const invitedPhoneNumber = invite.get("phoneNumber") as string | null;
      if (
        invitedPhoneNumber &&
        invitedPhoneNumber !== applicant.phoneNumber
      ) {
        throw new HttpsError(
          "permission-denied",
          "This invitation belongs to another phone number.",
        );
      }
      if (existing.exists) {
        if (existing.get("inviteCode") !== inviteCode) {
          throw new HttpsError("already-exists", "A driver application already exists.");
        }
        if (existing.get("status") === "rejected") {
          if (
            !["open", "pending"].includes(invite.get("status") as string) ||
            (invite.get("claimedBy") && invite.get("claimedBy") !== applicant.uid)
          ) {
            throw new HttpsError("failed-precondition", "Invite is not available.");
          }
          const existingExpiresAt = invite.get("expiresAt") as Timestamp;
          if (!existingExpiresAt || existingExpiresAt.toMillis() <= Date.now()) {
            throw new HttpsError("failed-precondition", "Invite has expired.");
          }
          tx.update(applicationRef, {
            phoneNumber: applicant.phoneNumber,
            phone: applicant.phoneNumber,
            displayName,
            fullName: displayName,
            vehicleType,
            plateNumber,
            licenseNumber,
            status: "pending",
            rejectionReason: null,
            reviewNote: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
          tx.update(inviteRef, {claimedBy: applicant.uid});
          return {applicationId, companyId: existing.get("companyId"), status: "pending"};
        }
        return {applicationId, status: existing.get("status") as string};
      }
      if (
        !["open", "pending"].includes(invite.get("status") as string) ||
        (invite.get("claimedBy") && invite.get("claimedBy") !== applicant.uid)
      ) {
        throw new HttpsError("failed-precondition", "Invite is not available.");
      }
      const expiresAt = invite.get("expiresAt") as Timestamp;
      if (!expiresAt || expiresAt.toMillis() <= Date.now()) {
        throw new HttpsError("failed-precondition", "Invite has expired.");
      }
      const companyId = invite.get("companyId") as string;
      tx.create(applicationRef, {
        applicantUid: applicant.uid,
        userId: applicant.uid,
        companyId,
        inviteCode,
        phoneNumber: applicant.phoneNumber,
        phone: applicant.phoneNumber,
        displayName,
        fullName: displayName,
        vehicleType,
        plateNumber,
        licenseNumber,
        status: "pending",
        rejectionReason: null,
        reviewNote: null,
        driverId: null,
        createdAt: FieldValue.serverTimestamp(),
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(inviteRef, {claimedBy: applicant.uid});
      return {applicationId, companyId, status: "pending"};
    });
    return result;
  }),
);

async function reviewDriverApplication(
  request: Request,
  target: "approved" | "rejected",
): Promise<Record<string, string>> {
  const admin = await requireCompanyStaff(request, "drivers:manage");
  const input = objectInput(request.data);
  const applicationId = requiredString(input, "applicationId", 180);
  const reason =
    target === "rejected" ? requiredString(input, "reason", 500) : null;
  const applicationRef = db.doc(`driverApplications/${applicationId}`);
  let applicantUid = "";

  await db.runTransaction(async (tx) => {
    const application = await tx.get(applicationRef);
    if (!application.exists) throw new HttpsError("not-found", "Application not found.");
    if (application.get("companyId") !== admin.companyId) {
      throw new HttpsError("permission-denied", "Application belongs to another company.");
    }
    applicantUid = application.get("applicantUid") as string;
    assertPendingTransition(application.get("status"), target);
    const reviewData: Record<string, unknown> = {
      status: target,
      reviewedBy: admin.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (reason) reviewData.rejectionReason = reason;
    if (reason) reviewData.reviewNote = reason;
    if (target === "approved") reviewData.driverId = applicantUid;
    tx.update(applicationRef, reviewData);

    const inviteRef = db.doc(`driverInvites/${application.get("inviteCode") as string}`);
    if (target === "approved") {
      const fullName = String(application.get("displayName") ?? "");
      const phoneNumber = String(application.get("phoneNumber") ?? "");
      const vehicleType = String(application.get("vehicleType") ?? "car");
      const plateNumber = String(application.get("plateNumber") ?? "");
      const licenseNumber = String(application.get("licenseNumber") ?? "");
      const normalizedDriverFields = normalizeDriverDocFields({
        fullName,
        phoneNumber,
        vehicleType,
        plateNumber,
        licenseNumber,
      });
      tx.set(
        db.doc(`drivers/${applicantUid}`),
        {
          uid: applicantUid,
          companyId: admin.companyId,
          phoneNumber,
          phone: phoneNumber,
          displayName: fullName,
          fullName,
          userId: applicantUid,
          vehicleType,
          plateNumber,
          licenseNumber,
          status: "active",
          activeOrders: 0,
          rating: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          successRate: 0,
          badges: [],
          experienceStartedAt: FieldValue.serverTimestamp(),
          source: "application",
          applicationId,
          ...normalizedDriverFields,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      const normalizedUserFields = normalizeIssuedUserDocFields({
        username: fullName,
        fullName,
        email: null,
      });
      tx.set(
        db.doc(`users/${applicantUid}`),
        {
          uid: applicantUid,
          role: "driver",
          companyId: admin.companyId,
          status: "active",
          phoneNumber,
          displayName: fullName,
          fullName,
          email: null,
          lastLoginAt: null,
          ...normalizedUserFields,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.update(inviteRef, {
        status: "accepted",
        usedBy: applicantUid,
        usedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(inviteRef, {claimedBy: FieldValue.delete()});
    }
    tx.set(db.doc(`auditLogs/driver_application_${target}:${applicationId}`), {
      action: `driver_application_${target}`,
      actorUid: admin.uid,
      entityType: "driverApplication",
      entityId: applicationId,
      companyId: admin.companyId,
      metadata: reason ? {reason} : {},
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  if (target === "approved") {
    await setRoleClaims(applicantUid, "driver", admin.companyId);
  }
  return {applicationId, status: target, companyId: admin.companyId};
}

export const approveDriverApplication = onCall((request) =>
  run(() => reviewDriverApplication(request, "approved")),
);

export const rejectDriverApplication = onCall((request) =>
  run(() => reviewDriverApplication(request, "rejected")),
);

const DEFAULT_DRIVER_PROFILE = {
  rating: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  successRate: 0,
  badges: [] as string[],
};

async function ensureDriverProfile(uid: string): Promise<void> {
  const ref = db.doc(`driverProfiles/${uid}`);
  const snap = await ref.get();
  if (snap.exists) {
    return;
  }
  await ref.set({
    uid,
    ...DEFAULT_DRIVER_PROFILE,
    experienceStartedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function mapDriverProfile(data: Record<string, unknown> | undefined) {
  if (!data) {
    return {
      ...DEFAULT_DRIVER_PROFILE,
      experienceStartedAt: null as string | null,
    };
  }
  const experienceStartedAt = data.experienceStartedAt;
  return {
    rating: typeof data.rating === "number" ? data.rating : 0,
    completedOrders:
      typeof data.completedOrders === "number" ? data.completedOrders : 0,
    cancelledOrders:
      typeof data.cancelledOrders === "number" ? data.cancelledOrders : 0,
    successRate: typeof data.successRate === "number" ? data.successRate : 0,
    badges: Array.isArray(data.badges)
      ? data.badges.filter((b): b is string => typeof b === "string")
      : [],
    experienceStartedAt:
      experienceStartedAt instanceof Timestamp
        ? experienceStartedAt.toDate().toISOString()
        : null,
  };
}

function driverEmail(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `${digits}@drivers.wasel.app`;
}

/** Self-register a driver account (phone + password). No company binding yet. */
export const registerDriverAccount = onCall((request) =>
  run(async () => {
    const input = objectInput(request.data);
    const phoneNumber = normalizedPhone(
      requiredAlias(input, ["phoneNumber", "phone"], 24),
    );
    const password = requiredString(input, "password", 128);
    if (password.length < 8) {
      throw new InputError("password", "Password must be at least 8 characters.");
    }
    const displayName =
      optionalString(input, "displayName", 120) ??
      optionalString(input, "fullName", 120) ??
      phoneNumber;
    const email = driverEmail(phoneNumber);

    try {
      await auth.getUserByPhoneNumber(phoneNumber);
      throw new HttpsError("already-exists", "Phone number is already registered.");
    } catch (error: unknown) {
      const code = (error as {code?: string}).code;
      if (code !== "auth/user-not-found") {
        if (error instanceof HttpsError) throw error;
        throw error;
      }
    }

    let user;
    try {
      user = await auth.createUser({
        email,
        password,
        phoneNumber,
        displayName,
        emailVerified: true,
      });
    } catch (error: unknown) {
      const code = (error as {code?: string}).code;
      if (code === "auth/email-already-exists" || code === "auth/phone-number-already-exists") {
        throw new HttpsError("already-exists", "Driver account already exists.");
      }
      throw error;
    }

    const uid = user.uid;
    await db.doc(`users/${uid}`).set({
      uid,
      role: null,
      companyId: null,
      status: "pending_profile",
      displayName,
      phoneNumber,
      email,
      lastLoginAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.doc(`auditLogs/driver_account_registered:${uid}`).set({
      action: "driver_account_registered",
      actorUid: uid,
      entityType: "user",
      entityId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {uid, email, phoneNumber};
  }),
);

/** Resolves phone → synthetic email for driver password sign-in. */
export const resolveDriverLoginEmail = onCall((request) =>
  run(async () => {
    const input = objectInput(request.data);
    const phoneNumber = normalizedPhone(
      requiredAlias(input, ["phoneNumber", "phone"], 24),
    );
    const email = driverEmail(phoneNumber);
    try {
      const user = await auth.getUserByPhoneNumber(phoneNumber);
      const resolved =
        typeof user.email === "string" && user.email.includes("@")
          ? user.email
          : email;
      return {email: resolved.toLowerCase(), phoneNumber};
    } catch (error: unknown) {
      const code = (error as {code?: string}).code;
      if (code === "auth/user-not-found") {
        // Fall back to synthetic email lookup via Auth email
        try {
          await auth.getUserByEmail(email);
          return {email: email.toLowerCase(), phoneNumber};
        } catch {
          throw new HttpsError("not-found", "Account not found.");
        }
      }
      throw error;
    }
  }),
);

/** Company staff: list drivers for the signed-in company (Admin SDK). */
export const listCompanyDrivers = onCall({
  minInstances: RESET_VALUE,
  maxInstances: 10,
}, (request) =>
  run(async () => {
    // drivers:manage for fleet UI; orders:write so staff can assign without manage.
    const admin = await requireCompanyStaff(request, [
      "drivers:manage",
      "orders:write",
    ]);
    const input = objectInput(request.data ?? {});
    const q = normalizeLower(optionalString(input, "q", 120));
    const statusFilter = optionalString(input, "status", 32);
    const page = parsePage(input);
    const pageSize = parsePageSize(input, 20, 50);
    const cursor = decodeCursor(input.cursor, "cursor");

    let query: Query = db
      .collection("drivers")
      .where("companyId", "==", admin.companyId);
    if (statusFilter && statusFilter !== "all") {
      query = query.where("status", "==", statusFilter);
    }
    if (q) {
      query = query.where("searchTokens", "array-contains", q);
    }

    const totalSnapshot = await query.count().get();
    const orderedBase = query
      .orderBy("fullNameLower", "asc")
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
            drivers: [],
            total: totalSnapshot.data().count,
            pageSize,
            page,
            hasMore: false,
            nextCursor: null,
          };
        }
        activeCursor = {
          value: String(lastStepDoc.get("fullNameLower") ?? ""),
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
      await backfillDriverListFields(admin.companyId);
      snapshot = await ordered.limit(pageSize + 1).get();
    }
    const docs = snapshot.docs.filter((docSnap) => docSnap.get("status") !== "removed");
    const pageDocs = docs.slice(0, pageSize);
    const drivers = pageDocs.map((docSnap) =>
      mapCompanyDriver(admin.companyId, docSnap),
    );
    const lastDoc = pageDocs[pageDocs.length - 1];
    const nextCursor =
      docs.length > pageSize && lastDoc
        ? encodeCursor(String(lastDoc.get("fullNameLower") ?? ""), lastDoc.id)
        : null;
    return {
      drivers,
      total: totalCount,
      pageSize,
      page,
      hasMore: Boolean(nextCursor),
      nextCursor,
    };
  }),
);

/** Company staff: list driver invites for the signed-in company (Admin SDK). */
export const listCompanyDriverInvites = onCall({
  minInstances: RESET_VALUE,
  maxInstances: 10,
}, (request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const snapshot = await db
      .collection("driverInvites")
      .where("companyId", "==", admin.companyId)
      .orderBy("createdAt", "desc")
      .get();
    const invites = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        companyId: admin.companyId,
        code: (data.code as string) ?? docSnap.id,
        phone:
          (data.phone as string) ??
          (data.phoneNumber as string) ??
          null,
        phoneNumber:
          (data.phoneNumber as string) ??
          (data.phone as string) ??
          null,
        status: (data.status as string) ?? "pending",
        createdAt: data.createdAt ?? null,
      };
    });
    return {invites};
  }),
);

/** Revoke a pending driver invite so the code can no longer be used. */
export const revokeDriverInvite = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const input = objectInput(request.data);
    const rawCode = requiredAlias(
      input,
      ["inviteCode", "code", "inviteId"],
      32,
    );
    const inviteCode = normalizedInviteCode(
      rawCode.replace(/[^A-Za-z0-9]/g, ""),
    );
    const inviteRef = db.doc(`driverInvites/${inviteCode}`);
    const snap = await inviteRef.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Invite not found.");
    }
    if (snap.get("companyId") !== admin.companyId) {
      throw new HttpsError(
        "permission-denied",
        "Invite does not belong to this company.",
      );
    }
    const status = snap.get("status");
    if (status === "revoked") {
      return {inviteId: inviteCode, status: "revoked"};
    }
    if (status !== "pending" && status !== "open") {
      throw new HttpsError(
        "failed-precondition",
        `Invite cannot be removed (status: ${String(status)}).`,
      );
    }
    await inviteRef.set(
      {
        status: "revoked",
        revokedBy: admin.uid,
        revokedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    await db.doc(`auditLogs/driver_invite_revoked:${inviteCode}`).set({
      action: "driver_invite_revoked",
      actorUid: admin.uid,
      entityType: "driverInvite",
      entityId: inviteCode,
      companyId: admin.companyId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {inviteId: inviteCode, status: "revoked"};
  }),
);

/** Remove a driver from the company fleet (unbinds claims; keeps Auth account). */
export const removeCompanyDriver = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const input = objectInput(request.data);
    const driverId = requiredAlias(input, ["driverId", "uid"], 128);
    const driverRef = db.doc(`drivers/${driverId}`);
    const userRef = db.doc(`users/${driverId}`);
    const driverSnap = await driverRef.get();
    if (!driverSnap.exists || driverSnap.get("companyId") !== admin.companyId) {
      throw new HttpsError("not-found", "Driver not found in this company.");
    }

    await db.runTransaction(async (tx) => {
      tx.set(
        driverRef,
        {
          status: "removed",
          companyId: null,
          removedBy: admin.uid,
          removedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.set(
        userRef,
        {
          role: null,
          companyId: null,
          status: "pending_profile",
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.set(db.doc(`auditLogs/driver_removed:${driverId}:${Date.now()}`), {
        action: "driver_removed",
        actorUid: admin.uid,
        entityType: "driver",
        entityId: driverId,
        companyId: admin.companyId,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    const authUser = await auth.getUser(driverId);
    const existing = {...(authUser.customClaims ?? {})};
    delete existing.role;
    delete existing.companyId;
    await auth.setCustomUserClaims(driverId, existing);
    return {driverId, status: "removed"};
  }),
);

const DRIVER_STATUSES = new Set([
  "active",
  "offline",
  "busy",
  "suspended",
]);
const VEHICLE_TYPES = new Set(["motorcycle", "car", "van"]);

function mapCompanyDriver(
  companyId: string,
  docSnap: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: () => any;
  },
  profileData?: Record<string, unknown>,
) {
  const data = docSnap.data() ?? {};
  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  const profile = mapDriverProfile(profileData);
  const mergedProfile = {
    rating:
      typeof data.rating === "number" ? (data.rating as number) : profile.rating,
    completedOrders:
      typeof data.completedOrders === "number" ?
        (data.completedOrders as number) :
        profile.completedOrders,
    cancelledOrders:
      typeof data.cancelledOrders === "number" ?
        (data.cancelledOrders as number) :
        profile.cancelledOrders,
    successRate:
      typeof data.successRate === "number" ?
        (data.successRate as number) :
        profile.successRate,
    badges: Array.isArray(data.badges) ?
      data.badges.filter((badge: unknown): badge is string => typeof badge === "string") :
      profile.badges,
    experienceStartedAt:
      typeof data.experienceStartedAt === "string" ||
          data.experienceStartedAt instanceof Timestamp ?
        serializeTimestamp(data.experienceStartedAt) :
        profile.experienceStartedAt,
  };
  return {
    id: docSnap.id,
    companyId,
    fullName:
      (data.fullName as string) ??
      (data.displayName as string) ??
      "",
    phone:
      (data.phone as string) ??
      (data.phoneNumber as string) ??
      "",
    phoneNumber:
      (data.phoneNumber as string) ??
      (data.phone as string) ??
      "",
    status: (data.status as string) ?? "active",
    vehicleType: (data.vehicleType as string) ?? "car",
    plateNumber: (data.plateNumber as string) ?? "",
    licenseNumber: (data.licenseNumber as string) ?? "",
    vehicleModel:
      typeof data.vehicleModel === "string" ? data.vehicleModel : "",
    vehicleColor:
      typeof data.vehicleColor === "string" ? data.vehicleColor : "",
    modelYear:
      typeof data.modelYear === "number" && Number.isFinite(data.modelYear) ?
        data.modelYear :
        null,
    insuranceValidUntil:
      typeof data.insuranceValidUntil === "string" ?
        data.insuranceValidUntil :
        null,
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    licenseImageUrl:
      typeof data.licenseImageUrl === "string" ? data.licenseImageUrl : null,
    registrationImageUrl:
      typeof data.registrationImageUrl === "string" ?
        data.registrationImageUrl :
        null,
    insuranceImageUrl:
      typeof data.insuranceImageUrl === "string" ? data.insuranceImageUrl : null,
    activeOrders:
      typeof data.activeOrders === "number" ? data.activeOrders : 0,
    rating: mergedProfile.rating,
    completedOrders: mergedProfile.completedOrders,
    cancelledOrders: mergedProfile.cancelledOrders,
    successRate: mergedProfile.successRate,
    badges: mergedProfile.badges,
    experienceStartedAt: mergedProfile.experienceStartedAt,
    createdAt:
      createdAt instanceof Timestamp
        ? createdAt.toDate().toISOString()
        : null,
    updatedAt:
      updatedAt instanceof Timestamp
        ? updatedAt.toDate().toISOString()
        : null,
  };
}

/** Company staff: fetch one driver in the signed-in company. */
export const getCompanyDriver = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const input = objectInput(request.data);
    const driverId = requiredAlias(input, ["driverId", "uid"], 128);
    const driverSnap = await db.doc(`drivers/${driverId}`).get();
    if (!driverSnap.exists || driverSnap.get("companyId") !== admin.companyId) {
      throw new HttpsError("not-found", "Driver not found in this company.");
    }
    if (driverSnap.get("status") === "removed") {
      throw new HttpsError("not-found", "Driver not found in this company.");
    }
    const profileSnap = await db.doc(`driverProfiles/${driverId}`).get();
    return {
      driver: mapCompanyDriver(
        admin.companyId,
        driverSnap,
        profileSnap.exists
          ? (profileSnap.data() as Record<string, unknown>)
          : undefined,
      ),
    };
  }),
);

/** Company staff: update driver profile fields (not login phone). */
export const updateCompanyDriver = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "drivers:manage");
    const input = objectInput(request.data);
    const driverId = requiredAlias(input, ["driverId", "uid"], 128);
    const driverRef = db.doc(`drivers/${driverId}`);
    const userRef = db.doc(`users/${driverId}`);
    const driverSnap = await driverRef.get();
    if (!driverSnap.exists || driverSnap.get("companyId") !== admin.companyId) {
      throw new HttpsError("not-found", "Driver not found in this company.");
    }
    if (driverSnap.get("status") === "removed") {
      throw new HttpsError("failed-precondition", "Driver has been removed.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    const fullName =
      optionalString(input, "fullName", 120) ??
      optionalString(input, "displayName", 120);
    if (fullName !== undefined) {
      patch.fullName = fullName;
      patch.displayName = fullName;
    }
    if (input.vehicleType !== undefined) {
      const vehicleType = requiredString(input, "vehicleType", 40);
      if (!VEHICLE_TYPES.has(vehicleType)) {
        throw new InputError("vehicleType", "Invalid vehicle type.");
      }
      patch.vehicleType = vehicleType;
    }
    if (input.plateNumber !== undefined) {
      patch.plateNumber = requiredString(input, "plateNumber", 40);
    }
    if (input.licenseNumber !== undefined) {
      patch.licenseNumber = requiredString(input, "licenseNumber", 80);
    }
    if (input.vehicleModel !== undefined) {
      patch.vehicleModel = optionalString(input, "vehicleModel", 80) ?? "";
    }
    if (input.vehicleColor !== undefined) {
      patch.vehicleColor = optionalString(input, "vehicleColor", 40) ?? "";
    }
    if (input.modelYear !== undefined) {
      if (input.modelYear === null) {
        patch.modelYear = null;
      } else {
        const year = Number(input.modelYear);
        if (!Number.isFinite(year) || year < 1980 || year > 2100) {
          throw new InputError("modelYear", "Invalid model year.");
        }
        patch.modelYear = Math.round(year);
      }
    }
    if (input.insuranceValidUntil !== undefined) {
      if (input.insuranceValidUntil === null || input.insuranceValidUntil === "") {
        patch.insuranceValidUntil = null;
      } else {
        const raw = requiredString(input, "insuranceValidUntil", 32);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          throw new InputError(
            "insuranceValidUntil",
            "Use YYYY-MM-DD for insurance expiry.",
          );
        }
        patch.insuranceValidUntil = raw;
      }
    }
    if (input.status !== undefined) {
      const status = requiredString(input, "status", 40);
      if (!DRIVER_STATUSES.has(status)) {
        throw new InputError("status", "Invalid driver status.");
      }
      patch.status = status;
    }
    const imageUrlFields = [
      "photoUrl",
      "licenseImageUrl",
      "registrationImageUrl",
      "insuranceImageUrl",
    ] as const;
    for (const field of imageUrlFields) {
      if (input[field] === undefined) {
        continue;
      }
      if (input[field] === null || input[field] === "") {
        patch[field] = null;
        continue;
      }
      const url = requiredString(input, field, 2048);
      if (!/^https:\/\//i.test(url)) {
        throw new InputError(field, `${field} must be an https URL.`);
      }
      patch[field] = url;
    }
    const nextFullName =
      typeof patch.fullName === "string" ?
        patch.fullName :
        ((driverSnap.get("fullName") as string | undefined) ??
          (driverSnap.get("displayName") as string | undefined) ??
          "");
    const nextPhoneNumber =
      ((driverSnap.get("phoneNumber") as string | undefined) ??
        (driverSnap.get("phone") as string | undefined) ??
        "");
    const nextVehicleType =
      typeof patch.vehicleType === "string" ?
        patch.vehicleType :
        ((driverSnap.get("vehicleType") as string | undefined) ?? "car");
    const nextPlateNumber =
      typeof patch.plateNumber === "string" ?
        patch.plateNumber :
        ((driverSnap.get("plateNumber") as string | undefined) ?? "");
    const nextLicenseNumber =
      typeof patch.licenseNumber === "string" ?
        patch.licenseNumber :
        ((driverSnap.get("licenseNumber") as string | undefined) ?? "");
    const nextVehicleModel =
      typeof patch.vehicleModel === "string" ?
        patch.vehicleModel :
        ((driverSnap.get("vehicleModel") as string | undefined) ?? "");
    Object.assign(
      patch,
      normalizeDriverDocFields({
        fullName: nextFullName,
        phoneNumber: nextPhoneNumber,
        vehicleType: nextVehicleType,
        plateNumber: nextPlateNumber,
        licenseNumber: nextLicenseNumber,
        vehicleModel: nextVehicleModel,
      }),
    );

    await db.runTransaction(async (tx) => {
      tx.set(driverRef, patch, {merge: true});
      if (fullName !== undefined) {
        tx.set(
          userRef,
          {
            fullName,
            displayName: fullName,
            displayNameLower: normalizeLower(fullName),
            searchTokens: buildSearchTokens([
              fullName,
              nextPhoneNumber,
              nextPlateNumber,
              nextLicenseNumber,
              nextVehicleType,
            ]),
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }
      tx.set(db.doc(`auditLogs/driver_updated:${driverId}:${Date.now()}`), {
        action: "driver_updated",
        actorUid: admin.uid,
        entityType: "driver",
        entityId: driverId,
        companyId: admin.companyId,
        patch: {
          fullName: patch.fullName ?? null,
          vehicleType: patch.vehicleType ?? null,
          plateNumber: patch.plateNumber ?? null,
          licenseNumber: patch.licenseNumber ?? null,
          vehicleModel: patch.vehicleModel ?? null,
          vehicleColor: patch.vehicleColor ?? null,
          modelYear: patch.modelYear ?? null,
          insuranceValidUntil: patch.insuranceValidUntil ?? null,
          status: patch.status ?? null,
          photoUrl: patch.photoUrl ?? null,
          licenseImageUrl: patch.licenseImageUrl ?? null,
          registrationImageUrl: patch.registrationImageUrl ?? null,
          insuranceImageUrl: patch.insuranceImageUrl ?? null,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    const updated = await driverRef.get();
    const profileSnap = await db.doc(`driverProfiles/${driverId}`).get();
    return {
      driverId,
      status: "updated",
      driver: mapCompanyDriver(
        admin.companyId,
        updated,
        profileSnap.exists
          ? (profileSnap.data() as Record<string, unknown>)
          : undefined,
      ),
    };
  }),
);

/** Authenticated driver: update own vehicle fields only. */
export const updateMyVehicle = onCall((request) =>
  run(async () => {
    const uid = requireRole(request, "driver");
    const input = objectInput(request.data);
    const driverRef = db.doc(`drivers/${uid}`);
    const driverSnap = await driverRef.get();
    if (!driverSnap.exists) {
      throw new HttpsError("not-found", "Driver profile not found.");
    }
    if (driverSnap.get("status") === "removed") {
      throw new HttpsError("failed-precondition", "Driver has been removed.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.vehicleType !== undefined) {
      const vehicleType = requiredString(input, "vehicleType", 40);
      if (!VEHICLE_TYPES.has(vehicleType)) {
        throw new InputError("vehicleType", "Invalid vehicle type.");
      }
      patch.vehicleType = vehicleType;
    }
    if (input.plateNumber !== undefined) {
      patch.plateNumber = requiredString(input, "plateNumber", 40);
    }
    if (input.licenseNumber !== undefined) {
      patch.licenseNumber = requiredString(input, "licenseNumber", 80);
    }
    if (input.vehicleModel !== undefined) {
      patch.vehicleModel = optionalString(input, "vehicleModel", 80) ?? "";
    }
    if (input.vehicleColor !== undefined) {
      patch.vehicleColor = optionalString(input, "vehicleColor", 40) ?? "";
    }
    if (input.modelYear !== undefined) {
      if (input.modelYear === null) {
        patch.modelYear = null;
      } else {
        const year = Number(input.modelYear);
        if (!Number.isFinite(year) || year < 1980 || year > 2100) {
          throw new InputError("modelYear", "Invalid model year.");
        }
        patch.modelYear = Math.round(year);
      }
    }
    if (input.insuranceValidUntil !== undefined) {
      if (input.insuranceValidUntil === null || input.insuranceValidUntil === "") {
        patch.insuranceValidUntil = null;
      } else {
        const raw = requiredString(input, "insuranceValidUntil", 32);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          throw new InputError(
            "insuranceValidUntil",
            "Use YYYY-MM-DD for insurance expiry.",
          );
        }
        patch.insuranceValidUntil = raw;
      }
    }
    const imageUrlFields = [
      "photoUrl",
      "licenseImageUrl",
      "registrationImageUrl",
      "insuranceImageUrl",
    ] as const;
    for (const field of imageUrlFields) {
      if (input[field] === undefined) {
        continue;
      }
      if (input[field] === null || input[field] === "") {
        patch[field] = null;
        continue;
      }
      const url = requiredString(input, field, 2048);
      if (!/^https:\/\//i.test(url)) {
        throw new InputError(field, `${field} must be an https URL.`);
      }
      patch[field] = url;
    }

    const nextFullName =
      (driverSnap.get("fullName") as string | undefined) ??
      (driverSnap.get("displayName") as string | undefined) ??
      "";
    const nextPhoneNumber =
      (driverSnap.get("phoneNumber") as string | undefined) ??
      (driverSnap.get("phone") as string | undefined) ??
      "";
    const nextVehicleType =
      typeof patch.vehicleType === "string" ?
        patch.vehicleType :
        ((driverSnap.get("vehicleType") as string | undefined) ?? "car");
    const nextPlateNumber =
      typeof patch.plateNumber === "string" ?
        patch.plateNumber :
        ((driverSnap.get("plateNumber") as string | undefined) ?? "");
    const nextLicenseNumber =
      typeof patch.licenseNumber === "string" ?
        patch.licenseNumber :
        ((driverSnap.get("licenseNumber") as string | undefined) ?? "");
    const nextVehicleModel =
      typeof patch.vehicleModel === "string" ?
        patch.vehicleModel :
        ((driverSnap.get("vehicleModel") as string | undefined) ?? "");
    Object.assign(
      patch,
      normalizeDriverDocFields({
        fullName: nextFullName,
        phoneNumber: nextPhoneNumber,
        vehicleType: nextVehicleType,
        plateNumber: nextPlateNumber,
        licenseNumber: nextLicenseNumber,
        vehicleModel: nextVehicleModel,
      }),
    );

    await driverRef.set(patch, {merge: true});
    const companyId = String(driverSnap.get("companyId") ?? "");
    await db.doc(`auditLogs/my_vehicle_updated:${uid}:${Date.now()}`).set({
      action: "my_vehicle_updated",
      actorUid: uid,
      entityType: "driver",
      entityId: uid,
      companyId,
      patch: {
        vehicleType: patch.vehicleType ?? null,
        plateNumber: patch.plateNumber ?? null,
        licenseNumber: patch.licenseNumber ?? null,
        vehicleModel: patch.vehicleModel ?? null,
        vehicleColor: patch.vehicleColor ?? null,
        modelYear: patch.modelYear ?? null,
        insuranceValidUntil: patch.insuranceValidUntil ?? null,
        photoUrl: patch.photoUrl ?? null,
        licenseImageUrl: patch.licenseImageUrl ?? null,
        registrationImageUrl: patch.registrationImageUrl ?? null,
        insuranceImageUrl: patch.insuranceImageUrl ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    const updated = await driverRef.get();
    const profileSnap = await db.doc(`driverProfiles/${uid}`).get();
    return {
      driverId: uid,
      status: "updated",
      driver: mapCompanyDriver(
        companyId,
        updated,
        profileSnap.exists
          ? (profileSnap.data() as Record<string, unknown>)
          : undefined,
      ),
    };
  }),
);

/**
 * Record a delivered/cancelled order against the driver's global profile.
 * Company staff with orders:write (or drivers:manage) may call this.
 */
export const recordDriverOrderOutcome = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "orders:write");
    const input = objectInput(request.data);
    const driverId = requiredAlias(input, ["driverId", "uid"], 128);
    const outcome = requiredString(input, "outcome", 20);
    if (outcome !== "delivered" && outcome !== "cancelled") {
      throw new InputError("outcome", "outcome must be delivered or cancelled.");
    }

    const driverSnap = await db.doc(`drivers/${driverId}`).get();
    if (!driverSnap.exists || driverSnap.get("companyId") !== admin.companyId) {
      throw new HttpsError("not-found", "Driver not found in this company.");
    }

    await ensureDriverProfile(driverId);
    const profileRef = db.doc(`driverProfiles/${driverId}`);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(profileRef);
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      let completed =
        typeof data.completedOrders === "number" ? data.completedOrders : 0;
      let cancelled =
        typeof data.cancelledOrders === "number" ? data.cancelledOrders : 0;
      if (outcome === "delivered") {
        completed += 1;
      } else {
        cancelled += 1;
      }
      const total = completed + cancelled;
      const successRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
      const badges: string[] = Array.isArray(data.badges)
        ? [...data.badges.filter((b): b is string => typeof b === "string")]
        : [];
      if (completed >= 50 && !badges.includes("featured")) {
        badges.push("featured");
      }
      if (completed >= 200 && successRate >= 95 && !badges.includes("gold")) {
        badges.push("gold");
      }
      const rating =
        typeof data.rating === "number" && data.rating > 0
          ? data.rating
          : Math.min(5, Math.max(0, successRate / 20));

      tx.set(
        profileRef,
        {
          completedOrders: completed,
          cancelledOrders: cancelled,
          successRate,
          badges,
          rating,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
      tx.set(
        db.doc(`drivers/${driverId}`),
        {
          completedOrders: completed,
          cancelledOrders: cancelled,
          successRate,
          badges,
          rating,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    });

    const profileSnap = await profileRef.get();
    return {
      driverId,
      profile: mapDriverProfile(
        profileSnap.exists
          ? (profileSnap.data() as Record<string, unknown>)
          : undefined,
      ),
    };
  }),
);

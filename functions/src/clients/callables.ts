import {randomBytes} from "node:crypto";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {RESET_VALUE} from "firebase-functions/v2/options";
import {
  InputError,
  normalizedInviteCode,
  normalizedPhone,
  objectInput,
  optionalString,
  randomInviteCode,
  requiredString,
} from "../helpers";
import {
  isPublicLocationFilled,
  parsePublicLocation,
  type PublicOrderLocation,
} from "../jordanLocations";
import {
  auth,
  db,
  normalizeIssuedUserDocFields,
  requireCompanyStaff,
  run,
} from "../shared";
import {actor} from "../shared/auth";
import {buildPublicClientInviteUrl} from "./inviteUrl";
import {
  activateMembership,
  assertCanJoinAsIssued,
  findAuthUserByPhone,
  isIssuedRole,
  listMembershipsForUid,
  membershipDocId,
  setActiveIssuedClaims,
  writeMembership,
} from "./memberships";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Firebase Auth rejects passwords shorter than 6 characters. */
const MIN_PASSWORD_LEN = 6;

type IssuedInviteRole = "client" | "merchant";

function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new InputError("email", "A valid email address is required.");
  }
  return email;
}

function issuedInviteEmail(
  role: IssuedInviteRole,
  phoneE164: string,
): string {
  const digits = phoneE164.replace(/\D/g, "");
  const domain =
    role === "merchant" ? "merchants.wasel.app" : "clients.wasel.app";
  return `${digits}@${domain}`;
}

function parseInviteRole(raw: unknown): IssuedInviteRole {
  return raw === "merchant" ? "merchant" : "client";
}

function optionalDeliveryLocation(
  input: Record<string, unknown>,
): PublicOrderLocation | null {
  if (input.defaultLocation == null) {
    return null;
  }
  const parsed = parsePublicLocation(input.defaultLocation);
  if (!parsed || !isPublicLocationFilled(parsed)) {
    throw new InputError(
      "defaultLocation",
      "Provide a valid delivery location or leave it empty.",
    );
  }
  return parsed;
}

function assertPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LEN) {
    throw new InputError(
      "password",
      `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
    );
  }
}

async function assertPhoneAvailableForNewAccount(
  phoneNumber: string,
): Promise<void> {
  const existing = await findAuthUserByPhone(phoneNumber);
  if (existing) {
    throw new HttpsError(
      "already-exists",
      "Phone account exists. Sign in to join this company.",
      {
        reason: "phone-account-exists",
        email: existing.email,
        uid: existing.uid,
      },
    );
  }

  const byPhone = await db
    .collection("users")
    .where("phoneNumber", "==", phoneNumber)
    .limit(1)
    .get();
  if (!byPhone.empty) {
    const doc = byPhone.docs[0];
    throw new HttpsError(
      "already-exists",
      "Phone account exists. Sign in to join this company.",
      {
        reason: "phone-account-exists",
        email: String(doc.get("email") ?? ""),
        uid: doc.id,
      },
    );
  }
}

async function assertEmailAvailable(email: string): Promise<void> {
  try {
    await auth.getUserByEmail(email);
    throw new HttpsError("already-exists", "Email is already registered.");
  } catch (error: unknown) {
    const code = (error as {code?: string}).code;
    if (code !== "auth/user-not-found") {
      if (error instanceof HttpsError) throw error;
      throw error;
    }
  }
}

async function companyDisplayName(companyId: string): Promise<string> {
  const snap = await db.doc(`companies/${companyId}`).get();
  if (!snap.exists) {
    return "Wasel";
  }
  const name =
    (snap.get("name") as string | undefined) ||
    (snap.get("displayName") as string | undefined) ||
    (snap.get("companyName") as string | undefined);
  return typeof name === "string" && name.trim() ? name.trim() : "Wasel";
}

async function loadOpenInvite(inviteCode: string) {
  const inviteRef = db.doc(`clientInvites/${inviteCode}`);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    throw new HttpsError("not-found", "Invite not found.");
  }
  const status = inviteSnap.get("status") as string;
  if (status !== "pending" && status !== "open") {
    throw new HttpsError(
      "failed-precondition",
      "This invitation has already been used.",
    );
  }
  if (inviteSnap.get("claimedBy")) {
    throw new HttpsError(
      "failed-precondition",
      "This invitation has already been used.",
    );
  }
  const expiresAt = inviteSnap.get("expiresAt") as Timestamp | undefined;
  if (!expiresAt || expiresAt.toMillis() <= Date.now()) {
    throw new HttpsError("failed-precondition", "Invite has expired.");
  }
  const companyId = String(inviteSnap.get("companyId") ?? "");
  if (!companyId) {
    throw new HttpsError("failed-precondition", "Invite is invalid.");
  }
  return {
    inviteRef,
    inviteSnap,
    companyId,
    role: parseInviteRole(inviteSnap.get("role")),
    invitedPhone:
      (inviteSnap.get("phoneNumber") as string | null) ??
      (inviteSnap.get("phone") as string | null),
  };
}

/** Company staff: create a one-time client/merchant registration invite. */
export const createClientInvite = onCall((request) =>
  run(async () => {
    const input = objectInput(request.data ?? {});
    const role = parseInviteRole(
      optionalString(input, "role", 20) ??
        optionalString(input, "accountKind", 20),
    );
    const admin = await requireCompanyStaff(
      request,
      role === "merchant" ? "merchants:manage" : "customers:manage",
    );
    const note = optionalString(input, "note", 500);
    const rawPhone =
      optionalString(input, "phoneNumber", 24) ??
      optionalString(input, "phone", 24);
    const phoneNumber = rawPhone ? normalizedPhone(rawPhone) : null;
    const days = input.expiresInDays ?? 14;
    if (
      typeof days !== "number" ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 30
    ) {
      throw new InputError(
        "expiresInDays",
        "expiresInDays must be an integer from 1 to 30.",
      );
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomInviteCode(randomBytes(8));
      const ref = db.doc(`clientInvites/${code}`);
      try {
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(ref);
          if (existing.exists) {
            throw new HttpsError("already-exists", "Invite collision.");
          }
          tx.create(ref, {
            code,
            companyId: admin.companyId,
            createdBy: admin.uid,
            role,
            phoneNumber,
            phone: phoneNumber,
            status: "pending",
            note,
            expiresAt: Timestamp.fromMillis(Date.now() + days * 86_400_000),
            createdAt: FieldValue.serverTimestamp(),
          });
          tx.set(db.doc(`auditLogs/client_invite_created:${code}`), {
            action: "client_invite_created",
            actorUid: admin.uid,
            entityType: "clientInvite",
            entityId: code,
            companyId: admin.companyId,
            role,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        return {
          inviteId: code,
          inviteCode: code,
          code,
          role,
          phoneNumber,
          expiresInDays: days,
          inviteUrl: buildPublicClientInviteUrl(code),
        };
      } catch (error) {
        if (!(error instanceof HttpsError) || error.code !== "already-exists") {
          throw error;
        }
      }
    }
    throw new HttpsError(
      "resource-exhausted",
      "Could not allocate an invite code.",
    );
  }),
);

/** Public: preview invite for registration UI. */
export const getClientInvite = onCall(
  {
    cors: true,
    invoker: "public",
  },
  (request) =>
  run(async () => {
    const input = objectInput(request.data ?? {});
    const inviteCode = normalizedInviteCode(
      requiredString(input, "inviteCode", 12).replace(/[^A-Za-z0-9]/g, ""),
    );
    const snap = await db.doc(`clientInvites/${inviteCode}`).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Invite not found.");
    }
    const status = String(snap.get("status") ?? "pending");
    const expiresAt = snap.get("expiresAt") as Timestamp | undefined;
    const expired =
      !(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now();
    const companyId = String(snap.get("companyId") ?? "");
    const companyName = companyId
      ? await companyDisplayName(companyId)
      : "Wasel";
    const open = status === "pending" || status === "open";
    const available = open && !snap.get("claimedBy") && !expired;

    return {
      inviteCode,
      companyName,
      role: parseInviteRole(snap.get("role")),
      status: !available && open && expired ? "expired" : status,
      available,
      expiresAt: expiresAt instanceof Timestamp ? expiresAt.toMillis() : null,
      suggestedPhone:
        (snap.get("phoneNumber") as string | null) ??
        (snap.get("phone") as string | null) ??
        null,
    };
  }),
);

/**
 * Public: register a client with a one-time invite.
 * First successful registration claims the invite; others are rejected.
 */
export const registerClientWithInvite = onCall(
  {
    cors: true,
    invoker: "public",
  },
  (request) =>
  run(async () => {
    const input = objectInput(request.data ?? {});
    const inviteCode = normalizedInviteCode(
      requiredString(input, "inviteCode", 12).replace(/[^A-Za-z0-9]/g, ""),
    );
    const fullName = requiredString(input, "fullName", 120).trim();
    const phoneNumber = normalizedPhone(
      requiredString(input, "phoneNumber", 24),
    );
    const password = requiredString(input, "password", 128);
    assertPassword(password);
    const defaultLocation = optionalDeliveryLocation(input);

    const {
      inviteRef,
      companyId,
      role,
      invitedPhone,
    } = await loadOpenInvite(inviteCode);
    if (invitedPhone && invitedPhone !== phoneNumber) {
      throw new HttpsError(
        "permission-denied",
        "This invitation belongs to another phone number.",
      );
    }

    const emailRaw = optionalString(input, "email", 254);
    const email = emailRaw
      ? normalizeEmail(emailRaw)
      : issuedInviteEmail(role, phoneNumber);

    await assertPhoneAvailableForNewAccount(phoneNumber);
    await assertEmailAvailable(email);

    let user;
    try {
      user = await auth.createUser({
        email,
        password,
        phoneNumber,
        displayName: fullName,
        emailVerified: !emailRaw,
      });
    } catch (error: unknown) {
      const code = (error as {code?: string}).code;
      if (
        code === "auth/email-already-exists" ||
        code === "auth/phone-number-already-exists"
      ) {
        const existing = await findAuthUserByPhone(phoneNumber);
        throw new HttpsError(
          "already-exists",
          "Phone account exists. Sign in to join this company.",
          {
            reason: "phone-account-exists",
            email: existing?.email || email,
            uid: existing?.uid,
          },
        );
      }
      if (
        code === "auth/invalid-password" ||
        code === "auth/weak-password"
      ) {
        throw new InputError(
          "password",
          `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
        );
      }
      if (code === "auth/invalid-phone-number") {
        throw new InputError(
          "phoneNumber",
          "Use E.164 format, for example +9627…",
        );
      }
      console.error("[client-invite] createUser failed", code, error);
      throw error;
    }

    const uid = user.uid;
    try {
      await db.runTransaction(async (tx) => {
        const live = await tx.get(inviteRef);
        if (!live.exists) {
          throw new HttpsError("not-found", "Invite not found.");
        }
        const liveStatus = live.get("status") as string;
        if (
          (liveStatus !== "pending" && liveStatus !== "open") ||
          live.get("claimedBy")
        ) {
          throw new HttpsError(
            "failed-precondition",
            "This invitation has already been used.",
          );
        }
        const liveExpiry = live.get("expiresAt") as Timestamp | undefined;
        if (!liveExpiry || liveExpiry.toMillis() <= Date.now()) {
          throw new HttpsError("failed-precondition", "Invite has expired.");
        }

        const normalizedFields = normalizeIssuedUserDocFields({
          username: phoneNumber.replace(/\D/g, ""),
          fullName,
          email,
        });

        tx.set(inviteRef, {
          status: "accepted",
          claimedBy: uid,
          usedBy: uid,
          usedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        tx.set(db.doc(`users/${uid}`), {
          uid,
          role,
          companyId,
          status: "active",
          displayName: fullName,
          fullName,
          email,
          phoneNumber,
          profileComplete: true,
          permissions: [],
          source: "client_invite",
          inviteCode,
          createdBy: live.get("createdBy") ?? null,
          lastLoginAt: null,
          ...(defaultLocation ? {defaultLocation} : {}),
          ...normalizedFields,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(db.doc(`memberships/${membershipDocId(uid, companyId)}`), {
          uid,
          companyId,
          role,
          status: "active",
          inviteCode,
          source: "client_invite",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(db.doc(`phoneOtps/${uid}`), {
          uid,
          phoneNumber,
          verified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          source: "client_invite",
          attempts: 0,
          sentAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(db.doc(`auditLogs/client_invite_accepted:${inviteCode}`), {
          action: "client_invite_accepted",
          actorUid: uid,
          entityType: "clientInvite",
          entityId: inviteCode,
          companyId,
          role,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error) {
      try {
        await auth.deleteUser(uid);
      } catch {
        // best-effort rollback
      }
      throw error;
    }

    await setActiveIssuedClaims(uid, role, companyId);

    let emailVerificationLink: string | null = null;
    if (emailRaw) {
      try {
        emailVerificationLink = await auth.generateEmailVerificationLink(email);
      } catch (error) {
        console.warn("[client-invite] email verification link failed", error);
      }
    }

    return {
      uid,
      email,
      phoneNumber,
      companyId,
      role,
      fullName,
      profileComplete: true,
      emailVerified: !emailRaw,
      emailVerificationLink,
      joinedExisting: false,
    };
  }),
);

/**
 * Authenticated: join another company with a one-time invite (same phone account).
 */
export const joinCompanyWithClientInvite = onCall(
  {
    cors: true,
  },
  (request) =>
  run(async () => {
    const {uid} = actor(request);
    const input = objectInput(request.data ?? {});
    const inviteCode = normalizedInviteCode(
      requiredString(input, "inviteCode", 12).replace(/[^A-Za-z0-9]/g, ""),
    );
    const fullName = optionalString(input, "fullName", 120)?.trim() ?? null;
    const defaultLocation = optionalDeliveryLocation(input);

    const profile = await db.doc(`users/${uid}`).get();
    if (!profile.exists) {
      throw new HttpsError("not-found", "Account not found.");
    }
    if (profile.get("status") === "disabled") {
      throw new HttpsError("failed-precondition", "Account is disabled.");
    }
    await assertCanJoinAsIssued(
      (profile.get("role") as string | null) ?? null,
    );

    const phoneNumber = String(profile.get("phoneNumber") ?? "");
    const {
      inviteRef,
      companyId,
      role,
      invitedPhone,
    } = await loadOpenInvite(inviteCode);
    if (invitedPhone && phoneNumber && invitedPhone !== phoneNumber) {
      throw new HttpsError(
        "permission-denied",
        "This invitation belongs to another phone number.",
      );
    }

    const membershipRef = db.doc(
      `memberships/${membershipDocId(uid, companyId)}`,
    );
    const existingMembership = await membershipRef.get();
    if (
      existingMembership.exists &&
      existingMembership.get("status") === "active"
    ) {
      throw new HttpsError(
        "already-exists",
        "You already belong to this company.",
      );
    }

    await db.runTransaction(async (tx) => {
      const live = await tx.get(inviteRef);
      if (!live.exists) {
        throw new HttpsError("not-found", "Invite not found.");
      }
      const liveStatus = live.get("status") as string;
      if (
        (liveStatus !== "pending" && liveStatus !== "open") ||
        live.get("claimedBy")
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This invitation has already been used.",
        );
      }
      const liveExpiry = live.get("expiresAt") as Timestamp | undefined;
      if (!liveExpiry || liveExpiry.toMillis() <= Date.now()) {
        throw new HttpsError("failed-precondition", "Invite has expired.");
      }

      tx.set(inviteRef, {
        status: "accepted",
        claimedBy: uid,
        usedBy: uid,
        usedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      tx.set(membershipRef, {
        uid,
        companyId,
        role,
        status: "active",
        inviteCode,
        source: "client_invite_join",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});

      const userPatch: Record<string, unknown> = {
        companyId,
        role,
        status: "active",
        profileComplete: true,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (fullName) {
        userPatch.displayName = fullName;
        userPatch.fullName = fullName;
      }
      if (defaultLocation) {
        userPatch.defaultLocation = defaultLocation;
      }
      tx.set(db.doc(`users/${uid}`), userPatch, {merge: true});

      tx.set(db.doc(`auditLogs/client_invite_joined:${inviteCode}`), {
        action: "client_invite_joined",
        actorUid: uid,
        entityType: "clientInvite",
        entityId: inviteCode,
        companyId,
        role,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await setActiveIssuedClaims(uid, role, companyId);
    const companyName = await companyDisplayName(companyId);

    return {
      uid,
      companyId,
      companyName,
      role,
      joinedExisting: true,
    };
  }),
);

/** Authenticated: list company memberships for the signed-in client/merchant. */
export const listMyCompanyMemberships = onCall((request) =>
  run(async () => {
    const {uid} = actor(request);
    const profile = await db.doc(`users/${uid}`).get();
    if (!profile.exists) {
      throw new HttpsError("not-found", "Account not found.");
    }
    const role = profile.get("role");
    if (!isIssuedRole(role) && role != null) {
      // Still allow list for legacy incomplete roles with companyId.
      const companyId = profile.get("companyId");
      if (!companyId) {
        throw new HttpsError(
          "permission-denied",
          "Only client or merchant accounts can list company memberships.",
        );
      }
    }
    const memberships = await listMembershipsForUid(uid);
    return {memberships};
  }),
);

/** Authenticated: switch active company among memberships. */
export const switchActiveCompany = onCall((request) =>
  run(async () => {
    const {uid} = actor(request);
    const input = objectInput(request.data ?? {});
    const companyId = requiredString(input, "companyId", 128).trim();

    const membershipSnap = await db
      .doc(`memberships/${membershipDocId(uid, companyId)}`)
      .get();
    let role: IssuedInviteRole | null = null;
    if (membershipSnap.exists && membershipSnap.get("status") === "active") {
      const raw = membershipSnap.get("role");
      if (isIssuedRole(raw)) {
        role = raw;
      }
    } else {
      // Legacy: allow switch to the only companyId on the user doc.
      const profile = await db.doc(`users/${uid}`).get();
      if (
        profile.exists &&
        String(profile.get("companyId") ?? "") === companyId &&
        isIssuedRole(profile.get("role"))
      ) {
        role = profile.get("role") as IssuedInviteRole;
        await writeMembership({
          uid,
          companyId,
          role,
          source: "legacy_backfill",
        });
      }
    }

    if (!role) {
      throw new HttpsError(
        "permission-denied",
        "You are not a member of this company.",
      );
    }

    await activateMembership({uid, companyId, role});
    const companyName = await companyDisplayName(companyId);
    return {companyId, companyName, role};
  }),
);

export const listCompanyClientInvites = onCall(
  {
    minInstances: RESET_VALUE,
    maxInstances: 10,
  },
  (request) =>
    run(async () => {
      const admin = await requireCompanyStaff(request, [
        "customers:manage",
        "merchants:manage",
      ]);
      const snapshot = await db
        .collection("clientInvites")
        .where("companyId", "==", admin.companyId)
        .orderBy("createdAt", "desc")
        .get();
      const invites = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          companyId: admin.companyId,
          code: (data.code as string) ?? docSnap.id,
          role: parseInviteRole(data.role),
          phone:
            (data.phone as string) ??
            (data.phoneNumber as string) ??
            null,
          phoneNumber:
            (data.phoneNumber as string) ??
            (data.phone as string) ??
            null,
          status: (data.status as string) ?? "pending",
          claimedBy: (data.claimedBy as string) ?? null,
          createdAt: data.createdAt ?? null,
        };
      });
      return {invites};
    }),
);

export const revokeClientInvite = onCall((request) =>
  run(async () => {
    const admin = await requireCompanyStaff(request, "customers:manage");
    const input = objectInput(request.data ?? {});
    const codeRaw =
      optionalString(input, "inviteCode", 32) ??
      optionalString(input, "code", 32) ??
      optionalString(input, "inviteId", 32);
    if (!codeRaw) {
      throw new InputError("inviteCode", "inviteCode is required.");
    }
    const inviteCode = normalizedInviteCode(
      codeRaw.replace(/[^A-Za-z0-9]/g, ""),
    );
    const inviteRef = db.doc(`clientInvites/${inviteCode}`);
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
    await db.doc(`auditLogs/client_invite_revoked:${inviteCode}`).set({
      action: "client_invite_revoked",
      actorUid: admin.uid,
      entityType: "clientInvite",
      entityId: inviteCode,
      companyId: admin.companyId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {inviteId: inviteCode, status: "revoked"};
  }),
);

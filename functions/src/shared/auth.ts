import {FieldValue} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {sanitizePermissions, type CompanyPermission} from "../helpers";
import {auth, db} from "./admin";
import type {Request, Role} from "./types";

export function actor(
  request: Request,
): {uid: string; token: Record<string, unknown>} {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  return {
    uid: request.auth.uid,
    token: request.auth.token as Record<string, unknown>,
  };
}

export function requireRole(request: Request, role: Role): string {
  const current = actor(request);
  if (current.token.role !== role) {
    throw new HttpsError("permission-denied", `${role} role required.`);
  }
  return current.uid;
}

export function requireCompanyAdmin(
  request: Request,
): {uid: string; companyId: string} {
  const current = actor(request);
  if (
    current.token.role !== "company_admin" ||
    typeof current.token.companyId !== "string" ||
    !current.token.companyId
  ) {
    throw new HttpsError(
      "permission-denied",
      "Company administrator required.",
    );
  }
  return {uid: current.uid, companyId: current.token.companyId};
}

/**
 * Company admin always passes. Company employees must have the given
 * permission on their Firestore user document.
 * Falls back to the Firestore user profile when auth claims are stale/missing,
 * and attempts to repair custom claims for subsequent requests.
 */
export async function requireCompanyStaff(
  request: Request,
  permission?: CompanyPermission | CompanyPermission[],
): Promise<{uid: string; companyId: string; role: string}> {
  const current = actor(request);
  let role: unknown = current.token.role;
  let companyId: unknown = current.token.companyId;

  const tokenOk =
    (role === "company_admin" || role === "company_employee") &&
    typeof companyId === "string" &&
    Boolean(companyId);

  if (!tokenOk) {
    const snap = await db.doc(`users/${current.uid}`).get();
    const profileRole = snap.exists ? snap.get("role") : undefined;
    let profileCompanyId = snap.exists ? snap.get("companyId") : undefined;
    const status = snap.exists ? snap.get("status") : undefined;

    if (status === "disabled" || status === "suspended") {
      throw new HttpsError("permission-denied", "Account is not active.");
    }

    const staffRole =
      profileRole === "company_admin" || profileRole === "company_employee"
        ? profileRole
        : null;

    if (!staffRole) {
      throw new HttpsError("permission-denied", "Company staff required.");
    }

    if (typeof profileCompanyId !== "string" || !profileCompanyId) {
      if (staffRole === "company_admin") {
        const companies = await db
          .collection("companies")
          .where("adminUid", "==", current.uid)
          .limit(1)
          .get();
        if (!companies.empty) {
          profileCompanyId = companies.docs[0].id;
          await db.doc(`users/${current.uid}`).set(
            {
              role: staffRole,
              companyId: profileCompanyId,
              status: "active",
              updatedAt: FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
        }
      }
    }

    if (typeof profileCompanyId !== "string" || !profileCompanyId) {
      throw new HttpsError("permission-denied", "Company staff required.");
    }

    role = staffRole;
    companyId = profileCompanyId;
    try {
      await setRoleClaims(current.uid, staffRole as Role, profileCompanyId);
    } catch {
      // Claims may already conflict; still authorize this request from profile.
    }
  }

  if (role === "company_admin" || !permission) {
    return {
      uid: current.uid,
      companyId: String(companyId),
      role: String(role),
    };
  }
  const snap = await db.doc(`users/${current.uid}`).get();
  if (!snap.exists || snap.get("companyId") !== companyId) {
    throw new HttpsError("permission-denied", "Company membership required.");
  }
  if (snap.get("status") === "disabled" || snap.get("status") === "suspended") {
    throw new HttpsError("permission-denied", "Account is not active.");
  }
  const perms = sanitizePermissions(snap.get("permissions"));
  const required = Array.isArray(permission) ? permission : [permission];
  if (!required.some((item) => perms.includes(item))) {
    throw new HttpsError(
      "permission-denied",
      `Missing permission: ${required.join(" or ")}`,
    );
  }
  return {
    uid: current.uid,
    companyId: String(companyId),
    role: String(role),
  };
}

export function requireVerifiedApplicant(request: Request): string {
  const current = actor(request);
  if (current.token.role !== undefined && current.token.role !== "client") {
    throw new HttpsError(
      "failed-precondition",
      "This account cannot submit a company application.",
    );
  }
  if (current.token.companyId !== undefined) {
    throw new HttpsError(
      "failed-precondition",
      "This account is already bound to a company.",
    );
  }
  const verifiedEmail = current.token.email_verified === true;
  const verifiedPhone =
    typeof current.token.phone_number === "string" &&
    current.token.phone_number.length > 0;
  if (!verifiedEmail && !verifiedPhone) {
    throw new HttpsError(
      "failed-precondition",
      "Verify an email address or phone number before applying.",
    );
  }
  return current.uid;
}

export async function requireDriverApplicant(
  request: Request,
): Promise<{uid: string; phoneNumber: string}> {
  const current = actor(request);
  if (
    current.token.companyId !== undefined ||
    (current.token.role !== undefined &&
      current.token.role !== "client" &&
      current.token.role !== "driver")
  ) {
    throw new HttpsError(
      "failed-precondition",
      "This account cannot accept a driver invite.",
    );
  }

  let phoneNumber =
    typeof current.token.phone_number === "string"
      ? current.token.phone_number
      : "";

  if (!phoneNumber) {
    const authUser = await auth.getUser(current.uid);
    phoneNumber = authUser.phoneNumber ?? "";
  }

  if (!phoneNumber) {
    const userDoc = await db.doc(`users/${current.uid}`).get();
    const docPhone = userDoc.get("phoneNumber");
    if (typeof docPhone === "string") phoneNumber = docPhone;
  }

  if (!phoneNumber) {
    throw new HttpsError(
      "failed-precondition",
      "A phone-linked driver account is required.",
    );
  }

  return {uid: current.uid, phoneNumber};
}

/** @deprecated Use requireDriverApplicant for password-based drivers. */
export function requirePhoneApplicant(
  request: Request,
): {uid: string; phoneNumber: string} {
  const current = actor(request);
  if (
    current.token.companyId !== undefined ||
    (current.token.role !== undefined && current.token.role !== "client")
  ) {
    throw new HttpsError(
      "failed-precondition",
      "This account cannot submit a driver application.",
    );
  }
  if (
    typeof current.token.phone_number !== "string" ||
    !current.token.phone_number
  ) {
    throw new HttpsError(
      "failed-precondition",
      "A phone-authenticated account is required.",
    );
  }
  return {uid: current.uid, phoneNumber: current.token.phone_number};
}

export async function setRoleClaims(
  uid: string,
  role: Role,
  companyId?: string,
): Promise<void> {
  const user = await auth.getUser(uid);
  const existing = user.customClaims ?? {};
  if (existing.companyId !== undefined && existing.companyId !== companyId) {
    throw new HttpsError(
      "failed-precondition",
      "The account is already bound to another company.",
    );
  }
  if (
    existing.role !== undefined &&
    existing.role !== "client" &&
    existing.role !== role
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The account already has an incompatible privileged role.",
    );
  }
  await auth.setCustomUserClaims(uid, {
    ...existing,
    role,
    ...(companyId ? {companyId} : {}),
  });
}

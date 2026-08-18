import {FieldValue} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {auth, db} from "../shared/admin";
import type {Role} from "../shared/types";

export type IssuedMembershipRole = "client" | "merchant";

export function membershipDocId(uid: string, companyId: string): string {
  return `${uid}_${companyId}`;
}

export function isIssuedRole(role: unknown): role is IssuedMembershipRole {
  return role === "client" || role === "merchant";
}

/**
 * Set active role/company claims. Allows client↔merchant and company switches
 * for issued accounts; still blocks privileged role conflicts.
 */
export async function setActiveIssuedClaims(
  uid: string,
  role: IssuedMembershipRole,
  companyId: string,
): Promise<void> {
  const user = await auth.getUser(uid);
  const existing = user.customClaims ?? {};
  const existingRole = existing.role as string | undefined;

  if (
    existingRole !== undefined &&
    existingRole !== role &&
    !isIssuedRole(existingRole)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The account already has an incompatible privileged role.",
    );
  }

  await auth.setCustomUserClaims(uid, {
    ...existing,
    role,
    companyId,
  });
}

export async function writeMembership(args: {
  uid: string;
  companyId: string;
  role: IssuedMembershipRole;
  inviteCode?: string | null;
  source?: string;
}): Promise<void> {
  const id = membershipDocId(args.uid, args.companyId);
  await db.doc(`memberships/${id}`).set(
    {
      uid: args.uid,
      companyId: args.companyId,
      role: args.role,
      status: "active",
      inviteCode: args.inviteCode ?? null,
      source: args.source ?? "client_invite",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

export async function activateMembership(args: {
  uid: string;
  companyId: string;
  role: IssuedMembershipRole;
  fullName?: string | null;
}): Promise<void> {
  const patch: Record<string, unknown> = {
    companyId: args.companyId,
    role: args.role,
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (args.fullName && args.fullName.trim()) {
    patch.displayName = args.fullName.trim();
    patch.fullName = args.fullName.trim();
  }
  await db.doc(`users/${args.uid}`).set(patch, {merge: true});
  await setActiveIssuedClaims(args.uid, args.role, args.companyId);
}

export async function listMembershipsForUid(uid: string): Promise<
  Array<{
    companyId: string;
    role: IssuedMembershipRole;
    status: string;
    companyName: string;
    active: boolean;
  }>
> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const activeCompanyId = String(userSnap.get("companyId") ?? "");

  const snap = await db.collection("memberships").where("uid", "==", uid).get();

  const rows: Array<{
    companyId: string;
    role: IssuedMembershipRole;
    status: string;
  }> = [];

  for (const doc of snap.docs) {
    const role = doc.get("role");
    const status = String(doc.get("status") ?? "active");
    if (!isIssuedRole(role) || status !== "active") {
      continue;
    }
    rows.push({
      companyId: String(doc.get("companyId") ?? ""),
      role,
      status,
    });
  }

  // Backfill legacy single-company profiles that predate memberships.
  if (rows.length === 0 && userSnap.exists) {
    const legacyRole = userSnap.get("role");
    const legacyCompanyId = String(userSnap.get("companyId") ?? "");
    if (legacyCompanyId && isIssuedRole(legacyRole)) {
      await writeMembership({
        uid,
        companyId: legacyCompanyId,
        role: legacyRole,
        source: "legacy_backfill",
      });
      rows.push({
        companyId: legacyCompanyId,
        role: legacyRole,
        status: "active",
      });
    }
  }

  const enriched = await Promise.all(
    rows
      .filter((row) => row.companyId)
      .map(async (row) => {
        const companySnap = await db.doc(`companies/${row.companyId}`).get();
        const name =
          (companySnap.get("name") as string | undefined) ||
          (companySnap.get("displayName") as string | undefined) ||
          (companySnap.get("companyName") as string | undefined);
        return {
          ...row,
          companyName:
            typeof name === "string" && name.trim() ? name.trim() : "Wasel",
          active: row.companyId === activeCompanyId,
        };
      }),
  );

  return enriched.sort((a, b) =>
    a.companyName.localeCompare(b.companyName, undefined, {
      sensitivity: "base",
    }),
  );
}

export async function findAuthUserByPhone(phoneNumber: string): Promise<{
  uid: string;
  email: string;
  role: string | null;
} | null> {
  try {
    const user = await auth.getUserByPhoneNumber(phoneNumber);
    const profile = await db.doc(`users/${user.uid}`).get();
    return {
      uid: user.uid,
      email: user.email || String(profile.get("email") ?? ""),
      role: profile.exists ? (profile.get("role") as string | null) : null,
    };
  } catch (error: unknown) {
    const code = (error as {code?: string}).code;
    if (code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function assertCanJoinAsIssued(
  existingRole: string | null,
): Promise<void> {
  if (!existingRole || isIssuedRole(existingRole)) {
    return;
  }
  throw new HttpsError(
    "failed-precondition",
    "This phone belongs to an account that cannot join as a client or merchant.",
  );
}

/** Soften singular company bind for issued roles only. */
export async function setRoleClaimsAllowingIssuedSwitch(
  uid: string,
  role: Role,
  companyId?: string,
): Promise<void> {
  if (isIssuedRole(role) && companyId) {
    await setActiveIssuedClaims(uid, role, companyId);
    return;
  }
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

import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

const PROJECT_ID = "tlivery-87ad0";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function main(): Promise<void> {
  const uid = argument("uid") ?? process.env.BOOTSTRAP_SUPER_ADMIN_UID;
  const email = argument("email") ?? process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL;
  if ((!uid && !email) || (uid && email)) {
    throw new Error(
      "Provide exactly one of --uid=<uid>, --email=<email>, " +
        "BOOTSTRAP_SUPER_ADMIN_UID, or BOOTSTRAP_SUPER_ADMIN_EMAIL.",
    );
  }

  if (!getApps().length) initializeApp({projectId: PROJECT_ID});
  const auth = getAuth();
  const db = getFirestore();
  const user = uid
    ? await auth.getUser(uid)
    : await auth.getUserByEmail(email ?? "");
  const claims = user.customClaims ?? {};

  if (claims.companyId !== undefined) {
    throw new Error(
      "Refusing to bootstrap an account already bound to a company.",
    );
  }
  if (
    claims.role !== undefined &&
    claims.role !== "client" &&
    claims.role !== "super_admin"
  ) {
    throw new Error(
      "Refusing to replace an existing privileged role.",
    );
  }

  await auth.setCustomUserClaims(user.uid, {...claims, role: "super_admin"});
  await db.runTransaction(async (tx) => {
    tx.set(
      db.doc(`users/${user.uid}`),
      {
        uid: user.uid,
        email: user.email ?? null,
        role: "super_admin",
        status: "active",
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    tx.set(db.doc(`auditLogs/super_admin_bootstrapped:${user.uid}`), {
      action: "super_admin_bootstrapped",
      actorUid: user.uid,
      entityType: "user",
      entityId: user.uid,
      companyId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  console.log(`Super admin ready: ${user.uid} (${user.email ?? "no email"})`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

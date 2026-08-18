import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test, {after, before, beforeEach} from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {doc, getDoc, setDoc} from "firebase/firestore";

let environment: RulesTestEnvironment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "tlivery-87ad0",
    firestore: {
      rules: await readFile("../firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => environment.clearFirestore());
after(async () => environment.cleanup());

test("clients cannot write backend-owned records", async () => {
  const client = environment.authenticatedContext("user-1", {role: "client"});
  await assertFails(
    setDoc(doc(client.firestore(), "companyApplications/company_user-1"), {
      applicantUid: "user-1",
      status: "pending",
    }),
  );
});

test("company admins can read only their tenant's drivers", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "drivers/driver-1"), {
      companyId: "company-a",
      status: "active",
    });
  });
  const ownCompany = environment.authenticatedContext("admin-a", {
    role: "company_admin",
    companyId: "company-a",
  });
  const otherCompany = environment.authenticatedContext("admin-b", {
    role: "company_admin",
    companyId: "company-b",
  });
  await assertSucceeds(getDoc(doc(ownCompany.firestore(), "drivers/driver-1")));
  await assertFails(getDoc(doc(otherCompany.firestore(), "drivers/driver-1")));
});

test("users can read their own user record", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/user-1"), {
      uid: "user-1",
      role: "client",
    });
  });
  const ownContext = environment.authenticatedContext("user-1", {role: "client"});
  const snapshot = await assertSucceeds(
    getDoc(doc(ownContext.firestore(), "users/user-1")),
  );
  assert.equal(snapshot.exists(), true);
});

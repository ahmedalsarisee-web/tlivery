/**
 * Emulator smoke: deliver ledger signs + settlement balance wipe.
 * Run via: firebase emulators:exec --only firestore ...
 */
import {getApps, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {postOrderDeliveryLedger} from "../finance";

async function main(): Promise<void> {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  if (!getApps().length) {
    initializeApp({projectId: "tlivery-87ad0"});
  }
  const db = getFirestore();
  const smokeId = `smoke_${Date.now()}`;
  const companyId = "smoke_company";
  const driverId = "smoke_driver";
  const clientId = "smoke_client";

  await db.doc(`users/${driverId}`).set({
    role: "driver",
    companyId,
    displayName: "Smoke Driver",
    status: "active",
  });
  await db.doc(`users/${clientId}`).set({
    role: "client",
    companyId,
    displayName: "Smoke Client",
    status: "active",
  });

  await postOrderDeliveryLedger({
    companyId,
    orderId: smokeId,
    orderReference: "SMOKE-1",
    customerName: "Smoke Customer",
    amountJod: 10.5,
    driverId,
    driverName: "Smoke Driver",
    createdByUserId: clientId,
    createdByRole: "client",
  });

  // Idempotent retry must not double-post
  await postOrderDeliveryLedger({
    companyId,
    orderId: smokeId,
    orderReference: "SMOKE-1",
    customerName: "Smoke Customer",
    amountJod: 10.5,
    driverId,
    driverName: "Smoke Driver",
    createdByUserId: clientId,
    createdByRole: "client",
  });

  const driverTx = await db
    .doc(`financeTransactions/order_delivery_${smokeId}_driver`)
    .get();
  const clientTx = await db
    .doc(`financeTransactions/order_delivery_${smokeId}_client`)
    .get();
  const driverAcc = await db
    .doc(`financeAccounts/${companyId}_driver_${driverId}`)
    .get();
  const clientAcc = await db
    .doc(`financeAccounts/${companyId}_client_${clientId}`)
    .get();

  if (!driverTx.exists || !clientTx.exists) {
    throw new Error("Missing delivery transactions");
  }
  if (driverTx.get("amountJod") !== -10.5) {
    throw new Error(`Driver amount expected -10.5 got ${driverTx.get("amountJod")}`);
  }
  if (clientTx.get("amountJod") !== 10.5) {
    throw new Error(`Client amount expected 10.5 got ${clientTx.get("amountJod")}`);
  }
  if (driverAcc.get("balanceJod") !== -10.5) {
    throw new Error(`Driver balance expected -10.5 got ${driverAcc.get("balanceJod")}`);
  }
  if (clientAcc.get("balanceJod") !== 10.5) {
    throw new Error(`Client balance expected 10.5 got ${clientAcc.get("balanceJod")}`);
  }

  // Company settlement from party perspective: +10.5 clears driver debt
  const batch = db.batch();
  const settleRef = db.collection("financeTransactions").doc();
  batch.set(settleRef, {
    companyId,
    accountId: `${companyId}_driver_${driverId}`,
    partyType: "driver",
    partyUserId: driverId,
    amountJod: 10.5,
    type: "settlement",
    note: "smoke settle",
    createdByUserId: "smoke_admin",
    createdAt: new Date(),
    orderId: null,
    orderReference: null,
  });
  batch.set(
    db.doc(`financeAccounts/${companyId}_driver_${driverId}`),
    {balanceJod: 0},
    {merge: true},
  );
  await batch.commit();

  const after = (
    await db.doc(`financeAccounts/${companyId}_driver_${driverId}`).get()
  ).get("balanceJod");
  if (after !== 0) {
    throw new Error(`After settlement expected 0 got ${after}`);
  }

  console.log("SMOKE OK: deliver ledger signs + idempotency + settlement");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

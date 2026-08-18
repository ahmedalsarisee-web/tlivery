/**
 * Firebase Cloud Functions entrypoint.
 * Feature modules own callables; this file only sets globals and re-exports.
 */
import {setGlobalOptions} from "firebase-functions/v2/options";
import "./shared/admin";
import {requireCompanyStaff} from "./shared/auth";
import {run} from "./shared/run";
import {registerOrderCallables} from "./orders";
import {registerFinanceCallables} from "./finance";

setGlobalOptions({
  region: "me-central1",
  maxInstances: 2,
  concurrency: 40,
  memory: "256MiB",
  timeoutSeconds: 30,
});

export {
  submitCompanyApplication,
  approveCompanyApplication,
  rejectCompanyApplication,
  createCompanyEmployee,
  createCompanyClient,
  createCompanyMerchant,
  listCompanyClients,
  listCompanyMerchants,
  deleteCompanyClient,
  deleteCompanyMerchant,
  listCompanyEmployees,
  updateCompanyEmployee,
  deleteCompanyEmployee,
  resolveLoginEmail,
} from "./companies";

export {
  requestProfilePhoneOtp,
  verifyProfilePhoneOtp,
  completeIssuedProfile,
} from "./profile";

export {
  createClientInvite,
  getClientInvite,
  registerClientWithInvite,
  joinCompanyWithClientInvite,
  listMyCompanyMemberships,
  switchActiveCompany,
  listCompanyClientInvites,
  revokeClientInvite,
  clientInviteLanding,
} from "./clients";

export {
  createDriverInvite,
  createDriverByPhone,
  acceptDriverInvite,
  submitDriverApplication,
  approveDriverApplication,
  rejectDriverApplication,
  registerDriverAccount,
  resolveDriverLoginEmail,
  listCompanyDrivers,
  listCompanyDriverInvites,
  revokeDriverInvite,
  removeCompanyDriver,
  getCompanyDriver,
  updateCompanyDriver,
  updateMyVehicle,
  recordDriverOrderOutcome,
} from "./drivers";

export const {
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
} = registerOrderCallables({requireCompanyStaff, run});

export const {
  listFinanceHub,
  listFinanceParties,
  listFinanceTransactions,
  addFinanceEntry,
} = registerFinanceCallables({requireCompanyStaff, run});

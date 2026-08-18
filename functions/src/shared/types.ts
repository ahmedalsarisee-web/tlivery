import type {CallableRequest} from "firebase-functions/v2/https";

export type Request = CallableRequest<unknown>;

export type Role =
  | "super_admin"
  | "company_admin"
  | "company_employee"
  | "driver"
  | "client"
  | "merchant";

export type IssuedUserRole = "company_employee" | "client" | "merchant";

export type CursorPayload = {
  value: string;
  id: string;
};

export type RunFn = <T>(operation: () => Promise<T>) => Promise<T>;

export type RequireCompanyStaffFn = (
  request: Request,
  permission?: import("../helpers").CompanyPermission | import("../helpers").CompanyPermission[],
) => Promise<{uid: string; companyId: string; role: string}>;

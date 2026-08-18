import type {Company} from '@app/models/company.model';
import type {UserProfile} from '@app/models/user-profile.model';
import type {
  CompanyApplication,
  Driver,
  DriverApplication,
  DriverInvite,
} from '@app/models/workflow.model';

export type Unsubscribe = () => void;

export interface WorkflowRepository {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  getCompany(companyId: string): Promise<Company | null>;
  getDriver(driverId: string): Promise<Driver | null>;
  getCompanyApplication(userId: string): Promise<CompanyApplication | null>;
  getDriverApplication(userId: string): Promise<DriverApplication | null>;
  getDrivers(companyId: string): Promise<Driver[]>;
  getDriverInvites(companyId: string): Promise<DriverInvite[]>;
  getPendingDriverApplications(companyId: string): Promise<DriverApplication[]>;
  observeCompanyApplication(
    userId: string,
    listener: (application: CompanyApplication | null) => void,
  ): Unsubscribe;
  observeDriverApplication(
    userId: string,
    listener: (application: DriverApplication | null) => void,
  ): Unsubscribe;
  observeDrivers(
    companyId: string,
    listener: (drivers: Driver[]) => void,
  ): Unsubscribe;
  observeDriverInvites(
    companyId: string,
    listener: (invites: DriverInvite[]) => void,
  ): Unsubscribe;
  observePendingDriverApplications(
    companyId: string,
    listener: (applications: DriverApplication[]) => void,
  ): Unsubscribe;
}

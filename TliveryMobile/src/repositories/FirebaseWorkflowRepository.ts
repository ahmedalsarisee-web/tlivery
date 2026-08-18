import {
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  companyApplicationsCollection,
  companyDocument,
  driverApplicationsCollection,
  driverDocument,
  driverInvitesCollection,
  driversCollection,
  userDocument,
} from '@app/firebase/firestore/references';
import type {
  CompanyApplication,
  DriverApplication,
  DriverInvite,
} from '@app/models/workflow.model';
import type {WorkflowRepository} from './WorkflowRepository';
import {withApiLoading} from '@app/utils/apiLoadingVisibility';

const latestOrNull = <T extends {createdAt: Date}>(items: T[]): T | null =>
  [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
  null;

export class FirebaseWorkflowRepository implements WorkflowRepository {
  async getUserProfile(userId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDoc(userDocument(userId));
      return snapshot.exists() ? snapshot.data() : null;
    });
  }

  async getCompany(companyId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDoc(companyDocument(companyId));
      return snapshot.exists() ? snapshot.data() : null;
    });
  }

  async getDriver(driverId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDoc(driverDocument(driverId));
      return snapshot.exists() ? snapshot.data() : null;
    });
  }

  async getCompanyApplication(userId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDocs(this.companyApplicationQuery(userId));
      return latestOrNull(snapshot.docs.map(item => item.data()));
    });
  }

  async getDriverApplication(userId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDocs(this.driverApplicationQuery(userId));
      return latestOrNull(snapshot.docs.map(item => item.data()));
    });
  }

  async getDrivers(companyId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDocs(this.driversQuery(companyId));
      return snapshot.docs.map(item => item.data());
    });
  }

  async getDriverInvites(companyId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDocs(this.driverInvitesQuery(companyId));
      return snapshot.docs.map(item => item.data());
    });
  }

  async getPendingDriverApplications(companyId: string) {
    return withApiLoading(async () => {
      const snapshot = await getDocs(
        this.pendingDriverApplicationsQuery(companyId),
      );
      return snapshot.docs
        .map(item => item.data())
        .filter(item => item.status === 'pending');
    });
  }

  observeCompanyApplication(
    userId: string,
    listener: (application: CompanyApplication | null) => void,
  ) {
    return onSnapshot(this.companyApplicationQuery(userId), snapshot =>
      listener(latestOrNull(snapshot.docs.map(item => item.data()))),
    );
  }

  observeDriverApplication(
    userId: string,
    listener: (application: DriverApplication | null) => void,
  ) {
    return onSnapshot(this.driverApplicationQuery(userId), snapshot =>
      listener(latestOrNull(snapshot.docs.map(item => item.data()))),
    );
  }

  observeDrivers(companyId: string, listener: Parameters<WorkflowRepository['observeDrivers']>[1]) {
    return onSnapshot(this.driversQuery(companyId), snapshot =>
      listener(snapshot.docs.map(item => item.data())),
    );
  }

  observeDriverInvites(
    companyId: string,
    listener: (invites: DriverInvite[]) => void,
  ) {
    return onSnapshot(this.driverInvitesQuery(companyId), snapshot =>
      listener(snapshot.docs.map(item => item.data())),
    );
  }

  observePendingDriverApplications(
    companyId: string,
    listener: Parameters<WorkflowRepository['observePendingDriverApplications']>[1],
  ) {
    return onSnapshot(this.pendingDriverApplicationsQuery(companyId), snapshot =>
      listener(
        snapshot.docs
          .map(item => item.data())
          .filter(item => item.status === 'pending'),
      ),
    );
  }

  private companyApplicationQuery(userId: string) {
    return query(
      companyApplicationsCollection,
      where('userId', '==', userId),
    );
  }

  private driverApplicationQuery(userId: string) {
    return query(
      driverApplicationsCollection,
      where('userId', '==', userId),
    );
  }

  private driversQuery(companyId: string) {
    return query(
      driversCollection,
      where('companyId', '==', companyId),
    );
  }

  private driverInvitesQuery(companyId: string) {
    return query(
      driverInvitesCollection,
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
    );
  }

  private pendingDriverApplicationsQuery(companyId: string) {
    return query(
      driverApplicationsCollection,
      where('companyId', '==', companyId),
    );
  }
}

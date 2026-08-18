import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type QuerySnapshot,
} from 'firebase/firestore';
import type {
  Company,
  CompanyApplication,
  Driver,
  DriverApplication,
  DriverInvite,
} from '../models/workflow';
import {firestore} from '../firebase/firebaseApp';

function mapDocs<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map(item => ({id: item.id, ...item.data()}) as T);
}

async function list<T>(
  path: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const ref = collection(firestore, path);
  const snapshot = await getDocs(query(ref, ...constraints));
  return mapDocs<T>(snapshot);
}

export const workflowRepository = {
  listCompanyApplications: () =>
    list<CompanyApplication>('companyApplications', [
      orderBy('createdAt', 'desc'),
    ]),
  listCompanies: () => list<Company>('companies'),
  getMyCompanyApplication: async (uid: string) => {
    const rows = await list<CompanyApplication>('companyApplications', [
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(1),
    ]);
    return rows[0] ?? null;
  },
  listDrivers: (companyId: string) =>
    list<Driver>('drivers', [where('companyId', '==', companyId)]),
  listDriverInvites: (companyId: string) =>
    list<DriverInvite>('driverInvites', [
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
    ]),
  listDriverApplications: (companyId: string) =>
    list<DriverApplication>('driverApplications', [
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
    ]),
};

export type WorkflowDocument = DocumentData;

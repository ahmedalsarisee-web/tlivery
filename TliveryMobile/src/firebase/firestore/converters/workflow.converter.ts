import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type {
  CompanyApplication,
  Driver,
  DriverApplication,
  DriverInvite,
} from '@app/models/workflow.model';
import type {
  CompanyApplicationDocument,
  DriverApplicationDocument,
  DriverDocument,
  DriverInviteDocument,
} from '../documents/workflow.document';
import {fromFirestoreTimestamp} from '../firestoreTimestamp';

const dataWithId = <T>(snapshot: QueryDocumentSnapshot) => ({
  id: snapshot.id,
  ...(snapshot.data() as T),
});

export const companyApplicationConverter: FirestoreDataConverter<
  CompanyApplication,
  CompanyApplicationDocument
> = {
  toFirestore: model => model as never,
  fromFirestore: snapshot => {
    const data = dataWithId<CompanyApplicationDocument>(snapshot);
    return {
      ...data,
      createdAt: fromFirestoreTimestamp(data.createdAt, 'companyApplications.createdAt'),
      updatedAt: fromFirestoreTimestamp(data.updatedAt, 'companyApplications.updatedAt'),
    };
  },
};

export const driverInviteConverter: FirestoreDataConverter<
  DriverInvite,
  DriverInviteDocument
> = {
  toFirestore: model => model as never,
  fromFirestore: snapshot => {
    const data = dataWithId<DriverInviteDocument>(snapshot);
    return {
      ...data,
      expiresAt: data.expiresAt
        ? fromFirestoreTimestamp(data.expiresAt, 'driverInvites.expiresAt')
        : null,
      createdAt: fromFirestoreTimestamp(data.createdAt, 'driverInvites.createdAt'),
    };
  },
};

export const driverApplicationConverter: FirestoreDataConverter<
  DriverApplication,
  DriverApplicationDocument
> = {
  toFirestore: model => model as never,
  fromFirestore: snapshot => {
    const data = dataWithId<DriverApplicationDocument>(snapshot);
    return {
      ...data,
      createdAt: fromFirestoreTimestamp(data.createdAt, 'driverApplications.createdAt'),
      updatedAt: fromFirestoreTimestamp(data.updatedAt, 'driverApplications.updatedAt'),
    };
  },
};

export const driverConverter: FirestoreDataConverter<Driver, DriverDocument> = {
  toFirestore: model => model as never,
  fromFirestore: snapshot => {
    const data = dataWithId<DriverDocument>(snapshot);
    return {
      ...data,
      userId: data.userId || data.id,
      vehicleModel: data.vehicleModel?.trim() || '',
      vehicleColor: data.vehicleColor?.trim() || '',
      modelYear:
        typeof data.modelYear === 'number' && Number.isFinite(data.modelYear)
          ? data.modelYear
          : null,
      insuranceValidUntil: data.insuranceValidUntil?.trim() || null,
      photoUrl: data.photoUrl?.trim() || null,
      licenseImageUrl: data.licenseImageUrl?.trim() || null,
      registrationImageUrl: data.registrationImageUrl?.trim() || null,
      insuranceImageUrl: data.insuranceImageUrl?.trim() || null,
      completedOrders: 0,
      cancelledOrders: 0,
      successRate: 0,
      badges: [],
      experienceStartedAt: null,
      createdAt: fromFirestoreTimestamp(data.createdAt, 'drivers.createdAt'),
      updatedAt: fromFirestoreTimestamp(data.updatedAt, 'drivers.updatedAt'),
    };
  },
};

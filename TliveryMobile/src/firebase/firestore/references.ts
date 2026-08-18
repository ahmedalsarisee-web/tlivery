import {collection, doc} from 'firebase/firestore';
import {firestore} from '@app/firebase/firebaseApp';
import {firestoreCollections} from '@app/constants/firestoreCollections';
import {companyConverter} from './converters/company.converter';
import {userProfileConverter} from './converters/user.converter';
import {
  companyApplicationConverter,
  driverApplicationConverter,
  driverConverter,
  driverInviteConverter,
} from './converters/workflow.converter';

export const usersCollection = collection(
  firestore,
  firestoreCollections.users,
).withConverter(userProfileConverter);

export const companiesCollection = collection(
  firestore,
  firestoreCollections.companies,
).withConverter(companyConverter);

export const companyApplicationsCollection = collection(
  firestore,
  firestoreCollections.companyApplications,
).withConverter(companyApplicationConverter);

export const driverInvitesCollection = collection(
  firestore,
  firestoreCollections.driverInvites,
).withConverter(driverInviteConverter);

export const driverApplicationsCollection = collection(
  firestore,
  firestoreCollections.driverApplications,
).withConverter(driverApplicationConverter);

export const driversCollection = collection(
  firestore,
  firestoreCollections.drivers,
).withConverter(driverConverter);

export const userDocument = (userId: string) =>
  doc(usersCollection, userId);

export const companyDocument = (companyId: string) =>
  doc(companiesCollection, companyId);

export const driverDocument = (driverId: string) =>
  doc(driversCollection, driverId);

export const driverLocationDocument = (driverId: string) =>
  doc(firestore, firestoreCollections.driverLocations, driverId);

export const driverLocationsCollection = collection(
  firestore,
  firestoreCollections.driverLocations,
);

export const orderRouteHistoryCollection = (orderId: string) =>
  collection(
    firestore,
    firestoreCollections.orders,
    orderId,
    firestoreCollections.routeHistory,
  );

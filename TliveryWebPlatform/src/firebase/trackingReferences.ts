import {collection, doc} from 'firebase/firestore';
import {firestore} from './firebaseApp';
import {firestoreCollections} from '../constants/firestoreCollections';

export const driverLocationDocument = (driverId: string) =>
  doc(firestore, firestoreCollections.driverLocations, driverId);

export const driverLocationsCollection = collection(
  firestore,
  firestoreCollections.driverLocations,
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth, initializeAuth, type Auth} from 'firebase/auth';
import {getReactNativePersistence} from '@firebase/auth/dist/rn/index.js';
import {getFirestore} from 'firebase/firestore';
import {getFunctions} from 'firebase/functions';
import {getStorage} from 'firebase/storage';
import {
  FIREBASE_FUNCTIONS_REGION,
  firebaseConfig,
} from './firebaseConfig';

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const firebaseAuth = createAuth();
export const firestore = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(
  firebaseApp,
  FIREBASE_FUNCTIONS_REGION,
);
export const firebaseStorage = getStorage(firebaseApp);

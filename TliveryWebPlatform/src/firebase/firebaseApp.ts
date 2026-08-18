import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getFunctions} from 'firebase/functions';
import {getStorage} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBZyQE0jxe6Ty19j4DUDo1CwtaazBDkeyA',
  authDomain: 'tlivery-87ad0.firebaseapp.com',
  projectId: 'tlivery-87ad0',
  storageBucket: 'tlivery-87ad0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '657708863296',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:657708863296:web:5a11970c2ff85c46ebf4a5',
  measurementId: 'G-2SLWZ36H8K',
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, 'me-central1');
export const firebaseStorage = getStorage(firebaseApp);

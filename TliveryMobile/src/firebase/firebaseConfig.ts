import generated from './firebaseConfig.generated.json';

export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    generated.apiKey ||
    '',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    generated.authDomain ||
    'tlivery-87ad0.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    generated.projectId ||
    'tlivery-87ad0',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    generated.storageBucket ||
    'tlivery-87ad0.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    generated.messagingSenderId ||
    '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || generated.appId || '',
};

export const FIREBASE_FUNCTIONS_REGION = 'me-central1';

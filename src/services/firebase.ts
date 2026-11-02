import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Public Firebase web-app identifiers, never service-account credentials.
// Expo requires literal process.env.EXPO_PUBLIC_* accesses for bundling.
function readConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

// Intentionally lazy: demo screens keep working before cloud setup is complete.
// Initializing an SDK is not a connection test or a successful database write.
export function getFirebaseServices(): { app: FirebaseApp; db: Firestore } {
  const config = readConfig();
  const required = [config.apiKey, config.authDomain, config.projectId, config.appId];
  if (required.some(value => !value?.trim() || value.startsWith('REPLACE_'))) {
    throw new Error('Firebase is not configured. Complete .env.local using the Firebase web app settings.');
  }
  const app = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(config);
  return { app, db: getFirestore(app) };
}

// Firebase's React Native entry exports this helper; its web declarations omit it.
// @ts-expect-error React Native-only export verified in the SDK's native entry.
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirebaseServices } from './firebase';

export function getFirebaseAuth(): Auth {
  const { app } = getFirebaseServices();
  try {
    return initializeAuth(app, { persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}

export function authMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) return 'Sign-in is unavailable. Check the Firebase configuration and try again.';
  switch (error.code) {
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'We could not sign you in. Check your email and password, and make sure your account has been created.';
    case 'auth/network-request-failed': return 'Could not connect. Check your internet connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait before trying again.';
    case 'auth/user-disabled': return 'This account is disabled. Contact your administrator.';
    case 'auth/operation-not-allowed': return 'Email/password sign-in must be enabled in Firebase.';
    default: return 'The request could not be completed. Please try again.';
  }
}

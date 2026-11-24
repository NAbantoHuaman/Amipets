import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAwe__6E4uuLzLWS574xJnK5izRs07z7gs',
  authDomain: 'amipets-d469c.firebaseapp.com',
  projectId: 'amipets-d469c',
  storageBucket: 'amipets-d469c.firebasestorage.app',
  messagingSenderId: '375008094622',
  appId: '1:375008094622:web:3c76cff5544047c25f8e8f',
} as const;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || DEFAULT_FIREBASE_CONFIG.appId,
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createFirebaseAuth(): FirebaseAuth.Auth {
  if (Platform.OS === 'web') {
    return FirebaseAuth.getAuth(firebaseApp);
  }

  try {
    const getRnPersistence = (FirebaseAuth as any).getReactNativePersistence;
    if (typeof getRnPersistence === 'function') {
      return FirebaseAuth.initializeAuth(firebaseApp, {
        persistence: getRnPersistence(AsyncStorage),
      });
    }
  } catch {
    // Fallback to getAuth if Auth was already initialized during Fast Refresh
  }

  return FirebaseAuth.getAuth(firebaseApp);
}

export const firebaseAuth = createFirebaseAuth();
export const firestoreDb = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

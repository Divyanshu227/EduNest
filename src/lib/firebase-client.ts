import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function hasFirebaseMessagingConfig() {
  return hasFirebaseConfig() && Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
}

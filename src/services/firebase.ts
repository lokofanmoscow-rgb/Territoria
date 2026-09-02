import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
// getReactNativePersistence типизирован через src/types/firebase-auth-rn.d.ts —
// firebase/auth не резолвит "react-native" export condition в своих типах.
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Заполняется через .env (см. .env.example) — значения берутся из настроек
// Firebase-проекта: Project settings → General → Your apps → SDK setup.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

if (__DEV__ && !firebaseConfig.apiKey) {
  console.warn(
    '[firebase] Конфиг пуст: скопируй .env.example в .env и заполни ключи проекта.',
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth + AsyncStorage — иначе на RN сессия не переживает перезапуск
// приложения (getAuth по умолчанию использует in-memory persistence).
// try/catch нужен из-за Fast Refresh: initializeAuth нельзя вызвать дважды
// на одном app, при повторном исполнении модуля падаем обратно на getAuth.
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);

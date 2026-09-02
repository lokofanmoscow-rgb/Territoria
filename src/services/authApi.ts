import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase';
import type { UserDoc } from '../types/game';

export function subscribeAuthState(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onChange);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string, name: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  const profile: UserDoc = { name, stats: { wins: 0, gamesPlayed: 0 } };
  await setDoc(doc(db, 'users', credential.user.uid), profile);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserDoc | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as UserDoc) : null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Некорректный email.',
  'auth/user-disabled': 'Аккаунт заблокирован.',
  'auth/user-not-found': 'Пользователь с таким email не найден.',
  'auth/wrong-password': 'Неверный пароль.',
  'auth/invalid-credential': 'Неверный email или пароль.',
  'auth/email-already-in-use': 'Этот email уже зарегистрирован.',
  'auth/weak-password': 'Пароль слишком простой (минимум 6 символов).',
  'auth/network-request-failed': 'Нет соединения с сервером.',
  'auth/too-many-requests': 'Слишком много попыток. Попробуй позже.',
};

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return 'Что-то пошло не так. Попробуй ещё раз.';
}

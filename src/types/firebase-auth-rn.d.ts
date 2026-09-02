// `firebase/auth`'s published types don't branch on the "react-native" package
// export condition (only the "." export's own runtime code does), so
// getReactNativePersistence is missing from its .d.ts even though Metro
// resolves it fine at runtime. Patch the type in locally — see
// https://github.com/firebase/firebase-js-sdk/issues/8080.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

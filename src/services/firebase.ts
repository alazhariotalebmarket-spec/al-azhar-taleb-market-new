import { initializeApp, getApps } from 'firebase/app';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { OrganizationData } from '../types';
import { mergeCalendarBannerProjectSeed } from '../data/initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface AuthUserSnapshot {
  uid?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  isAnonymous?: boolean | null;
  tenantId?: string | null;
  providerData?: {
    providerId?: string | null;
    email?: string | null;
  }[];
}

let getAuthUserSnapshot: (() => AuthUserSnapshot | null) | null = null;

export function registerAuthUserGetter(getter: () => AuthUserSnapshot | null): void {
  getAuthUserSnapshot = getter;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = getAuthUserSnapshot ? getAuthUserSnapshot() : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with persistent multi-tab IndexedDB cache for instant repeat loads
function createFirestoreDb() {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = createFirestoreDb();

export const ORG_DOC_PATH = 'organizations/al_azhar';

/**
 * Validate Firestore connectivity on initial boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or unreachable. Please verify network or config.');
    }
    return false;
  }
}

/**
 * Sanitizes object by removing undefined values before sending to Firestore
 */
function sanitizeForFirestore(data: OrganizationData): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Realtime listener for organization data across all devices
 */
export function subscribeToOrganizationData(
  onData: (data: OrganizationData) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const orgDocRef = doc(db, 'organizations', 'al_azhar');

  return onSnapshot(
    orgDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        if (raw && typeof raw === 'object') {
          onData(raw as OrganizationData);
        }
      }
    },
    (error) => {
      console.error('Firestore snapshot error on organizations/al_azhar:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves organization data directly to Firebase Firestore
 */
export async function saveOrganizationDataToFirestore(
  data: OrganizationData
): Promise<void> {
  const orgDocRef = doc(db, 'organizations', 'al_azhar');
  try {
    const sanitized = sanitizeForFirestore(data);
    const payload = {
      ...sanitized,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(orgDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ORG_DOC_PATH);
  }
}

/**
 * Ensures Firestore is initialized with organization data if not already present,
 * and idempotently merges newly added seed projects without deleting existing records.
 */
export async function ensureFirestoreInitialized(
  fallbackData: OrganizationData
): Promise<OrganizationData> {
  const orgDocRef = doc(db, 'organizations', 'al_azhar');
  try {
    const snap = await getDoc(orgDocRef);
    if (snap.exists()) {
      const remoteData = snap.data() as OrganizationData;
      const { data: mergedData, changed } = mergeCalendarBannerProjectSeed(remoteData);
      if (changed) {
        await saveOrganizationDataToFirestore(mergedData);
      }
      return mergedData;
    }
    // Seed initial data to Firestore
    await saveOrganizationDataToFirestore(fallbackData);
    return fallbackData;
  } catch (error) {
    console.warn('Could not check or seed initial Firestore data:', error);
    return fallbackData;
  }
}

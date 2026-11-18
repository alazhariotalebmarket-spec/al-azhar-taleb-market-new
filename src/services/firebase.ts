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
import {
  mergeCalendarBannerProjectSeed,
  mergeFerdausMollaLocalSeed,
} from '../data/initialData';

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

// Initialize Firestore with persistent multi-tab IndexedDB cache and auto long-polling fallback
function createFirestoreDb() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId || undefined
      );
    } catch {
      return firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    }
  }
}

export const db = createFirestoreDb();

export const ORG_DOC_PATH = 'organizations/al_azhar';

type FirestoreRestValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  stringValue?: string;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
};

function decodeFirestoreRestValue(val: FirestoreRestValue | undefined): unknown {
  if (!val || typeof val !== 'object') return undefined;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return val.stringValue ?? '';
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map((v) => decodeFirestoreRestValue(v));
  }
  if ('mapValue' in val) {
    const out: Record<string, unknown> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreRestValue(v);
    }
    return out;
  }
  return undefined;
}

async function fetchOrganizationFromFirestoreRest(): Promise<OrganizationData | null> {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) return null;
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(dbId)}/documents/${ORG_DOC_PATH}?key=${encodeURIComponent(
    firebaseConfig.apiKey
  )}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { fields?: Record<string, FirestoreRestValue> };
  if (!json.fields) return null;
  const decoded = decodeFirestoreRestValue({ mapValue: { fields: json.fields } });
  if (!decoded || typeof decoded !== 'object') return null;
  return decoded as OrganizationData;
}

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
      if (snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
        return;
      }
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
    try {
      const serverSnap = await getDocFromServer(orgDocRef);
      if (serverSnap.exists()) {
        const remoteData = mergeFerdausMollaLocalSeed(serverSnap.data() as OrganizationData);
        const { data: mergedData, changed } = mergeCalendarBannerProjectSeed(remoteData);
        if (changed) {
          await saveOrganizationDataToFirestore(mergedData);
        }
        return mergedData;
      }
      await saveOrganizationDataToFirestore(fallbackData);
      return fallbackData;
    } catch {
      // If SDK WebChannel/gRPC-web is blocked (e.g. iframe/proxy), fetch live document over HTTPS REST first
      try {
        const restData = await fetchOrganizationFromFirestoreRest();
        if (restData) {
          const withFerdaus = mergeFerdausMollaLocalSeed(restData);
          const { data: mergedData } = mergeCalendarBannerProjectSeed(withFerdaus);
          return mergedData;
        }
      } catch {
        // Ignore REST error and try local Firestore cache below
      }

      const cachedSnap = await getDoc(orgDocRef);
      if (cachedSnap.exists()) {
        const cachedData = mergeFerdausMollaLocalSeed(cachedSnap.data() as OrganizationData);
        const { data: mergedData } = mergeCalendarBannerProjectSeed(cachedData);
        return mergedData;
      }
      return fallbackData;
    }
  } catch (error) {
    console.warn('Could not check or seed initial Firestore data:', error);
    return fallbackData;
  }
}

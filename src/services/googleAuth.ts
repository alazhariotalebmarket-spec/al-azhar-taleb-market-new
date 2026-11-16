import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, registerAuthUserGetter } from './firebase';
import { firebaseConfig } from './firebaseConfig';

// Preserve existing Firebase Auth instance and user getter without interfering with Firebase sessions
const auth = getAuth(app);
registerAuthUserGetter(() => auth.currentUser);

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export interface DriveAuthUser {
  email: string | null;
  displayName: string | null;
}

export type GoogleDriveAuthErrorCode =
  | 'PERMISSION_DENIED'
  | 'POPUP_CLOSED'
  | 'POPUP_BLOCKED'
  | 'ORIGIN_NOT_ALLOWED'
  | 'CONFIG_MISSING'
  | 'AUTH_ERROR';

export class GoogleDriveAuthError extends Error {
  code: GoogleDriveAuthErrorCode;

  constructor(message: string, code: GoogleDriveAuthErrorCode) {
    super(message);
    this.name = 'GoogleDriveAuthError';
    this.code = code;
  }
}

interface GisTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  error_subtype?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
}

interface GisWindow extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          prompt?: string;
          callback: (resp: GisTokenResponse) => void;
          error_callback?: (err: { type?: string; message?: string }) => void;
        }) => GisTokenClient;
        revoke?: (token: string, done?: () => void) => void;
      };
    };
  };
}

// Strictly in-memory token caching (NEVER localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
let cachedDriveUser: DriveAuthUser | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let gisLoadPromise: Promise<void> | null = null;

type AuthListener = {
  onSuccess?: (user: DriveAuthUser, token: string) => void;
  onFailure?: (user: User | null) => void;
};
const authListeners = new Set<AuthListener>();

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function notifyAuthSuccess(user: DriveAuthUser, token: string) {
  authListeners.forEach((listener) => {
    listener.onSuccess?.(user, token);
  });
}

function notifyAuthFailure(user: User | null = null) {
  authListeners.forEach((listener) => {
    listener.onFailure?.(user);
  });
}

function scheduleProactiveRefresh(expiresInSeconds: number) {
  clearRefreshTimer();
  // Refresh silently 2 minutes before expiry (minimum 60s delay)
  const refreshDelayMs = Math.max(60_000, (expiresInSeconds - 120) * 1000);
  refreshTimer = setTimeout(() => {
    if (cachedAccessToken) {
      void refreshAccessTokenSilent();
    }
  }, refreshDelayMs);
}

export function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new GoogleDriveAuthError('Browser environment required', 'AUTH_ERROR'));
  }
  const win = window as GisWindow;
  if (win.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gisLoadPromise) {
    return gisLoadPromise;
  }

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      if (existing.dataset.loaded === 'true' && win.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      if (existing.dataset.failed === 'true') {
        existing.remove();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => {
            gisLoadPromise = null;
            reject(
              new GoogleDriveAuthError(
                'Google Identity Services লোড করা যায়নি। ইন্টারনেট সংযোগ যাচাই করুন।',
                'AUTH_ERROR'
              )
            );
          },
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      script.dataset.failed = 'true';
      gisLoadPromise = null;
      reject(
        new GoogleDriveAuthError(
          'Google Identity Services লোড করা যায়নি। অনুগ্রহ করে অ্যাড-ব্লকার বা নেটওয়ার্ক যাচাই করুন।',
          'AUTH_ERROR'
        )
      );
    };
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

// Preload GIS script cleanly so popup calls open synchronously under user gesture
if (typeof window !== 'undefined') {
  void loadGisScript().catch(() => {});
}

async function fetchGoogleUserEmail(accessToken: string): Promise<DriveAuthUser> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (res.ok) {
      const json = (await res.json()) as {
        user?: { displayName?: string; emailAddress?: string };
      };
      return {
        email: json.user?.emailAddress || null,
        displayName: json.user?.displayName || null,
      };
    }
  } catch {
    // Non-fatal fallback
  }
  return cachedDriveUser || { email: null, displayName: null };
}

function getOAuthClientId(): string {
  const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId?.trim() || '';
  if (!clientId) {
    throw new GoogleDriveAuthError(
      'Google OAuth Client ID কনফিগার করা নেই। Vercel-এ VITE_GOOGLE_OAUTH_CLIENT_ID সেট করুন।',
      'CONFIG_MISSING'
    );
  }
  return clientId;
}

function mapGisCallbackError(resp: GisTokenResponse): GoogleDriveAuthError {
  const rawErr = `${resp.error || ''} ${resp.error_description || ''} ${resp.error_subtype || ''}`.toLowerCase();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (
    resp.error === 'access_denied' ||
    rawErr.includes('access_denied') ||
    rawErr.includes('permission') ||
    rawErr.includes('consent')
  ) {
    return new GoogleDriveAuthError(
      'আপনি Google Drive-এর অনুমতি বাতিল বা প্রত্যাখ্যান করেছেন। ফাইল আপলোড ও ব্যবস্থাপনার জন্য অনুগ্রহ করে "Connect Google Drive" এ ক্লিক করে অনুমতি প্রদান করুন।',
      'PERMISSION_DENIED'
    );
  }

  if (
    rawErr.includes('origin_mismatch') ||
    rawErr.includes('idpiframe_initialization_failed') ||
    rawErr.includes('redirect_uri_mismatch') ||
    rawErr.includes('invalid_client')
  ) {
    return new GoogleDriveAuthError(
      `এই ডোমেইনটি (${origin}) Google OAuth Client-এ অনুমোদিত নয়। Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs-এ Authorized JavaScript origins-এ "${origin}" যোগ করুন।`,
      'ORIGIN_NOT_ALLOWED'
    );
  }

  return new GoogleDriveAuthError(
    resp.error_description || resp.error || 'Google Drive অনুমতি পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    'AUTH_ERROR'
  );
}

async function requestGisToken(
  promptMode: 'select_account consent' | 'consent' | ''
): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = getOAuthClientId();
  const win = window as GisWindow;
  if (!win.google?.accounts?.oauth2) {
    await loadGisScript();
  }

  const oauth2 = win.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new GoogleDriveAuthError(
      'Google Identity Services স্ক্রিপ্ট চালু করা যায়নি। অনুগ্রহ করে পেজ রিলোড করুন।',
      'AUTH_ERROR'
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return new Promise<{ accessToken: string; expiresIn: number }>((resolve, reject) => {
    let settled = false;
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES.join(' '),
      prompt: promptMode,
      callback: (resp) => {
        if (settled) return;
        settled = true;
        if (resp.error || !resp.access_token) {
          reject(mapGisCallbackError(resp));
          return;
        }
        resolve({
          accessToken: resp.access_token,
          expiresIn: typeof resp.expires_in === 'number' && resp.expires_in > 0 ? resp.expires_in : 3600,
        });
      },
      error_callback: (err) => {
        if (settled) return;
        settled = true;
        const msg = (err?.message || '').toLowerCase();
        if (err?.type === 'popup_closed') {
          reject(
            new GoogleDriveAuthError(
              'Google Drive অনুমতি উইন্ডো বন্ধ করা হয়েছে। সংযোগ সম্পন্ন করতে পুনরায় অনুমতি প্রদান করুন।',
              'POPUP_CLOSED'
            )
          );
        } else if (err?.type === 'popup_failed_to_open') {
          reject(
            new GoogleDriveAuthError(
              'ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজারের পপ-আপ অনুমতি দিয়ে আবার চেষ্টা করুন।',
              'POPUP_BLOCKED'
            )
          );
        } else if (msg.includes('origin') || msg.includes('idpiframe')) {
          reject(
            new GoogleDriveAuthError(
              `ডোমেইন (${origin}) অনুমোদনের ত্রুটি। Google Cloud Console-এর Authorized JavaScript origins-এ "${origin}" যুক্ত করুন।`,
              'ORIGIN_NOT_ALLOWED'
            )
          );
        } else {
          reject(
            new GoogleDriveAuthError(
              err?.message || 'Google Drive সংযোগ সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
              'AUTH_ERROR'
            )
          );
        }
      },
    });

    client.requestAccessToken({
      prompt: promptMode,
      ...(promptMode === '' && cachedDriveUser?.email ? { hint: cachedDriveUser.email } : {}),
    });
  });
}

/**
 * Subscribe to Drive GIS auth state (and clear in-memory token if Firebase Auth signs out).
 * Does NOT require Firebase Auth for GIS login so existing Firebase login remains untouched.
 */
export const initAuth = (
  onAuthSuccess?: (user: DriveAuthUser, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  const listener: AuthListener = { onSuccess: onAuthSuccess, onFailure: onAuthFailure };
  authListeners.add(listener);

  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    onSuccessIfReady(listener);
  }

  let sawSignedInFirebaseUser = Boolean(auth.currentUser);
  const unsubFirebase = onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      sawSignedInFirebaseUser = true;
    } else if (sawSignedInFirebaseUser) {
      // Only clear if an active Firebase session explicitly signed out
      sawSignedInFirebaseUser = false;
      clearCachedToken();
      onAuthFailure?.(null);
    }
  });

  return () => {
    authListeners.delete(listener);
    unsubFirebase();
  };
};

function onSuccessIfReady(listener: AuthListener) {
  if (cachedAccessToken && cachedDriveUser) {
    listener.onSuccess?.(cachedDriveUser, cachedAccessToken);
  }
}

/**
 * Primary GIS OAuth 2.0 Sign-In for Google Drive (`drive.file` scope)
 */
export const googleSignIn = async (): Promise<{ user: DriveAuthUser; accessToken: string }> => {
  const { accessToken, expiresIn } = await requestGisToken('select_account consent');
  cachedAccessToken = accessToken;
  tokenExpiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
  scheduleProactiveRefresh(expiresIn);

  const user = await fetchGoogleUserEmail(accessToken);
  cachedDriveUser = user;
  notifyAuthSuccess(user, accessToken);
  return { user, accessToken };
};

export const reconnectGoogleDrive = async (): Promise<{
  user: DriveAuthUser;
  accessToken: string;
}> => {
  clearCachedToken();
  const { accessToken, expiresIn } = await requestGisToken('select_account consent');
  cachedAccessToken = accessToken;
  tokenExpiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
  scheduleProactiveRefresh(expiresIn);

  const user = await fetchGoogleUserEmail(accessToken);
  cachedDriveUser = user;
  notifyAuthSuccess(user, accessToken);
  return { user, accessToken };
};

/**
 * Silently refreshes the GIS access token before expiry (or after a 401)
 * without clearing existing Firebase Auth login.
 */
export const refreshAccessTokenSilent = async (): Promise<string | null> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const { accessToken, expiresIn } = await requestGisToken('');
      cachedAccessToken = accessToken;
      tokenExpiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
      scheduleProactiveRefresh(expiresIn);

      if (!cachedDriveUser?.email) {
        cachedDriveUser = await fetchGoogleUserEmail(accessToken);
      }
      notifyAuthSuccess(cachedDriveUser, accessToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

/**
 * Returns a valid in-memory Drive access token, automatically refreshing silently if expired/near-expiry.
 */
export const getValidAccessToken = async (autoRefresh = true): Promise<string | null> => {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  if (autoRefresh && (cachedAccessToken || cachedDriveUser)) {
    return await refreshAccessTokenSilent();
  }
  return cachedAccessToken;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getTokenExpiresAt = (): number => {
  return tokenExpiresAt;
};

export const getConnectedDriveUser = (): DriveAuthUser | null => {
  return cachedDriveUser;
};

export const clearCachedToken = (): void => {
  clearRefreshTimer();
  cachedAccessToken = null;
  tokenExpiresAt = 0;
};

/**
 * Disconnects Google Drive by revoking the GIS token and clearing in-memory cache.
 * Preserves any active Firebase Auth session.
 */
export const logoutGoogleDrive = async (): Promise<void> => {
  const tokenToRevoke = cachedAccessToken;
  clearCachedToken();
  cachedDriveUser = null;

  if (tokenToRevoke && typeof window !== 'undefined') {
    const win = window as GisWindow;
    try {
      win.google?.accounts?.oauth2?.revoke?.(tokenToRevoke, () => {});
    } catch {
      // Non-fatal
    }
  }

  notifyAuthFailure(null);
};

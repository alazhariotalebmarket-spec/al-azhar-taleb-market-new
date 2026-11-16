import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { AdminTab } from './components/AdminPanel';
import { UserPortal } from './components/UserPortal';
import {
  loadOrganizationData,
  mergeCalendarBannerProjectSeed,
  saveOrganizationData,
} from './data/initialData';
import {
  ensureFirestoreInitialized,
  saveOrganizationDataToFirestore,
  subscribeToOrganizationData,
  testConnection,
} from './services/firebase';
import type { DriveFolderFile, DriveFolderInfo } from './services/googleDriveBackup';

const AdminLoginPage = lazy(() =>
  import('./components/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
import {
  AutoBackupSettings,
  BackupFrequency,
  BackupRecord,
  BackupTrigger,
  DonationRequest,
  DRIVE_DOCUMENTS_FOLDER_NAME,
  MemberApplication,
  OrganizationData,
  SavedDriveDocument,
  UserRole,
} from './types';

type AppView = 'user' | 'login' | 'admin';

const FREQUENCY_MS: Record<BackupFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const ADMIN_ONLY_MESSAGE = 'শুধুমাত্র অ্যাডমিন এডিট করতে পারবেন';

export default function App() {
  const [view, setView] = useState<AppView>('user');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('overview');
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [data, setData] = useState<OrganizationData>(() => loadOrganizationData());

  const role: UserRole = isAdminLoggedIn ? 'admin' : 'user';

  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [driveFolder, setDriveFolder] = useState<DriveFolderInfo | null>(null);
  const [driveDocumentsFolder, setDriveDocumentsFolder] = useState<DriveFolderInfo | null>(null);
  const [isLoadingDriveFolder, setIsLoadingDriveFolder] = useState(false);
  const [isLoadingDocumentsFolder, setIsLoadingDocumentsFolder] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<BackupRecord | null>(
    () => (Array.isArray(data.backupHistory) ? data.backupHistory[0] || null : null)
  );
  const [driveError, setDriveError] = useState<{
    message: string;
    isApiDisabled?: boolean;
    needsReconnect?: boolean;
  } | null>(null);
  const [driveToast, setDriveToast] = useState<{
    message: string;
    dateTime?: string;
    folderLink?: string;
    isError?: boolean;
    canReconnect?: boolean;
  } | null>(null);

  const backupInFlightRef = useRef(false);
  const scheduledCheckedRef = useRef(false);
  const lastFailedTriggerRef = useRef<BackupTrigger | null>(null);

  // Realtime Firestore synchronization across all devices and browsers
  useEffect(() => {
    void testConnection();

    // Ensure Firestore is initialized with organization data
    const local = loadOrganizationData();
    void ensureFirestoreInitialized(local).then((remoteOrLocal) => {
      if (remoteOrLocal) {
        setData((prev) => ({
          ...prev,
          ...remoteOrLocal,
          members: Array.isArray(remoteOrLocal.members) ? remoteOrLocal.members : prev.members,
          notices: Array.isArray(remoteOrLocal.notices) ? remoteOrLocal.notices : prev.notices,
          transactions: Array.isArray(remoteOrLocal.transactions)
            ? remoteOrLocal.transactions
            : prev.transactions,
          projects: Array.isArray(remoteOrLocal.projects) ? remoteOrLocal.projects : prev.projects,
          advisors: Array.isArray(remoteOrLocal.advisors) ? remoteOrLocal.advisors : prev.advisors,
          donationRequests: Array.isArray(remoteOrLocal.donationRequests)
            ? remoteOrLocal.donationRequests
            : prev.donationRequests,
          memberApplications: Array.isArray(remoteOrLocal.memberApplications)
            ? remoteOrLocal.memberApplications
            : prev.memberApplications,
          backupHistory: Array.isArray(remoteOrLocal.backupHistory)
            ? remoteOrLocal.backupHistory
            : prev.backupHistory,
          backupSettings: remoteOrLocal.backupSettings
            ? { ...prev.backupSettings, ...remoteOrLocal.backupSettings }
            : prev.backupSettings,
          driveDocuments: Array.isArray(remoteOrLocal.driveDocuments)
            ? remoteOrLocal.driveDocuments
            : prev.driveDocuments,
        }));
      }
    });

    // Realtime subscription: Any change from any admin on any device updates all clients live
    const unsubscribe = subscribeToOrganizationData((remoteData) => {
      if (remoteData) {
        const { data: syncedData } = mergeCalendarBannerProjectSeed(remoteData);
        setData((prev) => ({
          ...prev,
          ...syncedData,
          members: Array.isArray(syncedData.members) ? syncedData.members : prev.members,
          notices: Array.isArray(syncedData.notices) ? syncedData.notices : prev.notices,
          transactions: Array.isArray(syncedData.transactions)
            ? syncedData.transactions
            : prev.transactions,
          projects: Array.isArray(syncedData.projects) ? syncedData.projects : prev.projects,
          advisors: Array.isArray(syncedData.advisors) ? syncedData.advisors : prev.advisors,
          donationRequests: Array.isArray(syncedData.donationRequests)
            ? syncedData.donationRequests
            : prev.donationRequests,
          memberApplications: Array.isArray(syncedData.memberApplications)
            ? syncedData.memberApplications
            : prev.memberApplications,
          backupHistory: Array.isArray(syncedData.backupHistory)
            ? syncedData.backupHistory
            : prev.backupHistory,
          backupSettings: syncedData.backupSettings
            ? { ...prev.backupSettings, ...syncedData.backupSettings }
            : prev.backupSettings,
          driveDocuments: Array.isArray(syncedData.driveDocuments)
            ? syncedData.driveDocuments
            : prev.driveDocuments,
        }));
        saveOrganizationData(syncedData);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Guard direct #admin hash navigation when user is not logged in as Admin
  useEffect(() => {
    const checkHashAccess = () => {
      if (window.location.hash === '#admin' && role !== 'admin') {
        setPermissionMessage(ADMIN_ONLY_MESSAGE);
        setView('user');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    checkHashAccess();
    window.addEventListener('hashchange', checkHashAccess);
    return () => window.removeEventListener('hashchange', checkHashAccess);
  }, [role]);

  // Listen to Firebase Auth state only when Admin is active (keeps firebase/auth out of initial bundle)
  useEffect(() => {
    if (role !== 'admin') return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void import('./services/googleAuth').then(({ initAuth }) => {
      if (!active) return;
      unsubscribe = initAuth(
        (user) => {
          setDriveConnected(true);
          setDriveEmail(user.email || user.displayName || null);
        },
        () => {
          setDriveConnected(false);
          setDriveEmail(null);
          setDriveFolder(null);
          setDriveDocumentsFolder(null);
        }
      );
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [role]);

  const requireAdminPermission = useCallback((): boolean => {
    if (role !== 'admin') {
      setPermissionMessage(ADMIN_ONLY_MESSAGE);
      setView('user');
      return false;
    }
    return true;
  }, [role]);

  const runDriveBackup = useCallback(
    async (
      targetData: OrganizationData,
      trigger: BackupTrigger,
      overrideToken?: string,
      overrideEmail?: string | null
    ) => {
      if (role !== 'admin') {
        setPermissionMessage(ADMIN_ONLY_MESSAGE);
        return;
      }
      const { clearCachedToken, getValidAccessToken } = await import('./services/googleAuth');
      const token = overrideToken || (await getValidAccessToken(true));
      if (!token) {
        setDriveConnected(false);
        return;
      }
      if (backupInFlightRef.current) return;

      backupInFlightRef.current = true;
      setIsBackingUp(true);
      setDriveError(null);

      const { DriveApiError, listFolderFiles, performFullDriveBackup } = await import(
        './services/googleDriveBackup'
      );

      try {
        const record = await performFullDriveBackup(
          token,
          targetData,
          trigger,
          overrideEmail ?? driveEmail ?? undefined
        );

        setLastBackupResult(record);
        setData((prev) => ({
          ...prev,
          backupSettings:
            trigger === 'scheduled'
              ? { ...prev.backupSettings, lastScheduledBackupAt: record.timestamp }
              : prev.backupSettings,
          backupHistory: [record, ...prev.backupHistory].slice(0, 25),
        }));

        try {
          const files = await listFolderFiles(token, record.folderId);
          setDriveFolder({
            id: record.folderId,
            name: 'আল আজহার ইসলামী সংস্থা - Backup',
            webViewLink: record.folderLink,
            files,
          });
        } catch {
          // Keep existing folder info if file refresh fails silently
        }

        setDriveToast({
          message: 'ব্যাকআপ সফলভাবে Google Drive এ আপলোড হয়েছে',
          dateTime: record.formattedDateTime,
          folderLink: record.folderLink,
          isError: false,
        });
        lastFailedTriggerRef.current = null;
      } catch (err) {
        lastFailedTriggerRef.current = trigger;
        if (err instanceof DriveApiError) {
          const needsReconnect =
            err.code === 'AUTH_EXPIRED' || err.code === 'INSUFFICIENT_SCOPES';
          if (err.code === 'AUTH_EXPIRED') {
            clearCachedToken();
            setDriveConnected(false);
            setDriveFolder(null);
          }
          setDriveError({
            message: err.message,
            isApiDisabled: err.code === 'API_DISABLED',
            needsReconnect,
          });
          setDriveToast({
            message: err.message,
            isError: true,
            canReconnect: needsReconnect,
          });
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'Google Drive-এ ব্যাকআপ আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
          setDriveError({ message, needsReconnect: true });
          setDriveToast({
            message,
            isError: true,
            canReconnect: true,
          });
        }
      } finally {
        setIsBackingUp(false);
        backupInFlightRef.current = false;
      }
    },
    [driveEmail, role]
  );

  // Scheduled Daily / Weekly / Monthly check when Admin Panel is active & Drive is connected
  useEffect(() => {
    if (role !== 'admin' || view !== 'admin' || !driveConnected) return;
    if (!data.backupSettings.scheduledEnabled) return;
    if (scheduledCheckedRef.current) return;

    const lastIso = data.backupSettings.lastScheduledBackupAt;
    const interval = FREQUENCY_MS[data.backupSettings.frequency];
    const isDue = !lastIso || Date.now() - new Date(lastIso).getTime() >= interval;

    if (isDue) {
      scheduledCheckedRef.current = true;
      void runDriveBackup(data, 'scheduled');
    }
  }, [role, view, driveConnected, data, runDriveBackup]);

  const handleRefreshDriveFolder = useCallback(async () => {
    if (!requireAdminPermission()) return;
    const { clearCachedToken, getValidAccessToken } = await import('./services/googleAuth');
    const token = await getValidAccessToken(true);
    if (!token) {
      setDriveConnected(false);
      setDriveFolder(null);
      setDriveDocumentsFolder(null);
      setDriveToast({
        message: 'Google Drive ফোল্ডার দেখতে প্রথমে "Connect Google Drive" করুন।',
        isError: true,
        canReconnect: true,
      });
      return;
    }

    setIsLoadingDriveFolder(true);
    setDriveError(null);
    const { connectAndLoadBackupFolder, DriveApiError } = await import(
      './services/googleDriveBackup'
    );
    try {
      const folderInfo = await connectAndLoadBackupFolder(token);
      setDriveFolder(folderInfo);
    } catch (err) {
      if (err instanceof DriveApiError) {
        const needsReconnect =
          err.code === 'AUTH_EXPIRED' || err.code === 'INSUFFICIENT_SCOPES';
        if (err.code === 'AUTH_EXPIRED') {
          clearCachedToken();
          setDriveConnected(false);
          setDriveFolder(null);
        }
        setDriveError({
          message: err.message,
          isApiDisabled: err.code === 'API_DISABLED',
          needsReconnect,
        });
        setDriveToast({
          message: err.message,
          isError: true,
          canReconnect: needsReconnect,
        });
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Google Drive ফোল্ডার লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
        setDriveError({ message });
      }
    } finally {
      setIsLoadingDriveFolder(false);
    }
  }, [requireAdminPermission]);

  const handleRefreshDocumentsFolder = useCallback(async () => {
    if (!requireAdminPermission()) return;
    const { clearCachedToken, getValidAccessToken } = await import('./services/googleAuth');
    const token = await getValidAccessToken(true);
    if (!token) {
      setDriveConnected(false);
      setDriveDocumentsFolder(null);
      setDriveToast({
        message: 'ডকুমেন্টস দেখতে প্রথমে "Connect Google Drive" করুন।',
        isError: true,
        canReconnect: true,
      });
      return;
    }

    setIsLoadingDocumentsFolder(true);
    setDriveError(null);
    const { connectAndLoadDocumentsFolder, DriveApiError } = await import(
      './services/googleDriveBackup'
    );
    try {
      const folderInfo = await connectAndLoadDocumentsFolder(token);
      setDriveDocumentsFolder(folderInfo);
    } catch (err) {
      if (err instanceof DriveApiError) {
        const needsReconnect =
          err.code === 'AUTH_EXPIRED' || err.code === 'INSUFFICIENT_SCOPES';
        if (err.code === 'AUTH_EXPIRED') {
          clearCachedToken();
          setDriveConnected(false);
          setDriveDocumentsFolder(null);
        }
        setDriveError({
          message: err.message,
          isApiDisabled: err.code === 'API_DISABLED',
          needsReconnect,
        });
      } else {
        setDriveError({
          message:
            err instanceof Error
              ? err.message
              : `"${DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডার লোড করা যায়নি।`,
        });
      }
    } finally {
      setIsLoadingDocumentsFolder(false);
    }
  }, [requireAdminPermission]);

  const handleConnectDrive = async () => {
    if (!requireAdminPermission()) return;
    setIsConnectingDrive(true);
    setIsLoadingDriveFolder(true);
    setIsLoadingDocumentsFolder(true);
    setDriveError(null);
    try {
      const [
        { clearCachedToken, googleSignIn, GoogleDriveAuthError },
        { connectAndLoadBackupFolder, connectAndLoadDocumentsFolder, DriveApiError },
      ] = await Promise.all([
        import('./services/googleAuth'),
        import('./services/googleDriveBackup'),
      ]);
      try {
        const { user, accessToken } = await googleSignIn();
        const email = user.email || user.displayName || null;
        setDriveConnected(true);
        setDriveEmail(email);

        let folderInfo: DriveFolderInfo | null = null;
        try {
          const [backupInfo, docsInfo] = await Promise.all([
            connectAndLoadBackupFolder(accessToken),
            connectAndLoadDocumentsFolder(accessToken),
          ]);
          folderInfo = backupInfo;
          setDriveFolder(backupInfo);
          setDriveDocumentsFolder(docsInfo);
        } catch (folderErr) {
          if (folderErr instanceof DriveApiError) {
            const needsReconnect =
              folderErr.code === 'AUTH_EXPIRED' || folderErr.code === 'INSUFFICIENT_SCOPES';
            if (folderErr.code === 'AUTH_EXPIRED') {
              clearCachedToken();
              setDriveConnected(false);
              setDriveFolder(null);
              setDriveDocumentsFolder(null);
            }
            setDriveError({
              message: folderErr.message,
              isApiDisabled: folderErr.code === 'API_DISABLED',
              needsReconnect,
            });
            setDriveToast({
              message: folderErr.message,
              isError: true,
              canReconnect: needsReconnect,
            });
            return;
          }
          throw folderErr;
        }

        setDriveToast({
          message: `Google Drive সফলভাবে সংযুক্ত হয়েছে (${email || 'Gmail'})`,
          folderLink: folderInfo?.webViewLink,
          isError: false,
        });

        if (data.backupSettings.scheduledEnabled) {
          const lastIso = data.backupSettings.lastScheduledBackupAt;
          const interval = FREQUENCY_MS[data.backupSettings.frequency];
          const isDue = !lastIso || Date.now() - new Date(lastIso).getTime() >= interval;
          if (isDue) {
            scheduledCheckedRef.current = true;
            await runDriveBackup(data, 'scheduled', accessToken, email);
          }
        }
      } catch (err) {
        const isDenied =
          err instanceof GoogleDriveAuthError &&
          (err.code === 'PERMISSION_DENIED' || err.code === 'POPUP_CLOSED');
        const message =
          err instanceof Error
            ? err.message
            : 'Google Drive সংযোগ বাতিল হয়েছে অথবা সম্পন্ন করা যায়নি।';
        setDriveError({ message, needsReconnect: !isDenied });
        setDriveToast({
          message,
          isError: true,
        });
      }
    } catch (importErr) {
      const message =
        importErr instanceof Error
          ? importErr.message
          : 'Google Drive মডিউল লোড করা যায়নি।';
      setDriveError({ message, needsReconnect: true });
      setDriveToast({ message, isError: true });
    } finally {
      setIsConnectingDrive(false);
      setIsLoadingDriveFolder(false);
      setIsLoadingDocumentsFolder(false);
    }
  };

  const handleReconnectDrive = async () => {
    if (!requireAdminPermission()) return;
    setIsConnectingDrive(true);
    setIsLoadingDriveFolder(true);
    setIsLoadingDocumentsFolder(true);
    setDriveError(null);
    setDriveToast(null);
    const [
      { clearCachedToken, reconnectGoogleDrive },
      { connectAndLoadBackupFolder, connectAndLoadDocumentsFolder, DriveApiError },
    ] = await Promise.all([
      import('./services/googleAuth'),
      import('./services/googleDriveBackup'),
    ]);
    try {
      const { user, accessToken } = await reconnectGoogleDrive();
      const email = user.email || user.displayName || null;
      setDriveConnected(true);
      setDriveEmail(email);

      const [folderInfo, docsInfo] = await Promise.all([
        connectAndLoadBackupFolder(accessToken),
        connectAndLoadDocumentsFolder(accessToken),
      ]);
      setDriveFolder(folderInfo);
      setDriveDocumentsFolder(docsInfo);

      if (lastFailedTriggerRef.current) {
        const retryTrigger = lastFailedTriggerRef.current;
        await runDriveBackup(data, retryTrigger, accessToken, email);
      } else {
        setDriveToast({
          message: `Google Drive পুনরায় সংযুক্ত হয়েছে (${email || 'Gmail'})`,
          folderLink: folderInfo.webViewLink,
          isError: false,
        });
      }
    } catch (err) {
      if (err instanceof DriveApiError) {
        const needsReconnect =
          err.code === 'AUTH_EXPIRED' || err.code === 'INSUFFICIENT_SCOPES';
        if (err.code === 'AUTH_EXPIRED') {
          clearCachedToken();
          setDriveConnected(false);
          setDriveFolder(null);
          setDriveDocumentsFolder(null);
        }
        setDriveError({
          message: err.message,
          isApiDisabled: err.code === 'API_DISABLED',
          needsReconnect,
        });
        setDriveToast({
          message: err.message,
          isError: true,
          canReconnect: needsReconnect,
        });
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Google Drive পুনরায় সংযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
        setDriveError({ message, needsReconnect: true });
        setDriveToast({
          message,
          isError: true,
          canReconnect: true,
        });
      }
    } finally {
      setIsConnectingDrive(false);
      setIsLoadingDriveFolder(false);
      setIsLoadingDocumentsFolder(false);
    }
  };

  const handleRefreshDriveToken = async () => {
    if (!requireAdminPermission()) return;
    const { refreshAccessTokenSilent, reconnectGoogleDrive } = await import(
      './services/googleAuth'
    );
    const silentToken = await refreshAccessTokenSilent();
    if (!silentToken) {
      const res = await reconnectGoogleDrive();
      setDriveEmail(res.user.email || res.user.displayName || driveEmail);
    }
    setDriveConnected(true);
    setDriveError(null);
  };

  const handleDisconnectDrive = async () => {
    if (!requireAdminPermission()) return;
    const { logoutGoogleDrive } = await import('./services/googleAuth');
    await logoutGoogleDrive();
    setDriveConnected(false);
    setDriveEmail(null);
    setDriveFolder(null);
    setDriveDocumentsFolder(null);
    setDriveError(null);
    setDriveToast({
      message: 'Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে।',
      isError: false,
    });
  };

  const handleUploadDriveDocuments = async (files: FileList) => {
    if (!requireAdminPermission()) return;
    const [{ getValidAccessToken }, { connectAndLoadDocumentsFolder, uploadDocumentToDrive }] =
      await Promise.all([
        import('./services/googleAuth'),
        import('./services/googleDriveBackup'),
      ]);
    const token = await getValidAccessToken(true);
    if (!token) {
      throw new Error('Google Drive সংযোগ সক্রিয় নেই। অনুগ্রহ করে আবার "Connect Google Drive" করুন।');
    }

    let folderId = driveDocumentsFolder?.id;
    for (const file of Array.from(files)) {
      const result = await uploadDocumentToDrive(token, file, folderId);
      folderId = result.folder.id;
    }

    const updatedFolder = await connectAndLoadDocumentsFolder(token);
    setDriveDocumentsFolder(updatedFolder);
  };

  const handleDownloadDriveDocument = async (file: DriveFolderFile) => {
    if (!requireAdminPermission()) return;
    const [{ getValidAccessToken }, { downloadDriveDocument }] = await Promise.all([
      import('./services/googleAuth'),
      import('./services/googleDriveBackup'),
    ]);
    const token = await getValidAccessToken(true);
    if (!token) {
      throw new Error('Google Drive সংযোগ সক্রিয় নেই। অনুগ্রহ করে আবার সংযোগ করুন।');
    }
    await downloadDriveDocument(token, file.id, file.name);
  };

  const handleDeleteDriveDocument = async (file: DriveFolderFile) => {
    if (!requireAdminPermission()) return;
    const [{ getValidAccessToken }, { deleteDriveDocument }] = await Promise.all([
      import('./services/googleAuth'),
      import('./services/googleDriveBackup'),
    ]);
    const token = await getValidAccessToken(true);
    if (!token) {
      throw new Error('Google Drive সংযোগ সক্রিয় নেই। অনুগ্রহ করে আবার সংযোগ করুন।');
    }
    await deleteDriveDocument(token, file.id);
    setDriveDocumentsFolder((prev) =>
      prev ? { ...prev, files: prev.files.filter((f) => f.id !== file.id) } : prev
    );
  };

  const handleCreateAndSaveShareLink = async (file: DriveFolderFile): Promise<string | null> => {
    if (!requireAdminPermission()) return null;
    const [{ getValidAccessToken }, { createShareableDriveLink }] = await Promise.all([
      import('./services/googleAuth'),
      import('./services/googleDriveBackup'),
    ]);
    const token = await getValidAccessToken(true);
    if (!token) {
      throw new Error('Google Drive সংযোগ সক্রিয় নেই। অনুগ্রহ করে আবার সংযোগ করুন।');
    }
    const { shareLink, downloadLink } = await createShareableDriveLink(token, file.id);
    const newRecord: SavedDriveDocument = {
      id: `doc-${file.id}`,
      driveFileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      shareLink,
      downloadLink,
      folderName: DRIVE_DOCUMENTS_FOLDER_NAME,
      savedAt: new Date().toISOString(),
      savedByEmail: driveEmail || undefined,
    };

    const existingList = data.driveDocuments || [];
    const nextDocs = [
      newRecord,
      ...existingList.filter((d) => d.driveFileId !== file.id),
    ];
    const nextData: OrganizationData = {
      ...data,
      driveDocuments: nextDocs,
    };
    setData(nextData);
    saveOrganizationData(nextData);
    await saveOrganizationDataToFirestore(nextData);
    return shareLink;
  };

  const handleRemoveSavedDriveDoc = (docRecord: SavedDriveDocument) => {
    if (!requireAdminPermission()) return;
    const nextData: OrganizationData = {
      ...data,
      driveDocuments: (data.driveDocuments || []).filter((d) => d.id !== docRecord.id),
    };
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);
  };

  const handleManualBackup = async () => {
    if (!requireAdminPermission()) return;
    const { getValidAccessToken } = await import('./services/googleAuth');
    const token = await getValidAccessToken(true);
    if (!driveConnected || !token) {
      setDriveToast({
        message: 'প্রথমে "Connect Google Drive" বাটনে ক্লিক করে Gmail অ্যাকাউন্ট সংযুক্ত করুন।',
        isError: true,
      });
      return;
    }
    await runDriveBackup(data, 'manual', token);
  };

  const handleMutateData = (
    updater: (prev: OrganizationData) => OrganizationData,
    actionDescription: string
  ) => {
    if (!requireAdminPermission()) return;

    const nextData = updater(data);
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);

    if (nextData.backupSettings.autoOnMutation) {
      if (driveConnected) {
        void import('./services/googleAuth').then(({ getAccessToken }) => {
          if (getAccessToken()) {
            void runDriveBackup(nextData, 'auto-save');
          } else {
            setDriveToast({
              message: `${actionDescription} সংরক্ষিত হয়েছে। অটো Drive ব্যাকআপের জন্য "Google Drive Connect" করুন।`,
              isError: true,
            });
          }
        });
      } else {
        setDriveToast({
          message: `${actionDescription} সংরক্ষিত হয়েছে। অটো Drive ব্যাকআপের জন্য "Google Drive Connect" করুন।`,
          isError: true,
        });
      }
    }
  };

  const handleUpdateBackupSettings = (nextSettings: AutoBackupSettings) => {
    if (!requireAdminPermission()) return;
    const nextData: OrganizationData = {
      ...data,
      backupSettings: nextSettings,
    };
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);
  };

  const handleUpdateLogo = (nextLogoUrl: string | undefined) => {
    if (!requireAdminPermission()) return;
    const nextData: OrganizationData = {
      ...data,
      logoUrl: nextLogoUrl,
    };
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);
  };

  const handleRestoreData = (restored: OrganizationData) => {
    if (!requireAdminPermission()) return;
    setData(restored);
    saveOrganizationData(restored);
    void saveOrganizationDataToFirestore(restored);
    if (restored.backupSettings.autoOnMutation && driveConnected) {
      void import('./services/googleAuth').then(({ getAccessToken }) => {
        if (getAccessToken()) {
          void runDriveBackup(restored, 'auto-save');
        }
      });
    }
  };

  const handleSubmitDonation = (
    req: Omit<DonationRequest, 'id' | 'submittedAt' | 'status'>
  ) => {
    const newReq: DonationRequest = {
      ...req,
      id: `don-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const nextData: OrganizationData = {
      ...data,
      donationRequests: [newReq, ...data.donationRequests],
    };
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);
  };

  const handleSubmitApplication = (
    app: Omit<MemberApplication, 'id' | 'submittedAt' | 'status'>
  ) => {
    const newApp: MemberApplication = {
      ...app,
      id: `app-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const nextData: OrganizationData = {
      ...data,
      memberApplications: [newApp, ...data.memberApplications],
    };
    setData(nextData);
    saveOrganizationData(nextData);
    void saveOrganizationDataToFirestore(nextData);
  };

  const adminFallback = (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">
      লোড হচ্ছে...
    </div>
  );

  if (view === 'login') {
    return (
      <Suspense fallback={adminFallback}>
        <AdminLoginPage
          logoUrl={data.logoUrl}
          onSuccess={() => {
            setIsAdminLoggedIn(true);
            setPermissionMessage(null);
            setAdminInitialTab('overview');
            setView('admin');
          }}
          onBack={() => setView('user')}
        />
      </Suspense>
    );
  }

  if (view === 'admin' && role === 'admin') {
    return (
      <Suspense fallback={adminFallback}>
        <AdminPanel
          data={data}
          initialTab={adminInitialTab}
          isDriveConnected={driveConnected}
          driveEmail={driveEmail}
          driveFolder={driveFolder}
          driveDocumentsFolder={driveDocumentsFolder}
          isLoadingDriveFolder={isLoadingDriveFolder}
          isLoadingDocumentsFolder={isLoadingDocumentsFolder}
          isConnectingDrive={isConnectingDrive}
          isBackingUp={isBackingUp}
          lastBackupResult={lastBackupResult}
          driveToast={driveToast}
          driveError={driveError}
          onDismissToast={() => setDriveToast(null)}
          onConnectDrive={handleConnectDrive}
          onReconnectDrive={handleReconnectDrive}
          onRefreshDriveToken={handleRefreshDriveToken}
          onDisconnectDrive={handleDisconnectDrive}
          onRefreshDriveFolder={handleRefreshDriveFolder}
          onRefreshDocumentsFolder={handleRefreshDocumentsFolder}
          onUploadDriveDocuments={handleUploadDriveDocuments}
          onDownloadDriveDocument={handleDownloadDriveDocument}
          onDeleteDriveDocument={handleDeleteDriveDocument}
          onCreateAndSaveShareLink={handleCreateAndSaveShareLink}
          onRemoveSavedDriveDoc={handleRemoveSavedDriveDoc}
          onManualBackup={handleManualBackup}
          onUpdateBackupSettings={handleUpdateBackupSettings}
          onUpdateLogo={handleUpdateLogo}
          onRestoreData={handleRestoreData}
          onMutateData={handleMutateData}
          onViewPublicPortal={() => setView('user')}
          onAdminLogout={() => {
            setIsAdminLoggedIn(false);
            setView('user');
          }}
        />
      </Suspense>
    );
  }

  return (
    <UserPortal
      data={data}
      role={role}
      permissionMessage={permissionMessage}
      onDismissPermissionMessage={() => setPermissionMessage(null)}
      onSubmitDonation={handleSubmitDonation}
      onSubmitApplication={handleSubmitApplication}
      onOpenAdmin={() => {
        if (role === 'admin') {
          setAdminInitialTab('overview');
          setView('admin');
        } else {
          setView('login');
        }
      }}
      onAdminQuickEdit={(tab) => {
        if (!requireAdminPermission()) return;
        setAdminInitialTab(tab);
        setView('admin');
      }}
    />
  );
}

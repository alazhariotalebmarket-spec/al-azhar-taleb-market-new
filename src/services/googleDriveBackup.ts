import {
  BackupRecord,
  BackupTrigger,
  DRIVE_BACKUP_FOLDER_NAME,
  DRIVE_DOCUMENTS_FOLDER_NAME,
  OrganizationData,
  UploadedDriveFile,
} from '../types';
import {
  clearCachedToken,
  getValidAccessToken,
  refreshAccessTokenSilent,
} from './googleAuth';

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export type DriveErrorCode =
  | 'AUTH_EXPIRED'
  | 'INSUFFICIENT_SCOPES'
  | 'API_DISABLED'
  | 'DRIVE_ERROR';

export class DriveApiError extends Error {
  code: DriveErrorCode;

  constructor(message: string, code: DriveErrorCode) {
    super(message);
    this.name = 'DriveApiError';
    this.code = code;
  }
}

async function parseDriveError(res: Response): Promise<DriveApiError> {
  let detail = '';
  let reason = '';
  try {
    const json = await res.json();
    detail = json?.error?.message || '';
    reason = json?.error?.errors?.[0]?.reason || '';
    const detailReason = json?.error?.details?.[0]?.reason || '';
    const combined = `${detail} ${reason} ${detailReason}`.toLowerCase();

    if (res.status === 401) {
      clearCachedToken();
      return new DriveApiError(
        'Google Drive সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে আবার অনুমতি দিন।',
        'AUTH_EXPIRED'
      );
    }

    if (res.status === 403) {
      if (
        reason === 'accessNotConfigured' ||
        combined.includes('has not been used in project') ||
        combined.includes('is disabled')
      ) {
        return new DriveApiError(
          'আপনার Google Cloud প্রজেক্টে Google Drive API v3 চালু নেই। অনুগ্রহ করে Google Cloud Console থেকে Google Drive API Enable করুন।',
          'API_DISABLED'
        );
      }

      if (
        reason === 'insufficientPermissions' ||
        combined.includes('insufficient') ||
        combined.includes('scope') ||
        combined.includes('permission')
      ) {
        return new DriveApiError(
          'Google Drive-এ কাজ করার প্রয়োজনীয় অনুমতি (drive.file Scope) পাওয়া যায়নি (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে অনুমতি প্রদান করুন।',
          'INSUFFICIENT_SCOPES'
        );
      }

      return new DriveApiError(
        'Google Drive-এ অ্যাক্সেস অনুমতি পাওয়া যায়নি (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে পুনরায় চেষ্টা করুন।',
        'INSUFFICIENT_SCOPES'
      );
    }

    if (res.status === 404) {
      return new DriveApiError(
        'Google Drive-এ নির্ধারিত ফোল্ডার বা ফাইল খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        'DRIVE_ERROR'
      );
    }

    if (res.status === 429) {
      return new DriveApiError(
        'Google Drive-এ অতিরিক্ত অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
        'DRIVE_ERROR'
      );
    }
  } catch {
    detail = res.statusText;
  }

  if (res.status === 401) {
    clearCachedToken();
    return new DriveApiError(
      'Google Drive সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করুন।',
      'AUTH_EXPIRED'
    );
  }

  if (res.status === 403) {
    return new DriveApiError(
      'Google Drive-এ আপলোড করার অনুমতি নেই (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে পুনরায় অনুমতি দিন।',
      'INSUFFICIENT_SCOPES'
    );
  }

  return new DriveApiError(
    `Google Drive অপারেশন ব্যর্থ হয়েছে (ত্রুটি ${res.status})${detail ? `: ${detail}` : '। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}`,
    'DRIVE_ERROR'
  );
}

/**
 * Executes a Drive API fetch with automatic silent token refresh on 401 or near-expiry.
 */
async function driveFetchWithRefresh(
  url: string,
  initialToken: string,
  init: RequestInit = {},
  networkErrorMsg = 'ইন্টারনেট সংযোগ বা Google Drive সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে নেটওয়ার্ক যাচাই করে আবার চেষ্টা করুন।'
): Promise<Response> {
  const tokenToUse = (await getValidAccessToken(true)) || initialToken;

  const doFetch = async (token: string): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    try {
      return await fetch(url, { ...init, headers });
    } catch {
      throw new DriveApiError(networkErrorMsg, 'DRIVE_ERROR');
    }
  };

  let res = await doFetch(tokenToUse);
  if (res.status === 401) {
    const refreshed = await refreshAccessTokenSilent();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }
  return res;
}

export async function findOrCreateFolderByName(
  accessToken: string,
  folderName: string
): Promise<{
  id: string;
  name: string;
  webViewLink: string;
}> {
  const escapedName = folderName.replace(/'/g, "\\'");
  const query = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `${DRIVE_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;

  const searchRes = await driveFetchWithRefresh(searchUrl, accessToken);
  if (!searchRes.ok) {
    throw await parseDriveError(searchRes);
  }

  const searchJson = (await searchRes.json()) as {
    files?: { id: string; name: string; webViewLink?: string }[];
  };

  if (searchJson.files && searchJson.files.length > 0) {
    const existing = searchJson.files[0];
    return {
      id: existing.id,
      name: existing.name,
      webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
    };
  }

  const createRes = await driveFetchWithRefresh(
    `${DRIVE_FILES_ENDPOINT}?fields=id,name,webViewLink`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    },
    'Google Drive ফোল্ডার তৈরি করার সময় নেটওয়ার্ক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
  );

  if (!createRes.ok) {
    throw await parseDriveError(createRes);
  }

  const created = (await createRes.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
  };

  return {
    id: created.id,
    name: created.name,
    webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
  };
}

export async function findOrCreateBackupFolder(accessToken: string) {
  return findOrCreateFolderByName(accessToken, DRIVE_BACKUP_FOLDER_NAME);
}

export async function findOrCreateDocumentsFolder(accessToken: string) {
  return findOrCreateFolderByName(accessToken, DRIVE_DOCUMENTS_FOLDER_NAME);
}

export interface DriveFolderFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink: string;
  sizeBytes?: number;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
  files: DriveFolderFile[];
}

export async function listFolderFiles(
  accessToken: string,
  folderId: string,
  pageSize = 50
): Promise<DriveFolderFile[]> {
  const query = `'${folderId}' in parents and trashed=false`;
  const url = `${DRIVE_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&pageSize=${pageSize}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)&spaces=drive`;

  const res = await driveFetchWithRefresh(
    url,
    accessToken,
    {},
    'Google Drive ফোল্ডারের ফাইল তালিকা লোড করা যাচ্ছে না। অনুগ্রহ করে ইন্টারনেট সংযোগ যাচাই করুন।'
  );

  if (!res.ok) {
    throw await parseDriveError(res);
  }

  const json = (await res.json()) as {
    files?: {
      id: string;
      name: string;
      mimeType?: string;
      size?: string;
      modifiedTime?: string;
      webViewLink?: string;
      webContentLink?: string;
      thumbnailLink?: string;
    }[];
  };

  return (json.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType || 'application/octet-stream',
    sizeBytes: f.size ? Number(f.size) : undefined,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    webContentLink: f.webContentLink,
    thumbnailLink: f.thumbnailLink,
  }));
}

export async function connectAndLoadBackupFolder(
  accessToken: string
): Promise<DriveFolderInfo> {
  const folder = await findOrCreateBackupFolder(accessToken);
  const files = await listFolderFiles(accessToken, folder.id, 20);
  return {
    ...folder,
    files,
  };
}

export async function connectAndLoadDocumentsFolder(
  accessToken: string
): Promise<DriveFolderInfo> {
  const folder = await findOrCreateDocumentsFolder(accessToken);
  const files = await listFolderFiles(accessToken, folder.id, 50);
  return {
    ...folder,
    files,
  };
}

async function uploadMultipartFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  blob: Blob
): Promise<DriveFolderFile> {
  const boundary = `al_azhar_drive_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const safeMime = mimeType || 'application/octet-stream';
  const metadataPart = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      metadataPart,
      `\r\n--${boundary}\r\nContent-Type: ${safeMime}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await driveFetchWithRefresh(
    `${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
    `ফাইল "${fileName}" আপলোডের সময় নেটওয়ার্ক সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`
  );

  if (!res.ok) {
    throw await parseDriveError(res);
  }

  const data = (await res.json()) as {
    id: string;
    name: string;
    mimeType?: string;
    size?: string;
    modifiedTime?: string;
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
  };

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType || safeMime,
    sizeBytes: data.size ? Number(data.size) : blob.size,
    modifiedTime: data.modifiedTime || new Date().toISOString(),
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    webContentLink: data.webContentLink,
    thumbnailLink: data.thumbnailLink,
  };
}

export async function uploadDocumentToDrive(
  accessToken: string,
  file: File,
  existingFolderId?: string
): Promise<{ folder: { id: string; name: string; webViewLink: string }; file: DriveFolderFile }> {
  const folder = existingFolderId
    ? {
        id: existingFolderId,
        name: DRIVE_DOCUMENTS_FOLDER_NAME,
        webViewLink: `https://drive.google.com/drive/folders/${existingFolderId}`,
      }
    : await findOrCreateDocumentsFolder(accessToken);

  const uploaded = await uploadMultipartFile(
    accessToken,
    folder.id,
    file.name,
    file.type || 'application/octet-stream',
    file
  );

  return { folder, file: uploaded };
}

export async function downloadDriveDocument(
  accessToken: string,
  fileId: string,
  fileName: string
): Promise<void> {
  const res = await driveFetchWithRefresh(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}?alt=media`,
    accessToken,
    {},
    `"${fileName}" ডাউনলোড করার সময় নেটওয়ার্ক ত্রুটি হয়েছে।`
  );

  if (!res.ok) {
    throw await parseDriveError(res);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteDriveDocument(accessToken: string, fileId: string): Promise<void> {
  const res = await driveFetchWithRefresh(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}`,
    accessToken,
    { method: 'DELETE' },
    'Google Drive থেকে ফাইল মুছে ফেলার সময় নেটওয়ার্ক ত্রুটি হয়েছে।'
  );

  if (!res.ok) {
    throw await parseDriveError(res);
  }
}

export async function createShareableDriveLink(
  accessToken: string,
  fileId: string
): Promise<{ shareLink: string; downloadLink?: string }> {
  // Grant read access to anyone with the link so shared URLs open cleanly across devices
  const permRes = await driveFetchWithRefresh(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}/permissions`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    },
    'শেয়ারযোগ্য লিংক তৈরির সময় নেটওয়ার্ক ত্রুটি হয়েছে।'
  );

  if (!permRes.ok) {
    throw await parseDriveError(permRes);
  }

  const fileRes = await driveFetchWithRefresh(
    `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(fileId)}?fields=id,webViewLink,webContentLink`,
    accessToken
  );

  if (!fileRes.ok) {
    throw await parseDriveError(fileRes);
  }

  const info = (await fileRes.json()) as {
    id: string;
    webViewLink?: string;
    webContentLink?: string;
  };

  return {
    shareLink: info.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    downloadLink: info.webContentLink,
  };
}

const TRIGGER_LABELS: Record<BackupTrigger, string> = {
  'auto-save': 'স্বয়ংক্রিয় ব্যাকআপ (ডেটা পরিবর্তন)',
  scheduled: 'নির্ধারিত অটো ব্যাকআপ',
  manual: 'ম্যানুয়াল ব্যাকআপ',
};

export async function performFullDriveBackup(
  accessToken: string,
  data: OrganizationData,
  trigger: BackupTrigger,
  accountEmail?: string
): Promise<BackupRecord> {
  const folder = await findOrCreateBackupFolder(accessToken);
  const { generateBackupBundle } = await import('./backupGenerators');
  const bundle = await generateBackupBundle(data);

  const uploadSpecs: {
    kind: UploadedDriveFile['kind'];
    file: { name: string; mimeType: string; blob: Blob };
  }[] = [
    { kind: 'members-pdf', file: bundle.membersPdf },
    { kind: 'members-xlsx', file: bundle.membersExcel },
    { kind: 'finance-pdf', file: bundle.financePdf },
    { kind: 'finance-xlsx', file: bundle.financeExcel },
    { kind: 'full-json', file: bundle.fullJson },
  ];

  const uploadedFiles: UploadedDriveFile[] = [];
  for (const spec of uploadSpecs) {
    const uploaded = await uploadMultipartFile(
      accessToken,
      folder.id,
      spec.file.name,
      spec.file.mimeType,
      spec.file.blob
    );
    uploadedFiles.push({
      id: uploaded.id,
      name: uploaded.name,
      kind: spec.kind,
      webViewLink: uploaded.webViewLink,
    });
  }

  return {
    id: `bkp-${Date.now()}`,
    timestamp: new Date().toISOString(),
    formattedDateTime: bundle.formattedDateTime,
    trigger,
    triggerLabel: TRIGGER_LABELS[trigger],
    folderId: folder.id,
    folderLink: folder.webViewLink,
    files: uploadedFiles,
    totalMembers: data.members.length,
    totalAdvisors: data.advisors.length,
    totalTransactions: data.transactions.length,
    accountEmail,
  };
}

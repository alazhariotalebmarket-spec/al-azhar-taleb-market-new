import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardDrive,
  Link2,
  RefreshCw,
  Share2,
  Trash2,
  Unplug,
  Upload,
} from 'lucide-react';
import {
  DRIVE_DOCUMENTS_FOLDER_NAME,
  OrganizationData,
  SavedDriveDocument,
} from '../types';
import type { DriveFolderFile, DriveFolderInfo } from '../services/googleDriveBackup';
import { copyTextToClipboard } from '../services/contactConfig';
import { ConfirmDialog } from './ConfirmDialog';

interface GoogleDriveDocumentsPanelProps {
  data: OrganizationData;
  isConnected: boolean;
  connectedEmail: string | null;
  documentsFolder: DriveFolderInfo | null;
  isLoadingFolder: boolean;
  isConnecting: boolean;
  driveError: { message: string; isApiDisabled?: boolean; needsReconnect?: boolean } | null;
  onConnectDrive: () => void;
  onReconnectDrive: () => void;
  onRefreshToken: () => Promise<void>;
  onDisconnectDrive: () => void;
  onRefreshDocumentsFolder: () => void;
  onUploadDocuments: (files: FileList) => Promise<void>;
  onDownloadDocument: (file: DriveFolderFile) => Promise<void>;
  onDeleteDocument: (file: DriveFolderFile) => Promise<void>;
  onCreateAndSaveShareLink: (file: DriveFolderFile) => Promise<string | null>;
  onRemoveSavedLink: (docRecord: SavedDriveDocument) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeBadge(mimeType: string, name: string): {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
} {
  const lower = `${mimeType} ${name}`.toLowerCase();
  if (lower.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/.test(lower)) {
    return {
      label: 'ছবি',
      icon: <FileImage className="h-4 w-4 text-blue-700" />,
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    };
  }
  if (lower.includes('pdf') || lower.endsWith('.pdf')) {
    return {
      label: 'PDF',
      icon: <FileText className="h-4 w-4 text-red-700" />,
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
    };
  }
  if (lower.includes('spreadsheet') || /\.(xlsx?|csv)$/.test(lower)) {
    return {
      label: 'শীট / Excel',
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-700" />,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  return {
    label: 'ডকুমেন্ট',
    icon: <FileText className="h-4 w-4 text-slate-700" />,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

export const GoogleDriveDocumentsPanel: React.FC<GoogleDriveDocumentsPanelProps> = ({
  data,
  isConnected,
  connectedEmail,
  documentsFolder,
  isLoadingFolder,
  isConnecting,
  driveError,
  onConnectDrive,
  onReconnectDrive,
  onRefreshToken,
  onDisconnectDrive,
  onRefreshDocumentsFolder,
  onUploadDocuments,
  onDownloadDocument,
  onDeleteDocument,
  onCreateAndSaveShareLink,
  onRemoveSavedLink,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [activeFileActionId, setActiveFileActionId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFolderFile | null>(null);
  const [confirmRemoveSavedDoc, setConfirmRemoveSavedDoc] = useState<SavedDriveDocument | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  const savedDocuments = data.driveDocuments || [];

  const showToast = (ok: boolean, message: string) => {
    setActionToast({ ok, message });
    setTimeout(() => setActionToast(null), 5000);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setActionToast(null);
    try {
      await onUploadDocuments(files);
      showToast(
        true,
        `${files.length}টি ফাইল সফলভাবে "${DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডারে আপলোড হয়েছে।`
      );
    } catch (err) {
      showToast(
        false,
        err instanceof Error
          ? err.message
          : 'ফাইল আপলোড সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: DriveFolderFile) => {
    setActiveFileActionId(file.id);
    try {
      await onDownloadDocument(file);
      showToast(true, `"${file.name}" ডাউনলোড শুরু হয়েছে।`);
    } catch (err) {
      showToast(
        false,
        err instanceof Error ? err.message : `"${file.name}" ডাউনলোড করা যায়নি।`
      );
    } finally {
      setActiveFileActionId(null);
    }
  };

  const handleShareAndSave = async (file: DriveFolderFile) => {
    setActiveFileActionId(file.id);
    try {
      const link = await onCreateAndSaveShareLink(file);
      if (link) {
        const copied = await copyTextToClipboard(link);
        setCopiedId(file.id);
        setTimeout(() => setCopiedId(null), 2500);
        showToast(
          true,
          copied
            ? `"${file.name}" এর শেয়ারযোগ্য লিংক কপি ও Firestore-এ সংরক্ষণ করা হয়েছে।`
            : `"${file.name}" এর শেয়ারযোগ্য লিংক Firestore-এ সংরক্ষণ করা হয়েছে।`
        );
      }
    } catch (err) {
      showToast(
        false,
        err instanceof Error ? err.message : 'শেয়ারযোগ্য লিংক তৈরি করা যায়নি।'
      );
    } finally {
      setActiveFileActionId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile) return;
    const target = confirmDeleteFile;
    setConfirmDeleteFile(null);
    setActiveFileActionId(target.id);
    try {
      await onDeleteDocument(target);
      showToast(true, `"${target.name}" Google Drive থেকে মুছে ফেলা হয়েছে।`);
    } catch (err) {
      showToast(
        false,
        err instanceof Error ? err.message : `"${target.name}" মুছে ফেলা যায়নি।`
      );
    } finally {
      setActiveFileActionId(null);
    }
  };

  const handleCopySavedLink = async (docItem: SavedDriveDocument) => {
    const ok = await copyTextToClipboard(docItem.shareLink);
    if (ok) {
      setCopiedId(docItem.id);
      setTimeout(() => setCopiedId(null), 2500);
      showToast(true, `লিংক কপি হয়েছে: ${docItem.name}`);
    }
  };

  const handleManualTokenRefresh = async () => {
    setIsRefreshingToken(true);
    try {
      await onRefreshToken();
      showToast(true, 'Google Drive অ্যাক্সেস টোকেন সফলভাবে রিফ্রেশ হয়েছে।');
    } catch (err) {
      showToast(
        false,
        err instanceof Error ? err.message : 'টোকেন রিফ্রেশ করা যায়নি। পুনরায় কানেক্ট করুন।'
      );
    } finally {
      setIsRefreshingToken(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Google Drive ডকুমেন্ট ম্যানেজার ({DRIVE_DOCUMENTS_FOLDER_NAME})
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            GIS OAuth 2.0 (drive.file) এর মাধ্যমে PDF, ছবি ও ডকুমেন্ট সরাসরি Google Drive-এ আপলোড, ডাউনলোড এবং শেয়ারযোগ্য লিংক Firestore-এ সংরক্ষণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            />
            {isConnected ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Not Connected)'}
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {actionToast && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
            actionToast.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {actionToast.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
          )}
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* Drive Auth / Permission Error Banner */}
      {driveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div className="space-y-1">
                <p className="font-semibold">{driveError.message}</p>
                {driveError.isApiDisabled && (
                  <p className="text-xs text-red-800">
                    Google Cloud Console-এ{' '}
                    <a
                      href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      Google Drive API v3 Enable করুন
                    </a>
                    ।
                  </p>
                )}
              </div>
            </div>
            {driveError.needsReconnect && (
              <button
                type="button"
                onClick={onReconnectDrive}
                disabled={isConnecting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60 shrink-0 self-start"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                পুনরায় কানেক্ট করুন
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection Control Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        {isConnected ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Google Drive সংযুক্ত · ফোল্ডার: {DRIVE_DOCUMENTS_FOLDER_NAME}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  অ্যাকাউন্ট:{' '}
                  <span className="font-semibold text-slate-900">
                    {connectedEmail || 'Google অ্যাকাউন্ট'}
                  </span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span>Scope: drive.file</span>
                  {documentsFolder && (
                    <>
                      <span className="mx-2 text-slate-300">·</span>
                      <span>মোট ফাইল: {documentsFolder.files.length}টি</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRefreshDocumentsFolder}
                disabled={isLoadingFolder}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFolder ? 'animate-spin' : ''}`} />
                রিফ্রেশ তালিকা
              </button>

              <button
                type="button"
                onClick={handleManualTokenRefresh}
                disabled={isRefreshingToken}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                টোকেন রিফ্রেশ
              </button>

              {documentsFolder && (
                <a
                  href={documentsFolder.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Drive ফোল্ডার খুলুন
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setConfirmDisconnect(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <Unplug className="h-3.5 w-3.5" />
                সংযোগ বিচ্ছিন্ন
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Google Drive সংযুক্ত করুন
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  অ্যাডমিনের Google অ্যাকাউন্ট দিয়ে অনুমতি দিলে "{DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডারে PDF, ছবি এবং ডকুমেন্ট আপলোড ও পরিচালনা করতে পারবেন।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onConnectDrive}
              disabled={isConnecting}
              className="gsi-material-button shrink-0 self-start sm:self-auto"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isConnecting ? 'সংযোগ হচ্ছে...' : 'Connect Google Drive'}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Upload Box + Drive Files List (Visible when Connected) */}
      {isConnected && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleFilesSelected(e.dataTransfer.files);
            }}
            className={`rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
              isDragging
                ? 'border-emerald-700 bg-emerald-50/80'
                : 'border-slate-300 bg-white hover:border-emerald-500'
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              {isUploading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-slate-900">
              {isUploading
                ? `"${DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডারে আপলোড হচ্ছে...`
                : `"${DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডারে ফাইল আপলোড করুন`}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              PDF, ছবি (JPG, PNG, WebP), বা ডকুমেন্ট (Word, Excel, PowerPoint, Text) ফাইল এখানে টেনে আনুন অথবা নিচের বাটনে ক্লিক করুন।
            </p>
            <div className="mt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900 transition-colors">
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'আপলোড হচ্ছে...' : 'ফাইল নির্বাচন ও আপলোড করুন'}</span>
                <input
                  type="file"
                  multiple
                  disabled={isUploading}
                  accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  onChange={(e) => {
                    void handleFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Live Google Drive Folder Files Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Google Drive-এ আপলোডকৃত ফাইল ({DRIVE_DOCUMENTS_FOLDER_NAME})
                </h3>
                <p className="text-xs text-slate-500">
                  প্রতিটি ফাইল ডাউনলোড, ডিলিট অথবা শেয়ারযোগ্য লিংক তৈরি করে Firestore-এ সেভ করতে পারবেন।
                </p>
              </div>
              <span className="font-mono-num text-xs font-semibold text-slate-600">
                মোট: {documentsFolder?.files.length || 0}টি ফাইল
              </span>
            </div>

            {isLoadingFolder && !documentsFolder ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                "{DRIVE_DOCUMENTS_FOLDER_NAME}" ফোল্ডারের ফাইল লোড হচ্ছে...
              </div>
            ) : !documentsFolder || documentsFolder.files.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                এই ফোল্ডারে এখনো কোনো ডকুমেন্ট আপলোড করা হয়নি। উপরের আপলোড বক্স থেকে PDF, ছবি বা ডকুমেন্ট আপলোড করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">ফাইলের নাম</th>
                      <th className="px-5 py-3">ধরন</th>
                      <th className="px-5 py-3">সাইজ</th>
                      <th className="px-5 py-3">তারিখ</th>
                      <th className="px-5 py-3 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentsFolder.files.map((file) => {
                      const typeInfo = getFileTypeBadge(file.mimeType, file.name);
                      const busy = activeFileActionId === file.id;
                      const isSavedInFirestore = savedDocuments.some(
                        (d) => d.driveFileId === file.id
                      );
                      return (
                        <tr key={file.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="shrink-0">{typeInfo.icon}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate max-w-[240px] sm:max-w-xs">
                                  {file.name}
                                </p>
                                {isSavedInFirestore && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                    <Link2 className="h-3 w-3" />
                                    Firestore-এ লিংক সংরক্ষিত
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${typeInfo.badgeClass}`}
                            >
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                            {formatFileSize(file.sizeBytes)}
                          </td>
                          <td className="px-5 py-3 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                            {file.modifiedTime ? file.modifiedTime.slice(0, 10) : '—'}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleShareAndSave(file)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                                title="শেয়ারযোগ্য লিংক কপি করুন এবং Firestore-এ সেভ করুন"
                              >
                                {copiedId === file.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                                ) : (
                                  <Share2 className="h-3.5 w-3.5 text-emerald-700" />
                                )}
                                {copiedId === file.id ? 'কপি ও সেভড!' : 'লিংক কপি ও সেভ'}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleDownload(file)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                title="ডাউনলোড করুন"
                              >
                                <Download className="h-3.5 w-3.5" />
                                ডাউনলোড
                              </button>
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                title="Drive-এ খুলুন"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setConfirmDeleteFile(file)}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="Drive থেকে ডিলিট করুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Shareable Drive Links in Firestore (Accessible across all devices) */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Firestore-এ সংরক্ষিত শেয়ারযোগ্য Drive লিংকসমূহ
            </h3>
            <p className="text-xs text-slate-500">
              কপি ও সংরক্ষিত ডকুমেন্ট লিংকসমূহ Firebase Firestore-এ স্থায়ীভাবে সেভ থাকে (যেকোনো ডিভাইস থেকে দেখা যাবে)।
            </p>
          </div>
          <span className="font-mono-num text-xs font-semibold text-slate-600">
            সংরক্ষিত: {savedDocuments.length}টি
          </span>
        </div>

        {savedDocuments.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            এখনো কোনো ফাইলের শেয়ারযোগ্য লিংক Firestore-এ সংরক্ষণ করা হয়নি। Google Drive সংযুক্ত করে যেকোনো ফাইলের পাশে থাকা{' '}
            <span className="font-semibold text-slate-800">"লিংক কপি ও সেভ"</span> বাটনে ক্লিক করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3">ডকুমেন্ট</th>
                  <th className="px-5 py-3">ফোল্ডার</th>
                  <th className="px-5 py-3">তারিখ</th>
                  <th className="px-5 py-3 text-right">লিংক ও অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedDocuments.map((docItem) => {
                  const typeInfo = getFileTypeBadge(docItem.mimeType, docItem.name);
                  return (
                    <tr key={docItem.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="shrink-0">{typeInfo.icon}</span>
                          <div>
                            <p className="font-medium text-slate-900">{docItem.name}</p>
                            <p className="font-mono-num text-[11px] text-slate-500 truncate max-w-xs">
                              {docItem.shareLink}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {docItem.folderName}
                      </td>
                      <td className="px-5 py-3 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                        {docItem.savedAt.slice(0, 10)}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleCopySavedLink(docItem)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {copiedId === docItem.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copiedId === docItem.id ? 'কপি হয়েছে' : 'লিংক কপি'}
                          </button>
                          <a
                            href={docItem.shareLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                          >
                            খুলুন
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveSavedDoc(docItem)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            title="Firestore তালিকা থেকে সরান"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmDisconnect}
        title="Google Drive সংযোগ বিচ্ছিন্ন করবেন?"
        description="সংযোগ বিচ্ছিন্ন করলে Drive-এ নতুন ফাইল আপলোড বা ডিলিট করা যাবে না, তবে আপনার Firebase লগইন এবং সংরক্ষিত লিংক অপরিবর্তিত থাকবে।"
        confirmLabel="সংযোগ বিচ্ছিন্ন করুন"
        onConfirm={() => {
          setConfirmDisconnect(false);
          onDisconnectDrive();
        }}
        onCancel={() => setConfirmDisconnect(false)}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteFile)}
        title="Google Drive থেকে ফাইল মুছে ফেলবেন?"
        description={`আপনি কি নিশ্চিতভাবে "${confirmDeleteFile?.name || ''}" ফাইলটি Google Drive (${DRIVE_DOCUMENTS_FOLDER_NAME}) থেকে স্থায়ীভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteFile(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmRemoveSavedDoc)}
        title="Firestore সংরক্ষিত লিংক মুছে ফেলবেন?"
        description={`আপনি কি নিশ্চিতভাবে "${confirmRemoveSavedDoc?.name || ''}" এর সংরক্ষিত লিংক তালিকা থেকে সরাতে চান? (এতে Google Drive-এর মূল ফাইল মুছবে না)`}
        confirmLabel="হ্যাঁ, সরান"
        onConfirm={() => {
          if (confirmRemoveSavedDoc) {
            onRemoveSavedLink(confirmRemoveSavedDoc);
            showToast(true, `"${confirmRemoveSavedDoc.name}" এর লিংক Firestore তালিকা থেকে সরানো হয়েছে।`);
          }
          setConfirmRemoveSavedDoc(null);
        }}
        onCancel={() => setConfirmRemoveSavedDoc(null)}
      />
    </div>
  );
};

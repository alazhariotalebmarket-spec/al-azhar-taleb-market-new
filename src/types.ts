import defaultLogoAsset from './assets/images/org_emblem_logo.webp';
import homeBannerAsset from './assets/images/home_hero_banner.webp';
import homeBannerMobileAsset from './assets/images/home_hero_banner_mobile.webp';

export const ORG_NAME = 'আল আজহার ইসলামী সংস্থা';
export const ORG_TAGLINE = 'শিক্ষা, সেবা, দাওয়াহ, ঐক্য';
export const DRIVE_BACKUP_FOLDER_NAME = 'আল আজহার ইসলামী সংস্থা - Backup';
export const DRIVE_DOCUMENTS_FOLDER_NAME = 'Al-Azhar-Documents';
export const DEFAULT_LOGO_URL = defaultLogoAsset;
export const HOME_BANNER_URL = homeBannerAsset;
export const HOME_BANNER_MOBILE_URL = homeBannerMobileAsset;

export type UserRole = 'admin' | 'user';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const MEMBER_DESIGNATIONS = [
  'সাধারণ সদস্য',
  'উপদেষ্টা',
  'কার্যকরী সদস্য',
] as const;
export type MemberDesignation = (typeof MEMBER_DESIGNATIONS)[number];

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
] as const;

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  fatherName: string;
  designation: string;
  phone: string;
  address: string;
  bloodGroup: BloodGroup | '';
  photoUrl?: string;
  monthlyFee: number;
  joinDate: string;
  status: 'সক্রিয়' | 'নিষ্ক্রিয়';
  // Year -> Month Index (0..11) -> Amount paid
  eyanotPayments?: Record<string, Record<number, number>>;
}

export interface Advisor {
  id: string;
  name: string;
  title: string;
  institution: string;
  phone: string;
  joinDate: string;
  note?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  receiptNo: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  displayDate?: string;
  category: string;
  content: string;
  important?: boolean;
}

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface AutoBackupSettings {
  autoOnMutation: boolean;
  scheduledEnabled: boolean;
  frequency: BackupFrequency;
  lastScheduledBackupAt: string | null;
}

export interface UploadedDriveFile {
  id: string;
  name: string;
  kind: 'members-pdf' | 'members-xlsx' | 'finance-pdf' | 'finance-xlsx' | 'full-json';
  webViewLink: string;
}

export type BackupTrigger = 'auto-save' | 'scheduled' | 'manual';

export interface BackupRecord {
  id: string;
  timestamp: string;
  formattedDateTime: string;
  trigger: BackupTrigger;
  triggerLabel: string;
  folderId: string;
  folderLink: string;
  files: UploadedDriveFile[];
  totalMembers: number;
  totalAdvisors: number;
  totalTransactions: number;
  accountEmail?: string;
}

export type WelfareProjectStatus = 'চলমান' | 'সম্পন্ন' | 'পরিকল্পিত';

export interface ProjectLedgerItem {
  name: string;
  amount: number;
}

export interface WelfareProject {
  id: string;
  title: string;
  category: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  beneficiaries: number;
  startDate: string;
  status: WelfareProjectStatus;
  incomeList?: ProjectLedgerItem[];
  expenseList?: ProjectLedgerItem[];
  note?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface DonationRequest {
  id: string;
  donorName: string;
  phone: string;
  category: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  note?: string;
  submittedAt: string;
  status: RequestStatus;
}

export interface MemberApplication {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  phone: string;
  bloodGroup: BloodGroup | '';
  desiredMonthlyFee: number;
  note?: string;
  submittedAt: string;
  status: RequestStatus;
}

export interface SavedDriveDocument {
  id: string;
  driveFileId: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  shareLink: string;
  downloadLink?: string;
  folderName: string;
  savedAt: string;
  savedByEmail?: string;
}

export interface OrganizationData {
  organization: string;
  logoUrl?: string;
  members: Member[];
  advisors: Advisor[];
  transactions: Transaction[];
  notices: Notice[];
  projects: WelfareProject[];
  donationRequests: DonationRequest[];
  memberApplications: MemberApplication[];
  backupSettings: AutoBackupSettings;
  backupHistory: BackupRecord[];
  driveDocuments?: SavedDriveDocument[];
  seededKeys?: string[];
}

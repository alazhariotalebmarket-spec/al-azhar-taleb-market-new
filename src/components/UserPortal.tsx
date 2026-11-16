import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  Copy,
  Download,
  Droplets,
  Eye,
  FileText,
  HeartHandshake,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  DEFAULT_LOGO_URL,
  DonationRequest,
  HOME_BANNER_MOBILE_URL,
  HOME_BANNER_URL,
  BENGALI_MONTHS,
  BLOOD_GROUPS,
  BloodGroup,
  MemberApplication,
  Notice,
  ORG_NAME,
  ORG_TAGLINE,
  OrganizationData,
  PortalSection,
  Transaction,
  UserRole,
} from '../types';
import { DonutChart } from './DonutChart';
import { OrgLogo } from './OrgLogo';
import { PieChart } from './PieChart';
import { ProjectCard } from './ProjectCard';
import { ORG_CONTACT, copyTextToClipboard } from '../services/contactConfig';
import {
  buildDonorPdfPayload,
  buildProjectPdfPayload,
  buildTransactionDonationPdfPayload,
  PdfPrintPayload,
} from '../services/donationProjectPdfGenerator';
const AdminEyanotSheet = lazy(() =>
  import('./AdminEyanotSheet').then((m) => ({ default: m.AdminEyanotSheet }))
);
const AboutSection = lazy(() =>
  import('./AboutSection').then((m) => ({ default: m.AboutSection }))
);
const ContactSection = lazy(() =>
  import('./ContactSection').then((m) => ({ default: m.ContactSection }))
);
const DonateSection = lazy(() =>
  import('./DonateSection').then((m) => ({ default: m.DonateSection }))
);
const MemberApplyModal = lazy(() =>
  import('./MemberApplyModal').then((m) => ({ default: m.MemberApplyModal }))
);
const MemberProfileModal = lazy(() =>
  import('./MemberProfileModal').then((m) => ({ default: m.MemberProfileModal }))
);
const MonthlyExpensePage = lazy(() =>
  import('./MonthlyExpensePage').then((m) => ({ default: m.MonthlyExpensePage }))
);
const ReceiptModal = lazy(() =>
  import('./ReceiptModal').then((m) => ({ default: m.ReceiptModal }))
);
const PdfPrintPreviewModal = lazy(() =>
  import('./PdfPrintPreviewModal').then((m) => ({ default: m.PdfPrintPreviewModal }))
);

const SectionFallback = (
  <div className="mx-auto max-w-6xl px-6 py-16 text-center text-sm font-medium text-slate-500">
    লোড হচ্ছে...
  </div>
);

type UserSection = PortalSection;

const VISITOR_LOCKED_SECTION_LABELS: Partial<Record<PortalSection, string>> = {
  eyanot: 'এয়ানত শীট',
  expenses: 'মাসিক ব্যয়',
  finance: 'আয়-ব্যয়',
};

interface UserPortalProps {
  data: OrganizationData;
  role: UserRole;
  activeSection: PortalSection;
  onSectionChange: (section: PortalSection) => void;
  permissionMessage: string | null;
  onDismissPermissionMessage: () => void;
  onSubmitDonation?: (req: Omit<DonationRequest, 'id' | 'submittedAt' | 'status'>) => void;
  onSubmitApplication?: (app: Omit<MemberApplication, 'id' | 'submittedAt' | 'status'>) => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onRequireLogin: (targetSection: PortalSection, sectionLabel: string) => void;
  onAdminQuickEdit?: (tab: 'members' | 'advisors' | 'finance' | 'notices' | 'projects' | 'eyanot' | 'expenses') => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  data,
  role,
  activeSection,
  onSectionChange,
  permissionMessage,
  onDismissPermissionMessage,
  onSubmitDonation,
  onSubmitApplication,
  onOpenAdmin,
  onLogout,
  onSwitchAccount,
  onRequireLogin,
  onAdminQuickEdit,
}) => {
  const section = activeSection;
  const [memberSearch, setMemberSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<'all' | BloodGroup>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [financeFilter, setFinanceFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeMonthFilter, setFinanceMonthFilter] = useState<string>('all');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [pdfPreviewPayload, setPdfPreviewPayload] = useState<PdfPrintPayload | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeCopiedMsg, setHomeCopiedMsg] = useState<string | null>(null);

  const isAdmin = role === 'admin';
  const isVisitor = role === 'visitor';
  const activeLogoSrc = data.logoUrl || DEFAULT_LOGO_URL;

  const setSection = (target: UserSection) => {
    const lockedLabel = VISITOR_LOCKED_SECTION_LABELS[target];
    if (role === 'visitor' && lockedLabel) {
      setMobileMenuOpen(false);
      onRequireLogin(target, lockedLabel);
      return;
    }
    onSectionChange(target);
  };

  const totalEyanotCollected = useMemo(() => {
    let sum = 0;
    data.members.forEach((m) => {
      const payments = m.eyanotPayments || {};
      Object.values(payments).forEach((yearObj) => {
        if (yearObj && typeof yearObj === 'object') {
          Object.values(yearObj).forEach((amt) => {
            sum += Number(amt) || 0;
          });
        }
      });
    });
    return sum;
  }, [data.members]);

  const selectedMember = useMemo(
    () => data.members.find((m) => m.id === selectedMemberId) || null,
    [data.members, selectedMemberId]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = now.getMonth();
    const currentMonthName = BENGALI_MONTHS[currentMonth];

    const activeList = (data.members || []).filter((m) => m.status === 'সক্রিয়');
    const activeMembers = activeList.length;
    const newMembers = (data.members || []).filter((m) => (m.joinDate || '').startsWith(currentYear)).length;

    const expectedThisMonth = activeList.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
    const collectedThisMonth = activeList.reduce(
      (sum, m) => sum + (m.eyanotPayments?.[currentYear]?.[currentMonth] || 0),
      0
    );
    const dueThisMonth = Math.max(0, expectedThisMonth - collectedThisMonth);

    const totalIncome = data.transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = data.transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      activeMembers,
      newMembers,
      totalMembers: data.members.length,
      totalAdvisors: data.advisors.length,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      currentMonthName,
      currentYear,
      expectedThisMonth,
      collectedThisMonth,
      dueThisMonth,
    };
  }, [data]);

  const orgFinanceSummary = useMemo(
    () => ({
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      netBalance: stats.netBalance,
    }),
    [stats.totalIncome, stats.totalExpense, stats.netBalance]
  );

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return data.members.filter((m) => {
      if (bloodGroupFilter !== 'all' && m.bloodGroup !== bloodGroupFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.fatherName || '').toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.bloodGroup || '').toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
      );
    });
  }, [data.members, memberSearch, bloodGroupFilter]);

  const memberIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    data.members.forEach((m, idx) => {
      map.set(m.id, idx + 1);
    });
    return map;
  }, [data.members]);

  const bloodGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg) => {
      counts[bg] = 0;
    });
    data.members.forEach((m) => {
      if (m.bloodGroup) {
        counts[m.bloodGroup] = (counts[m.bloodGroup] || 0) + 1;
      }
    });
    return counts;
  }, [data.members]);

  const financeMonthOptions = useMemo(() => {
    const months = new Set<string>();
    data.transactions.forEach((t) => {
      if (t.date.length >= 7) months.add(t.date.slice(0, 7));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [data.transactions]);

  const filteredTransactions = useMemo(() => {
    const q = financeSearch.trim().toLowerCase();
    return [...data.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => (financeFilter === 'all' ? true : t.type === financeFilter))
      .filter((t) => (financeMonthFilter === 'all' ? true : t.date.startsWith(financeMonthFilter)))
      .filter((t) => {
        if (!q) return true;
        return (
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.receiptNo.toLowerCase().includes(q)
        );
      });
  }, [data.transactions, financeFilter, financeMonthFilter, financeSearch]);

  const financeCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; type: 'income' | 'expense'; total: number }>();
    filteredTransactions.forEach((t) => {
      const key = `${t.type}::${t.category}`;
      const existing = map.get(key);
      if (existing) existing.total += t.amount;
      else map.set(key, { category: t.category, type: t.type, total: t.amount });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const handleDownloadFinanceReport = async (format: 'pdf' | 'xlsx') => {
    const { generateBackupBundle } = await import('../services/backupGenerators');
    const bundle = await generateBackupBundle(data);
    const target = format === 'pdf' ? bundle.financePdf : bundle.financeExcel;
    const url = URL.createObjectURL(target.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = target.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [downloadingNoticeId, setDownloadingNoticeId] = useState<string | null>(null);

  const handleDownloadNoticePdf = async (notice: Notice) => {
    try {
      setDownloadingNoticeId(notice.id);
      const { generateNoticePdfBlob } = await import('../services/noticePdfGenerator');
      const { blob, fileName } = await generateNoticePdfBlob(notice, data.logoUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate notice PDF:', err);
    } finally {
      setDownloadingNoticeId(null);
    }
  };

  const sortedNotices = useMemo(() => {
    return [...(data.notices || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [data.notices]);

  const projectsList = data.projects || [];

  const homeProjectsList = useMemo(() => {
    const hiddenIds = new Set(['p-1', 'p-2', 'p-3']);
    const hiddenTitles = new Set([
      'শীতবস্ত্র ও কম্বল বিতরণ প্রকল্প ২০২৬',
      'এতিম ও মেধাবী শিক্ষার্থী মাসিক বৃত্তি',
      'জরুরি খাদ্য ও চিকিৎসা সহায়তা তহবিল',
      'জরুরী খাদ্য ও চিকিৎসা সহায়তা তহবিল',
    ]);
    return projectsList.filter(
      (p) => !hiddenIds.has(p.id) && !hiddenTitles.has(p.title.trim())
    );
  }, [projectsList]);

  const visitorVisibleProjects = useMemo(() => {
    return homeProjectsList.filter(
      (p) => p.status === 'চলমান' || p.status === 'সম্পন্ন'
    );
  }, [homeProjectsList]);

  const ongoingProjectsCount = useMemo(
    () => homeProjectsList.filter((p) => p.status === 'চলমান').length,
    [homeProjectsList]
  );

  const completedProjectsCount = useMemo(
    () => homeProjectsList.filter((p) => p.status === 'সম্পন্ন').length,
    [homeProjectsList]
  );

  const projectFinanceStats = useMemo(() => {
    let totalProjectIncome = 0;
    let totalProjectExpense = 0;
    let totalProjectDonors = 0;

    homeProjectsList.forEach((p) => {
      const pIncome =
        p.incomeList && p.incomeList.length > 0
          ? p.incomeList.reduce((s, item) => s + (Number(item.amount) || 0), 0)
          : Number(p.raisedAmount) || 0;
      const pExpense =
        p.expenseList && p.expenseList.length > 0
          ? p.expenseList.reduce((s, item) => s + (Number(item.amount) || 0), 0)
          : 0;

      totalProjectIncome += pIncome;
      totalProjectExpense += pExpense;
      totalProjectDonors += p.incomeList?.length || 0;
    });

    return {
      totalProjectIncome,
      totalProjectExpense,
      totalProjectDonors,
      projectCount: homeProjectsList.length,
    };
  }, [homeProjectsList]);

  const navItems: { id: UserSection; label: string }[] = [
    { id: 'home', label: 'হোম' },
    { id: 'projects', label: 'প্রকল্প' },
    { id: 'members', label: 'সদস্যবৃন্দ' },
    { id: 'eyanot', label: 'এয়ানত শীট' },
    { id: 'expenses', label: 'মাসিক ব্যয়' },
    { id: 'advisors', label: 'উপদেষ্টা' },
    { id: 'finance', label: 'আয়-ব্যয়' },
    { id: 'notices', label: 'নোটিশ' },
    { id: 'about', label: 'আমাদের সম্পর্কে' },
    { id: 'contact', label: 'যোগাযোগ' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-35 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setSection('home');
              setMobileMenuOpen(false);
            }}
            className="flex min-w-0 items-center gap-2.5 text-left"
          >
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <span className="truncate font-display text-[15px] sm:text-lg font-bold tracking-tight text-slate-900">
              {ORG_NAME}
            </span>
          </button>

          {/* Zone 2: Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                  section === item.id
                    ? 'border-b-2 border-emerald-800 font-semibold text-emerald-900'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: CTA & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {role === 'visitor' ? (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 shadow-xs"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>লগইন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0 shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>লগআউট</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-slate-300 bg-white p-2.5 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-emerald-800" /> : <Menu className="h-5 w-5 text-emerald-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-xl space-y-3">
            <nav className="grid grid-cols-1 gap-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    section === item.id
                      ? 'bg-emerald-50 font-semibold text-emerald-900 border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowRight className={`h-4 w-4 ${section === item.id ? 'text-emerald-800' : 'text-slate-400'}`} />
                </button>
              ))}
            </nav>

            {role !== 'visitor' && (
              <div className="border-t border-slate-200 pt-3 grid grid-cols-1 gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-900"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-700" />
                      অ্যাডমিন প্যানেল
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-700" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-700" />
                    ভিজিটর হিসেবে দেখুন
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSwitchAccount();
                  }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-emerald-700" />
                    অ্যাকাউন্ট বদলান
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Logged-in User / Admin Session Bar (not shown to default Visitors) */}
      {role !== 'visitor' && (
        <div className="no-print border-b border-emerald-200 bg-emerald-50/90">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-950">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>
                {isAdmin
                  ? 'অ্যাডমিন প্যানেল সক্রিয় · সকল পেজ দেখা ও এডিট করার অনুমতি রয়েছে'
                  : 'ইউজার প্যানেল সক্রিয় · সকল হিসাব পেজ দেখতে পারবেন'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 font-semibold text-white hover:bg-emerald-900 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5" />
                  অ্যাডমিন প্যানেল
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                ভিজিটর হিসেবে দেখুন
              </button>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                অ্যাকাউন্ট বদলান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Guard Message (only shown if non-admin tries to trigger an edit/admin action) */}
      {permissionMessage && (
        <div className="mx-auto w-full max-w-6xl px-6 pt-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
              <span className="font-semibold">{permissionMessage}</span>
            </div>
            <button
              type="button"
              onClick={onDismissPermissionMessage}
              className="rounded p-1 text-amber-700 hover:bg-amber-100"
              aria-label="বন্ধ করুন"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {section === 'home' && (
          <div className="pb-10 sm:pb-14">
            {/* 1. Institutional Hero Banner */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-7">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-950/20 bg-emerald-950 shadow-sm">
                <img
                  src={HOME_BANNER_URL}
                  srcSet={`${HOME_BANNER_MOBILE_URL} 640w, ${HOME_BANNER_URL} 1080w`}
                  sizes="(max-width: 640px) 100vw, 1080px"
                  width={1080}
                  height={603}
                  alt={ORG_NAME}
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/82 to-emerald-950/75" />

                <div className="relative z-10 grid grid-cols-1 gap-6 p-5 sm:p-9 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-11">
                  {/* Hero Brand & Mission */}
                  <div className="lg:col-span-7 text-center lg:text-left">
                    <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-center">
                      <OrgLogo
                        src={activeLogoSrc}
                        alt={ORG_NAME}
                        variant="standard"
                        className="!h-16 !w-16 sm:!h-20 sm:!w-20 border-2 border-white/75 shadow-md"
                      />
                      <div>
                        <p className="text-sm font-semibold tracking-wide text-emerald-300">
                          {ORG_TAGLINE}
                        </p>
                        <h1 className="mt-1 font-display text-[26px] sm:text-4xl lg:text-[42px] font-bold leading-tight tracking-tight text-white text-balance">
                          {ORG_NAME}
                        </h1>
                      </div>
                    </div>

                    <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-[15px] sm:text-base leading-relaxed text-slate-200">
                      মানবকল্যাণ, দ্বীনি শিক্ষা প্রসার, এতিম সহায়তা ও স্বচ্ছ সামাজিক সেবায় নিবেদিত একটি অরাজনৈতিক ও অলাভজনক ইসলামী কল্যাণমূলক সংগঠন।
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => setSection(isVisitor ? 'projects' : 'finance')}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-white transition-colors hover:bg-emerald-500 shadow-xs whitespace-nowrap"
                      >
                        {isVisitor ? 'প্রকল্পসমূহ দেখুন' : 'আর্থিক স্বচ্ছতা দেখুন'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      {onSubmitApplication && (
                        <button
                          type="button"
                          onClick={() => setApplyModalOpen(true)}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/12 px-5 py-3 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap"
                        >
                          <UserPlus className="h-4 w-4" />
                          সদস্য হওয়ার আবেদন
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSection('about')}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-transparent px-5 py-3 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 whitespace-nowrap"
                      >
                        আমাদের সম্পর্কে
                      </button>
                    </div>
                  </div>

                  {/* Hero Quick Overview & Navigation Panel */}
                  <div className="lg:col-span-5">
                    {isVisitor ? (
                      <div className="rounded-xl border border-white/15 bg-slate-950/65 p-5 backdrop-blur-md text-white">
                        <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                          <span className="text-sm sm:text-xs font-semibold text-emerald-200">
                            সংগঠন ও কার্যক্রম চিত্র
                          </span>
                          <span className="font-mono-num text-xs text-slate-300">
                            {stats.currentMonthName} {stats.currentYear}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm sm:text-xs text-slate-300">নিবন্ধিত সদস্য ও কার্যক্রম</p>
                          <p className="mt-1 font-mono-num text-2xl sm:text-3xl font-bold text-white">
                            {stats.totalMembers} জন সদস্য
                          </p>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm sm:text-xs">
                          <div>
                            <dt className="text-slate-300">সক্রিয় সদস্য</dt>
                            <dd className="mt-0.5 font-mono-num text-base sm:text-sm font-bold text-emerald-300">
                              {stats.activeMembers} জন
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-300">উপদেষ্টা মণ্ডলী</dt>
                            <dd className="mt-0.5 font-mono-num text-base sm:text-sm font-bold text-white">
                              {stats.totalAdvisors} জন
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-300">চলমান প্রকল্প</dt>
                            <dd className="mt-0.5 font-mono-num text-base sm:text-sm font-bold text-blue-300">
                              {ongoingProjectsCount} টি
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-300">সম্পন্ন প্রকল্প</dt>
                            <dd className="mt-0.5 font-mono-num text-base sm:text-sm font-bold text-emerald-300">
                              {completedProjectsCount} টি
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-white/15 pt-3.5 text-sm sm:text-xs">
                          <button
                            type="button"
                            onClick={() => setSection('projects')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            প্রকল্পসমূহ →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('members')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            সদস্য ডিরেক্টরি →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('notices')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            নোটিশ বোর্ড →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('contact')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            যোগাযোগ ও অনুদান →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/15 bg-slate-950/65 p-5 backdrop-blur-md text-white">
                        <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                          <span className="text-sm sm:text-xs font-semibold text-emerald-200">
                            তাৎক্ষণিক সংগঠন চিত্র
                          </span>
                          <span className="font-mono-num text-xs text-slate-300">
                            {stats.currentMonthName} {stats.currentYear}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm sm:text-xs text-slate-300">বর্তমান মোট তহবিল (নেট স্থিতি)</p>
                          <p className="mt-1 font-mono-num text-2xl sm:text-3xl font-bold text-white">
                            ৳ {stats.netBalance.toLocaleString('en-US')}
                          </p>
                        </div>

                        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm sm:text-xs">
                          <div className="flex items-center justify-between sm:block">
                            <dt className="text-slate-300">মোট আয়</dt>
                            <dd className="sm:mt-0.5 font-mono-num text-base sm:text-sm font-bold text-emerald-300">
                              ৳ {stats.totalIncome.toLocaleString('en-US')}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between sm:block">
                            <dt className="text-slate-300">মোট ব্যয়</dt>
                            <dd className="sm:mt-0.5 font-mono-num text-base sm:text-sm font-bold text-rose-300">
                              ৳ {stats.totalExpense.toLocaleString('en-US')}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between sm:block">
                            <dt className="text-slate-300">নিবন্ধিত সদস্য</dt>
                            <dd className="sm:mt-0.5 font-mono-num text-base sm:text-sm font-bold text-white">
                              {stats.totalMembers} জন
                            </dd>
                          </div>
                          <div className="flex items-center justify-between sm:block">
                            <dt className="text-slate-300">উপদেষ্টা মণ্ডলী</dt>
                            <dd className="sm:mt-0.5 font-mono-num text-base sm:text-sm font-bold text-white">
                              {stats.totalAdvisors} জন
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-white/15 pt-3.5 text-sm sm:text-xs">
                          <button
                            type="button"
                            onClick={() => setSection('projects')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            প্রকল্পসমূহ →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('members')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            সদস্য ডিরেক্টরি →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('eyanot')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            এয়ানত শীট →
                          </button>
                          <button
                            type="button"
                            onClick={() => setSection('expenses')}
                            className="rounded-lg bg-white/12 px-3.5 py-2.5 sm:py-2 text-left font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            মাসিক ব্যয় →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Key Transparency Strip (Only visible to logged-in User / Admin) */}
            {!isVisitor && (
              <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl border border-slate-200 bg-slate-200 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSection('finance')}
                    className="bg-white p-5 text-left transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-xs font-medium text-slate-500">
                      <span>বর্তমান তহবিল</span>
                      <Wallet className="h-4 w-4 text-emerald-700 shrink-0" />
                    </div>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-slate-900">
                      ৳ {stats.netBalance.toLocaleString('en-US')}
                    </p>
                    <p className="mt-1.5 text-sm sm:text-xs font-semibold text-emerald-800">
                      বিস্তারিত হিসাব →
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('eyanot')}
                    className="bg-white p-5 text-left transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-xs font-medium text-slate-500">
                      <span>মোট আয় ও এয়ানত</span>
                      <HeartHandshake className="h-4 w-4 text-emerald-700 shrink-0" />
                    </div>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-emerald-800">
                      ৳ {stats.totalIncome.toLocaleString('en-US')}
                    </p>
                    <p className="mt-1.5 font-mono-num text-sm sm:text-xs text-slate-500">
                      এয়ানত: ৳ {totalEyanotCollected.toLocaleString('en-US')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('expenses')}
                    className="bg-white p-5 text-left transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-xs font-medium text-slate-500">
                      <span>মোট ব্যয়</span>
                      <ReceiptText className="h-4 w-4 text-rose-700 shrink-0" />
                    </div>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-rose-700">
                      ৳ {stats.totalExpense.toLocaleString('en-US')}
                    </p>
                    <p className="mt-1.5 text-sm sm:text-xs font-semibold text-slate-600">
                      মাসিক ব্যয়ের বিবরণ →
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('members')}
                    className="bg-white p-5 text-left transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm sm:text-xs font-medium text-slate-500">
                      <span>সক্রিয় সদস্যবৃন্দ</span>
                      <Users className="h-4 w-4 text-emerald-700 shrink-0" />
                    </div>
                    <p className="mt-1.5 font-mono-num text-2xl font-bold text-slate-900">
                      {stats.activeMembers} জন
                    </p>
                    <p className="mt-1.5 text-sm sm:text-xs text-slate-500">
                      মোট সদস্য {stats.totalMembers} · উপদেষ্টা {stats.totalAdvisors}
                    </p>
                  </button>
                </div>
              </section>
            )}

            {/* 3. Financial Charts (Logged-in) OR Public Mission Highlights (Visitor) + Official Donation Desk */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
                {isVisitor ? (
                  <div className="lg:col-span-7 min-w-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
                        <div className="min-w-0">
                          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                            আমাদের সেবামূলক কার্যক্রম ও সমাজকল্যাণ
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {ORG_NAME} · দ্বীনি শিক্ষা, দাওয়াহ ও মানবকল্যাণমূলক উদ্যোগ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSection('about')}
                          className="text-sm font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                        >
                          বিস্তারিত জানুন →
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="font-display text-sm font-bold text-slate-900">
                            দ্বীনি শিক্ষা ও দাওয়াহ
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            ইসলামী জ্ঞান বিস্তার, নামাজের স্থায়ী ক্যালেন্ডার ও সচেতনতামূলক দাওয়াহ কার্যক্রম পরিচালনা।
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="font-display text-sm font-bold text-slate-900">
                            এতিম ও দুস্থ সহায়তা
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            অসহায় পরিবার, এতিম শিক্ষার্থী ও জরুরি মানবিক প্রয়োজনে নিয়মিত সেবা প্রদান।
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="font-display text-sm font-bold text-slate-900">
                            জরুরি রক্তদান ডিরেক্টরি
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            সদস্যদের রক্তের গ্রুপ অনুযায়ী দ্রুত যোগাযোগ ও জরুরি রক্তদানে সহযোগিতা।
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <p className="font-display text-sm font-bold text-slate-900">
                            সদস্য ও উপদেষ্টা পরিষদ
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            বর্তমানে {stats.activeMembers} জন সক্রিয় সদস্য ও {stats.totalAdvisors} জন উপদেষ্টার সমন্বয়ে পরিচালিত।
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs">
                      <button
                        type="button"
                        onClick={() => setSection('projects')}
                        className="rounded-lg bg-emerald-800 px-3.5 py-2 font-semibold text-white hover:bg-emerald-900 transition-colors"
                      >
                        চলমান ও সম্পন্ন প্রকল্প দেখুন →
                      </button>
                      <button
                        type="button"
                        onClick={() => setSection('members')}
                        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        সদস্য তালিকা
                      </button>
                      <button
                        type="button"
                        onClick={() => setSection('advisors')}
                        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        উপদেষ্টা মণ্ডলী
                      </button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const incomeVal = stats.totalIncome;
                    const expenseVal = stats.totalExpense;
                    const eyanotVal = totalEyanotCollected;
                    const chartSegments = [
                      {
                        key: 'income',
                        label: 'মোট আয়',
                        value: incomeVal,
                        formattedValue: `৳ ${incomeVal.toLocaleString('en-US')}`,
                        color: '#16a34a',
                      },
                      {
                        key: 'expense',
                        label: 'মোট ব্যয়',
                        value: expenseVal,
                        formattedValue: `৳ ${expenseVal.toLocaleString('en-US')}`,
                        color: '#dc2626',
                      },
                      {
                        key: 'eyanot',
                        label: 'মাসিক এয়ানত',
                        value: eyanotVal,
                        formattedValue: `৳ ${eyanotVal.toLocaleString('en-US')}`,
                        color: '#2563eb',
                      },
                    ];

                    return (
                      <div className="lg:col-span-7 min-w-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
                          <div className="min-w-0">
                            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                              আর্থিক ও এয়ানত সারসংক্ষেপ
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {ORG_NAME} · রিয়েল-টাইম আয়, ব্যয় ও এয়ানত গ্রাফ
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSection('finance')}
                            className="text-sm font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                          >
                            বিস্তারিত হিসাব দেখুন →
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
                          <div className="md:col-span-7 min-w-0 flex items-center justify-center">
                            <DonutChart
                              centerLabel="বর্তমান তহবিল"
                              centerValue={`৳ ${stats.netBalance.toLocaleString('en-US')}`}
                              segments={chartSegments}
                              size="sm"
                              borderless={true}
                            />
                          </div>

                          {/* Separated by hairline divider instead of nested card */}
                          <div className="md:col-span-5 min-w-0 md:border-l md:border-slate-200 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex flex-col items-center gap-3">
                            <div className="text-center">
                              <h3 className="font-display text-sm font-bold leading-snug text-slate-900">
                                দান ও অন্যান্য প্রকল্প বাবদ আয় ও ব্যয়
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {projectFinanceStats.totalProjectDonors > 0
                                  ? `${projectFinanceStats.totalProjectDonors} জনের দান · প্রকল্প হিসাব`
                                  : 'প্রকল্প ও দান হিসাব'}
                              </p>
                            </div>

                            <PieChart
                              sizePx={104}
                              ariaLabel="দান ও অন্যান্য প্রকল্প বাবদ আয় ও ব্যয় পাই চার্ট"
                              segments={[
                                {
                                  key: 'project-income',
                                  label: 'প্রকল্প আয়',
                                  value: projectFinanceStats.totalProjectIncome,
                                  formattedValue: `৳ ${projectFinanceStats.totalProjectIncome.toLocaleString('en-US')}`,
                                  color: '#16a34a',
                                },
                                {
                                  key: 'project-expense',
                                  label: 'প্রকল্প ব্যয়',
                                  value: projectFinanceStats.totalProjectExpense,
                                  formattedValue: `৳ ${projectFinanceStats.totalProjectExpense.toLocaleString('en-US')}`,
                                  color: '#dc2626',
                                },
                              ]}
                            />

                            <button
                              type="button"
                              onClick={() => setSection('projects')}
                              className="text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                            >
                              প্রকল্প বিস্তারিত দেখুন →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Right (5 cols): Official Donation & Contact Card */}
                <div className="lg:col-span-5 min-w-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs font-semibold text-[#E2136E]">
                          অফিশিয়াল অনুদান · বিকাশ পার্সোনাল
                        </p>
                        <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900">
                          আল্লাহর রাস্তায় দান করুন
                        </h2>
                      </div>
                      <Phone className="h-5 w-5 text-[#E2136E] shrink-0" />
                    </div>

                    <p className="mt-4 text-[15px] sm:text-sm leading-relaxed text-slate-600">
                      আপনার যাকাত, সাদাকাহ ও কল্যাণমূলক অনুদান এতিম সহায়তা, দ্বীনি শিক্ষা ও মানবসেবায় সরাসরি ব্যয় করা হয়।
                    </p>

                    <div className="mt-5 rounded-xl border border-rose-200/80 bg-rose-50/50 p-4">
                      <p className="text-xs font-medium text-slate-600">
                        বিকাশ পার্সোনাল নাম্বার
                      </p>
                      <p className="mt-1 font-mono-num text-2xl sm:text-[26px] font-bold tracking-wide text-[#E2136E] break-all">
                        +8801810893388
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyTextToClipboard('+8801810893388');
                          if (ok) {
                            setHomeCopiedMsg('নাম্বার কপি হয়েছে: +8801810893388');
                            setTimeout(() => setHomeCopiedMsg(null), 3000);
                          }
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E2136E] px-4 py-3 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-white transition-colors hover:bg-[#c50f5e] shadow-xs whitespace-nowrap"
                      >
                        <Copy className="h-4 w-4" />
                        নাম্বার কপি
                      </button>
                      <a
                        href={ORG_CONTACT.phoneTelHref}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 sm:py-2.5 text-[15px] sm:text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      >
                        <Phone className="h-4 w-4 text-emerald-700" />
                        কল করুন
                      </a>
                    </div>

                    {homeCopiedMsg && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900">
                        <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span className="font-mono-num">{homeCopiedMsg}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      <span>
                        {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-slate-500">দান পাঠিয়ে আমাদের জানান, জাযাকাল্লাহু খাইরান</span>
                      <button
                        type="button"
                        onClick={() => setSection('contact')}
                        className="font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
                      >
                        অনুদান ফর্ম →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Latest Notices Editorial Feed */}
            {sortedNotices.length > 0 && (
              <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-900">সাম্প্রতিক নোটিশ</h2>
                    <p className="mt-1 text-[15px] sm:text-sm text-slate-600">
                      {ORG_NAME}-এর সর্বশেষ বিজ্ঞপ্তি ও কর্মসূচি
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('notices')}
                    className="py-1 text-[15px] sm:text-sm font-semibold text-emerald-800 hover:underline self-start sm:self-auto"
                  >
                    সব নোটিশ দেখুন →
                  </button>
                </div>

                <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  {sortedNotices.slice(0, 3).map((notice) => (
                    <article
                      key={notice.id}
                      className={`p-4 sm:p-6 transition-colors ${
                        notice.important ? 'bg-red-50/35' : 'bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {notice.important ? (
                              <span className="inline-flex items-center gap-1 font-bold text-red-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                জরুরী
                              </span>
                            ) : (
                              <Bell className="h-3.5 w-3.5 text-emerald-700" />
                            )}
                            <span
                              className={
                                notice.important
                                  ? 'font-semibold text-red-700'
                                  : 'font-semibold text-emerald-800'
                              }
                            >
                              {notice.category}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-mono-num font-medium text-slate-600">
                              {notice.displayDate || notice.date}
                            </span>
                          </div>

                          <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
                            {notice.title}
                          </h3>
                          <p className="mt-1.5 text-[15px] sm:text-sm leading-relaxed text-slate-600 max-w-3xl">
                            {notice.content}
                          </p>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDownloadNoticePdf(notice)}
                            disabled={downloadingNoticeId === notice.id}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 transition-colors shrink-0 self-start"
                            title="পিডিএফ ডাউনলোড করুন"
                          >
                            <Download className="h-3.5 w-3.5 text-emerald-700" />
                            <span>
                              {downloadingNoticeId === notice.id ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড করুন'}
                            </span>
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Live Welfare Projects Section */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    আমাদের প্রধান সেবামূলক প্রকল্প ও কার্যক্রম
                  </h2>
                  <p className="mt-1 text-[15px] sm:text-sm text-slate-600">
                    {ORG_NAME}-এর চলমান কল্যাণ ও শিক্ষামূলক প্রকল্পসমূহ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('projects')}
                  className="py-1 text-[15px] sm:text-sm font-semibold text-emerald-800 hover:underline self-start sm:self-auto"
                >
                  সব প্রকল্প দেখুন →
                </button>
              </div>

              {(() => {
                const displayedHomeProjects = isVisitor
                  ? visitorVisibleProjects
                  : homeProjectsList;
                return displayedHomeProjects.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                    {displayedHomeProjects.slice(0, 3).map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        variant="home"
                        hideFinancials={isVisitor}
                        canPrintPdf={isAdmin}
                        onPrintProject={
                          isAdmin
                            ? (p) => setPdfPreviewPayload(buildProjectPdfPayload(p, orgFinanceSummary))
                            : undefined
                        }
                        onPrintDonor={
                          isAdmin
                            ? (p, donor, idx) =>
                                setPdfPreviewPayload(
                                  buildDonorPdfPayload(p, donor, idx, orgFinanceSummary)
                                )
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-xs">
                    <p className="font-display text-base font-semibold text-slate-600">
                      শীঘ্রই নতুন প্রকল্প আসছে...
                    </p>
                  </div>
                );
              })()}
            </section>
          </div>
        )}

        {section === 'projects' && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  কল্যাণ প্রকল্প ও কর্মসূচি
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME}-এর চলমান ও সম্পন্ন মানবিক কার্যক্রম
                </p>
              </div>
              {isAdmin && onAdminQuickEdit && (
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('projects')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  প্রকল্প সম্পাদনা
                </button>
              )}
            </div>

            {(() => {
              const displayedPageProjects = isVisitor
                ? projectsList.filter((p) => p.status === 'চলমান' || p.status === 'সম্পন্ন')
                : projectsList;
              return displayedPageProjects.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {displayedPageProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      variant="page"
                      hideFinancials={isVisitor}
                      canPrintPdf={isAdmin}
                      onPrintProject={
                        isAdmin
                          ? (p) => setPdfPreviewPayload(buildProjectPdfPayload(p, orgFinanceSummary))
                          : undefined
                      }
                      onPrintDonor={
                        isAdmin
                          ? (p, donor, idx) =>
                              setPdfPreviewPayload(
                                buildDonorPdfPayload(p, donor, idx, orgFinanceSummary)
                              )
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <p className="font-display text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
                    বর্তমানে আমাদের হাতে কোনো চলমান প্রকল্প নেই। নতুন প্রকল্প শুরু হলে এখানে জানানো হবে।
                  </p>
                </div>
              );
            })()}

            <Suspense fallback={SectionFallback}>
              <DonateSection onSubmitDonation={onSubmitDonation} />
            </Suspense>
          </section>
        )}

        {section === 'members' && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  সদস্যবৃন্দ ও জরুরি রক্তদান ডিরেক্টরি
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME} · মোট সদস্য {data.members.length} জন
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="নাম, মোবাইল বা ব্লাড গ্রুপ খুঁজুন..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSection('eyanot')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  মাসিক এয়ানত শীট
                </button>

                {onSubmitApplication && (
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 whitespace-nowrap"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    সদস্য হওয়ার আবেদন
                  </button>
                )}

                {isAdmin && onAdminQuickEdit && (
                  <button
                    type="button"
                    onClick={() => onAdminQuickEdit('members')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    সদস্য সম্পাদনা
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Emergency Blood Donor Quick Filter Bar */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Droplets className="h-4 w-4 text-red-600" />
                  <span>জরুরি রক্তের প্রয়োজনে ব্লাড গ্রুপ অনুযায়ী খুঁজুন ও সরাসরি কল করুন</span>
                </div>
                <span className="font-mono-num text-xs text-slate-500">
                  ফলাফল: {filteredMembers.length} জন
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBloodGroupFilter('all')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    bloodGroupFilter === 'all'
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  সকল ({data.members.length})
                </button>
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroupFilter(bg)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono-num font-semibold transition-colors whitespace-nowrap ${
                      bloodGroupFilter === bg
                        ? 'border-red-700 bg-red-700 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {bg} ({bloodGroupCounts[bg] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Small Round Donut Chart on Members Page */}
            <div className="mt-6">
              <DonutChart
                size="sm"
                title="সদস্য ও উপদেষ্টা পরিসংখ্যান"
                subtitle="মোট সদস্য, নতুন সদস্য ও উপদেষ্টা পরিষদের অনুপাত"
                centerLabel="মোট সদস্য"
                centerValue={`${stats.totalMembers} জন`}
                segments={[
                  {
                    key: 'total-members',
                    label: 'মোট সদস্য',
                    value: stats.totalMembers,
                    formattedValue: `${stats.totalMembers} জন`,
                    color: '#16a34a',
                  },
                  {
                    key: 'new-members',
                    label: 'নতুন সদস্য',
                    value: stats.newMembers,
                    formattedValue: `${stats.newMembers} জন`,
                    color: '#2563eb',
                  },
                  {
                    key: 'advisors',
                    label: 'উপদেষ্টা',
                    value: stats.totalAdvisors,
                    formattedValue: `${stats.totalAdvisors} জন`,
                    color: '#d97706',
                  },
                ]}
              />
            </div>

            {/* Member Cards Grid with Round Photo/Logo, Father Name, Blood Group, Call & Profile View */}
            {filteredMembers.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member, idx) => {
                  const serialNo = memberIndexMap.get(member.id) || idx + 1;
                  return (
                  <div
                    key={`card-${member.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <OrgLogo
                            src={member.photoUrl || activeLogoSrc}
                            alt={member.name}
                            variant="standard"
                            isPhoto={Boolean(member.photoUrl)}
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate font-display text-base font-bold text-slate-900">
                              <span className="mr-1.5 font-mono-num text-xs font-bold text-emerald-800">
                                #{serialNo}
                              </span>
                              {member.name}
                            </h3>
                            <p className="truncate text-xs text-slate-600">
                              পিতা: {member.fatherName || 'উল্লেখ নেই'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {member.designation}
                              {member.bloodGroup ? ` · রক্ত: ${member.bloodGroup}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p className="truncate">{member.address}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-num">
                            মাসিক এয়ানত: <strong className="text-slate-900">৳ {member.monthlyFee.toLocaleString('en-US')}</strong>
                          </span>
                          <span
                            className={`font-semibold shrink-0 ${
                              member.status === 'সক্রিয়' ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">মোবাইল নেই</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        প্রোফাইল ও এয়ানত
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-4 py-3.5 text-center whitespace-nowrap">ক্রম</th>
                      <th className="px-6 py-3.5">সদস্য ও পিতার নাম</th>
                      <th className="px-6 py-3.5">সদস্য পদ</th>
                      <th className="px-6 py-3.5">ব্লাড গ্রুপ</th>
                      <th className="px-6 py-3.5">মোবাইল</th>
                      <th className="px-6 py-3.5 text-right">মাসিক এয়ানত</th>
                      <th className="px-6 py-3.5 text-right">বিস্তারিত</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 text-center font-mono-num text-xs font-bold text-slate-600 whitespace-nowrap">
                          {memberIndexMap.get(member.id) || idx + 1}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <OrgLogo
                              src={member.photoUrl || activeLogoSrc}
                              alt={member.name}
                              variant="compact"
                              isPhoto={Boolean(member.photoUrl)}
                              loading="lazy"
                            />
                            <div>
                              <div className="font-medium text-slate-900">{member.name}</div>
                              <div className="text-xs text-slate-500">
                                পিতা: {member.fatherName || 'উল্লেখ নেই'} · {member.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">{member.designation}</td>
                        <td className="px-6 py-3.5 font-mono-num font-semibold text-red-700 whitespace-nowrap">
                          {member.bloodGroup || '—'}
                        </td>
                        <td className="px-6 py-3.5 font-mono-num text-xs text-slate-700 whitespace-nowrap">
                          {member.phone ? (
                            <a
                              href={`tel:${member.phone}`}
                              className="inline-flex items-center gap-1 text-emerald-800 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                          ৳ {member.monthlyFee.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            প্রোফাইল দেখুন
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                          {data.members.length === 0
                            ? 'কোনো সদস্য যোগ করা হয়নি।'
                            : 'কোনো সদস্য পাওয়া যায়নি।'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {role === 'visitor' && VISITOR_LOCKED_SECTION_LABELS[section] && (
          <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900">লগইন করুন</h1>
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-900">
                  {VISITOR_LOCKED_SECTION_LABELS[section]}
                </span>{' '}
                দেখার জন্য অনুগ্রহ করে ইউজার অথবা অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।
              </p>
              <button
                type="button"
                onClick={() =>
                  onRequireLogin(
                    section,
                    VISITOR_LOCKED_SECTION_LABELS[section] || 'হিসাব পেজ'
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition-colors"
              >
                <Lock className="h-4 w-4" />
                লগইন করুন
              </button>
            </div>
          </section>
        )}

        {role !== 'visitor' && section === 'eyanot' && (
          <section className="mx-auto max-w-6xl px-6 py-10 space-y-5">
            {isAdmin && onAdminQuickEdit && (
              <div className="no-print flex justify-end">
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('eyanot')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  এয়ানত আদায় ও সম্পাদনা (অ্যাডমিন)
                </button>
              </div>
            )}
            <Suspense fallback={SectionFallback}>
              <AdminEyanotSheet
                members={data.members}
                logoUrl={data.logoUrl}
                isAdmin={false}
              />
            </Suspense>
          </section>
        )}

        {role !== 'visitor' && section === 'expenses' && (
          <section className="mx-auto max-w-6xl px-6 py-10 space-y-5">
            {isAdmin && onAdminQuickEdit && (
              <div className="no-print flex justify-end">
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('expenses')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  ব্যয় যোগ ও সম্পাদনা (অ্যাডমিন)
                </button>
              </div>
            )}
            <Suspense fallback={SectionFallback}>
              <MonthlyExpensePage
                transactions={data.transactions}
                isAdmin={false}
                onViewReceipt={(tx) => setReceiptTx(tx)}
              />
            </Suspense>
          </section>
        )}

        {section === 'advisors' && (
          <section className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">উপদেষ্টা পরিষদ</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME}-এর দিকনির্দেশনাকারী সম্মানিত উপদেষ্টামণ্ডলী
                </p>
              </div>
              {isAdmin && onAdminQuickEdit && (
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('advisors')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  উপদেষ্টা সম্পাদনা
                </button>
              )}
            </div>

            {data.advisors.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {data.advisors.map((advisor) => (
                  <div key={advisor.id} className="rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-xs font-semibold text-emerald-800">{advisor.title}</p>
                    <h2 className="mt-2 font-display text-lg font-bold text-slate-900">
                      {advisor.name}
                    </h2>
                    <p className="mt-1.5 flex items-start gap-2 text-sm text-slate-600">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>{advisor.institution}</span>
                    </p>
                    {advisor.note && (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
                        {advisor.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                কোনো উপদেষ্টা যোগ করা হয়নি।
              </div>
            )}
          </section>
        )}

        {role !== 'visitor' && section === 'finance' && (
          <section className="mx-auto max-w-6xl px-6 py-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  আয় ও ব্যয়ের স্বচ্ছ হিসাব
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME} · মোট আয় ৳ {stats.totalIncome.toLocaleString('en-US')} · মোট ব্যয় ৳{' '}
                  {stats.totalExpense.toLocaleString('en-US')} · তহবিল স্থিতি ৳{' '}
                  {stats.netBalance.toLocaleString('en-US')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSection('expenses')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  মাসিক ব্যয় পেজ
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFinanceReport('pdf')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF রিপোর্ট
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFinanceReport('xlsx')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel রিপোর্ট
                </button>
                {isAdmin && onAdminQuickEdit && (
                  <button
                    type="button"
                    onClick={() => onAdminQuickEdit('finance')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    আয়-ব্যয় সম্পাদনা
                  </button>
                )}
              </div>
            </div>

            {/* Search, Month & Type Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    placeholder="খাত, বিবরণ বা রসিদ নং খুঁজুন..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <select
                  aria-label="আর্থিক মাস ফিল্টার"
                  value={financeMonthFilter}
                  onChange={(e) => setFinanceMonthFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono-num text-slate-800 outline-none focus:border-emerald-700"
                >
                  <option value="all">সকল মাস</option>
                  {financeMonthOptions.map((ym) => (
                    <option key={ym} value={ym}>
                      {ym}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 self-start">
                {(
                  [
                    { id: 'all', label: 'সকল' },
                    { id: 'income', label: 'আয়' },
                    { id: 'expense', label: 'ব্যয়' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFinanceFilter(tab.id)}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      financeFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Breakdown Strip */}
            {financeCategoryBreakdown.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {financeCategoryBreakdown.slice(0, 4).map((item) => (
                  <div
                    key={`${item.type}-${item.category}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs text-slate-500 truncate">
                      {item.type === 'income' ? 'আয়' : 'ব্যয়'} · {item.category}
                    </p>
                    <p
                      className={`mt-1 font-mono-num text-lg font-bold ${
                        item.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      ৳ {item.total.toLocaleString('en-US')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3.5">তারিখ</th>
                      <th className="px-6 py-3.5">রসিদ নং</th>
                      <th className="px-6 py-3.5">ধরন</th>
                      <th className="px-6 py-3.5">খাত ও বিবরণ</th>
                      <th className="px-6 py-3.5 text-right">পরিমাণ (৳)</th>
                      <th className="px-6 py-3.5 text-right">রসিদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-6 py-3.5 font-mono-num text-xs font-medium text-slate-700 whitespace-nowrap">
                          {tx.receiptNo}
                        </td>
                        <td
                          className={`px-6 py-3.5 text-xs font-semibold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-slate-900">{tx.category}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span>{tx.description}</span>
                            {isAdmin && tx.type === 'income' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPdfPreviewPayload(
                                    buildTransactionDonationPdfPayload(tx, orgFinanceSummary)
                                  )
                                }
                                className="no-print inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100"
                                title="দাতার PDF / প্রিন্ট"
                              >
                                <FileText className="h-3 w-3 text-emerald-700" />
                                <span>PDF</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-3.5 text-right font-mono-num font-semibold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPdfPreviewPayload(
                                    buildTransactionDonationPdfPayload(tx, orgFinanceSummary)
                                  )
                                }
                                className="no-print inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                                title="PDF / প্রিন্ট করুন"
                              >
                                <Printer className="h-3.5 w-3.5 text-emerald-700" />
                                PDF / প্রিন্ট
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setReceiptTx(tx)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <ReceiptText className="h-3.5 w-3.5 text-emerald-700" />
                              রসিদ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          {data.transactions.length === 0
                            ? 'কোনো আর্থিক লেনদেন যোগ করা হয়নি।'
                            : 'কোনো লেনদেনের তথ্য পাওয়া যায়নি।'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {section === 'notices' && (
          <section className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">নোটিশ বোর্ড</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME}-এর সকল প্রাতিষ্ঠানিক ঘোষণা ও বিজ্ঞপ্তি
                </p>
              </div>
              {isAdmin && onAdminQuickEdit && (
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('notices')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  নোটিশ সম্পাদনা
                </button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {sortedNotices.map((notice) => (
                <article
                  key={notice.id}
                  className={`rounded-xl border p-6 ${
                    notice.important
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.important ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          জরুরী
                        </span>
                      ) : (
                        <Bell className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                      <span
                        className={
                          notice.important ? 'font-semibold text-red-700' : 'font-medium text-emerald-800'
                        }
                      >
                        {notice.category}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono-num font-medium text-slate-700">
                        {notice.displayDate || notice.date}
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDownloadNoticePdf(notice)}
                        disabled={downloadingNoticeId === notice.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 transition-colors shadow-2xs"
                        title="পিডিএফ ডাউনলোড করুন"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-700" />
                        <span>
                          {downloadingNoticeId === notice.id ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড করুন'}
                        </span>
                      </button>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-bold text-slate-900">
                    {notice.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{notice.content}</p>
                </article>
              ))}
              {sortedNotices.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  কোনো নোটিশ প্রকাশিত হয়নি।
                </div>
              )}
            </div>
          </section>
        )}

        {section === 'contact' && (
          <section className="mx-auto max-w-5xl px-6 py-10 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">যোগাযোগ</h1>
              <p className="mt-1 text-sm text-slate-600">
                {ORG_NAME}-এর কার্যালয়ের ঠিকানা, ফোন, বিকাশ ও ইমেইল তথ্য
              </p>
            </div>
            <Suspense fallback={SectionFallback}>
              <ContactSection />
              <DonateSection onSubmitDonation={onSubmitDonation} />
            </Suspense>
          </section>
        )}

        {section === 'about' && (
          <Suspense fallback={SectionFallback}>
            <AboutSection
              logoUrl={data.logoUrl}
              onNavigateHome={() => setSection('home')}
            />
          </Suspense>
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div className="flex items-center gap-3">
              <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" loading="lazy" />
              <div>
                <p className="font-display text-sm font-bold text-slate-900">{ORG_NAME}</p>
                <p className="text-xs text-slate-500">{ORG_TAGLINE}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 md:text-right">
              <p className="flex items-start gap-2 md:justify-end">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <span>
                  {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2}
                </span>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <a
                  href={ORG_CONTACT.phoneTelHref}
                  className="font-mono-num font-semibold text-slate-800 hover:text-emerald-800 hover:underline"
                >
                  {ORG_CONTACT.phoneDisplay}
                </a>
                <span className="text-slate-400">· বিকাশ (পার্সোনাল)</span>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <a
                  href={ORG_CONTACT.gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-num text-slate-700 hover:text-emerald-800 hover:underline"
                >
                  {ORG_CONTACT.email}
                </a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => setSection('home')} className="hover:text-slate-900">
                হোম
              </button>
              <button type="button" onClick={() => setSection('projects')} className="hover:text-slate-900">
                প্রকল্প
              </button>
              <button type="button" onClick={() => setSection('members')} className="hover:text-slate-900">
                সদস্যবৃন্দ
              </button>
              <button type="button" onClick={() => setSection('eyanot')} className="hover:text-slate-900">
                এয়ানত শীট
              </button>
              <button type="button" onClick={() => setSection('expenses')} className="hover:text-slate-900">
                মাসিক ব্যয়
              </button>
              <button type="button" onClick={() => setSection('advisors')} className="hover:text-slate-900">
                উপদেষ্টা
              </button>
              <button type="button" onClick={() => setSection('finance')} className="hover:text-slate-900">
                আয়-ব্যয়
              </button>
              <button type="button" onClick={() => setSection('notices')} className="hover:text-slate-900">
                নোটিশ
              </button>
              <button type="button" onClick={() => setSection('contact')} className="hover:text-slate-900">
                যোগাযোগ
              </button>
              <button type="button" onClick={() => setSection('about')} className="hover:text-slate-900">
                আমাদের সম্পর্কে
              </button>
              {role !== 'visitor' && (
                <>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="font-semibold text-emerald-800 hover:underline"
                    >
                      অ্যাডমিন প্যানেল
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="font-semibold text-slate-700 hover:text-emerald-800 hover:underline"
                  >
                    ভিজিটর হিসেবে দেখুন
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchAccount}
                    className="font-semibold text-slate-700 hover:text-emerald-800 hover:underline"
                  >
                    অ্যাকাউন্ট বদলান
                  </button>
                </>
              )}
            </div>
            <span>© {new Date().getFullYear()} {ORG_NAME}</span>
          </div>
        </div>
      </footer>

      {/* Read-Only Member Profile, 12-Month Eyanot & Printable ID Card View */}
      {selectedMember && (
        <Suspense fallback={null}>
          <MemberProfileModal
            member={selectedMember}
            isAdmin={false}
            orgLogoUrl={data.logoUrl}
            onClose={() => setSelectedMemberId(null)}
          />
        </Suspense>
      )}

      {/* Transaction Receipt / Voucher View */}
      {receiptTx && (
        <Suspense fallback={null}>
          <ReceiptModal
            transaction={receiptTx}
            orgLogoUrl={data.logoUrl}
            onClose={() => setReceiptTx(null)}
          />
        </Suspense>
      )}

      {/* Public Membership Application Modal */}
      {onSubmitApplication && applyModalOpen && (
        <Suspense fallback={null}>
          <MemberApplyModal
            open={applyModalOpen}
            onClose={() => setApplyModalOpen(false)}
            onSubmitApplication={onSubmitApplication}
          />
        </Suspense>
      )}

      {/* Admin-only PDF & Print Preview Modal */}
      {isAdmin && pdfPreviewPayload && (
        <Suspense fallback={null}>
          <PdfPrintPreviewModal
            payload={pdfPreviewPayload}
            orgLogoUrl={data.logoUrl}
            onClose={() => setPdfPreviewPayload(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

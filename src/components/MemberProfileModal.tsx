import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Droplets,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { BENGALI_MONTHS, Member, ORG_NAME, ORG_TAGLINE } from '../types';
import { ORG_CONTACT } from '../services/contactConfig';
import { buildEyanotSmsHref } from '../services/smsUtils';
import { ORG_WATERMARK_LOGO_FALLBACK } from '../services/watermarkUtils';
import { MemberAnnualEyanotPrintModal } from './MemberAnnualEyanotPrintModal';
import { OrgLogo } from './OrgLogo';

interface MemberProfileModalProps {
  member: Member | null;
  isAdmin: boolean;
  orgLogoUrl?: string;
  initialYear?: string;
  initialMonthIndex?: number;
  onClose: () => void;
  onToggleMonth?: (memberId: string, year: string, monthIndex: number) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isAdmin,
  orgLogoUrl,
  initialYear,
  initialMonthIndex,
  onClose,
  onToggleMonth,
}) => {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const defaultMonthIndex =
    typeof initialMonthIndex === 'number' ? initialMonthIndex : now.getMonth();

  const [selectedYear, setSelectedYear] = useState<string>(initialYear || currentYear);
  const [smsMonthIndex, setSmsMonthIndex] = useState<number>(defaultMonthIndex);
  const [modalTab, setModalTab] = useState<'profile' | 'idcard'>('profile');
  const [showAnnualPrint, setShowAnnualPrint] = useState(false);

  useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
    }
  }, [initialYear, member?.id]);

  useEffect(() => {
    if (typeof initialMonthIndex === 'number') {
      setSmsMonthIndex(initialMonthIndex);
    } else {
      setSmsMonthIndex(new Date().getMonth());
    }
  }, [initialMonthIndex, member?.id]);

  useEffect(() => {
    setShowAnnualPrint(false);
    setModalTab('profile');
  }, [member?.id]);

  useEffect(() => {
    if (!member || showAnnualPrint) return;
    document.body.classList.add('print-modal-active');
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [member, showAnnualPrint]);

  const yearOptions = useMemo(() => {
    const base = new Set<string>([
      String(Number(currentYear) - 1),
      currentYear,
      String(Number(currentYear) + 1),
    ]);
    if (initialYear) base.add(initialYear);
    if (member?.eyanotPayments) {
      Object.keys(member.eyanotPayments).forEach((y) => base.add(y));
    }
    return Array.from(base).sort((a, b) => Number(b) - Number(a));
  }, [currentYear, initialYear, member]);

  const yearStats = useMemo(() => {
    if (!member) {
      return {
        annualExpected: 0,
        paidTotal: 0,
        dueTotal: 0,
        paidCount: 0,
        monthMap: {} as Record<number, number>,
      };
    }
    const monthMap = member.eyanotPayments?.[selectedYear] || {};
    const monthlyExpected = Number(member.monthlyFee) || 0;
    let paidTotal = 0;
    let dueTotal = 0;
    let paidCount = 0;
    for (let i = 0; i < 12; i += 1) {
      const amt = Number(monthMap[i]) || 0;
      if (amt > 0) {
        paidTotal += amt;
        paidCount += 1;
      }
      dueTotal += Math.max(0, monthlyExpected - amt);
    }
    const annualExpected = monthlyExpected * 12;
    return { annualExpected, paidTotal, dueTotal, paidCount, monthMap };
  }, [member, selectedYear]);

  if (!member) return null;

  const activeLogoSrc = orgLogoUrl || ORG_WATERMARK_LOGO_FALLBACK;
  const avatarSrc = member.photoUrl || activeLogoSrc;
  const canEditEyanot = isAdmin && Boolean(onToggleMonth);
  const cleanPhone = (member.phone || '').replace(/[^\d+]/g, '');
  const smsPaidAmt = yearStats.monthMap[smsMonthIndex] || 0;
  const smsAmount = smsPaidAmt > 0 ? smsPaidAmt : member.monthlyFee;
  const smsMonthName = BENGALI_MONTHS[smsMonthIndex] || BENGALI_MONTHS[0];
  const smsHref = cleanPhone
    ? buildEyanotSmsHref(member.phone, member.name, smsMonthName, smsAmount)
    : undefined;

  const handlePrintClick = () => {
    if (modalTab === 'idcard') {
      window.print();
    } else {
      setShowAnnualPrint(true);
    }
  };

  return (
    <>
      {createPortal(
        <div
          className={`${
            showAnnualPrint ? 'no-print' : 'print-portal-root'
          } fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs`}
        >
          <div className="print-modal-card max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <OrgLogo
                  src={avatarSrc}
                  alt={member.name}
                  variant="standard"
                  isPhoto={Boolean(member.photoUrl)}
                />
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {member.designation}
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-mono-num font-semibold text-slate-800">
                      {member.memberCode}
                    </span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span
                      className={
                        member.status === 'সক্রিয়'
                          ? 'font-semibold text-emerald-700'
                          : 'text-slate-500'
                      }
                    >
                      {member.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setModalTab('profile')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      modalTab === 'profile'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    এয়ানত ও তথ্য
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('idcard')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      modalTab === 'idcard'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    আইডি কার্ড
                  </button>
                </div>

                {isAdmin &&
                  (smsHref ? (
                    <a
                      href={smsHref}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                      title={`${smsMonthName} মাসের এয়ানত নিশ্চিতকরণ SMS পাঠান`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS পাঠান
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed whitespace-nowrap"
                      title="সদস্যের মোবাইল নাম্বার দেওয়া নেই"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      SMS পাঠান
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={handlePrintClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" />
                  প্রিন্ট
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {modalTab === 'idcard' ? (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-emerald-800 bg-white shadow-md">
                  {/* Top Institutional Header Strip */}
                  <div className="bg-emerald-900 px-5 py-4 text-white flex items-center gap-3.5">
                    <OrgLogo
                      src={activeLogoSrc}
                      alt={ORG_NAME}
                      variant="compact"
                      className="border border-white/60 bg-white"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display text-base font-bold leading-tight">{ORG_NAME}</h4>
                      <p className="text-[11px] text-emerald-200">{ORG_TAGLINE}</p>
                    </div>
                  </div>

                  {/* ID Body */}
                  <div className="relative overflow-hidden p-5">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center"
                    >
                      <img
                        src={activeLogoSrc}
                        alt=""
                        className="w-[74%] max-w-[260px] aspect-square rounded-full object-contain opacity-[0.14] mix-blend-multiply"
                      />
                    </div>
                    <div className="relative z-10 space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <OrgLogo
                        src={avatarSrc}
                        alt={member.name}
                        variant="standard"
                        isPhoto={Boolean(member.photoUrl)}
                        className="border-2 border-emerald-700"
                      />
                      <h5 className="mt-3 font-display text-lg font-bold text-slate-900">
                        {member.name}
                      </h5>
                      <p className="text-xs font-semibold text-emerald-800">
                        {member.designation} ·{' '}
                        <span className="font-mono-num">{member.memberCode}</span>
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">পিতার নাম</span>
                        <span className="font-medium text-slate-900 text-right">
                          {member.fatherName || 'উল্লেখ নেই'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">ব্লাড গ্রুপ</span>
                        <span className="font-mono-num font-bold text-red-700">
                          {member.bloodGroup || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">মোবাইল</span>
                        <span className="font-mono-num font-semibold text-slate-900">
                          {member.phone || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">ঠিকানা</span>
                        <span className="font-medium text-slate-900 text-right">
                          {member.address || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">যোগদানের তারিখ</span>
                        <span className="font-mono-num text-slate-900">{member.joinDate}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
                      কার্যালয়: {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2} ·{' '}
                      {ORG_CONTACT.phoneDisplay}
                    </div>
                    </div>
                  </div>
                </div>

                <div className="no-print flex justify-center">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    <Printer className="h-4 w-4" />
                    আইডি কার্ড প্রিন্ট করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden p-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center"
                >
                  <img
                    src={activeLogoSrc}
                    alt=""
                    className="w-[72%] max-w-[440px] aspect-square rounded-full object-contain opacity-[0.14] mix-blend-multiply"
                  />
                </div>
                <div className="relative z-10 space-y-6">
                {/* Personal Details */}
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 text-sm">
                  <div className="flex items-start gap-2.5">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                    <div>
                      <p className="text-xs text-slate-500">পিতার নাম</p>
                      <p className="font-medium text-slate-900">
                        {member.fatherName || 'উল্লেখ নেই'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs text-slate-500">ব্লাড গ্রুপ</p>
                      <p className="font-mono-num font-semibold text-slate-900">
                        {member.bloodGroup || 'উল্লেখ নেই'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                    <div>
                      <p className="text-xs text-slate-500">ঠিকানা / গ্রাম</p>
                      <p className="font-medium text-slate-900">
                        {member.address || 'উল্লেখ নেই'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                    <div>
                      <p className="text-xs text-slate-500">যোগদানের তারিখ</p>
                      <p className="font-mono-num font-medium text-slate-900">{member.joinDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:col-span-2 border-t border-slate-200/80 pt-3 mt-1">
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-emerald-800" />
                      <div>
                        <p className="text-xs text-slate-500">মোবাইল নাম্বার</p>
                        <p className="font-mono-num font-semibold text-slate-900">
                          {member.phone || 'নেই'}
                        </p>
                      </div>
                    </div>
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="no-print inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        কল করুন
                      </a>
                    )}
                  </div>
                </div>

                {/* Monthly Eyanot 3 Stat Cards */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h4 className="font-display text-base font-bold text-slate-900">
                      মাসিক এয়ানত হিসাব ({selectedYear})
                    </h4>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="eyanot-year-select"
                        className="text-xs font-medium text-slate-600"
                      >
                        বছর:
                      </label>
                      <select
                        id="eyanot-year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 font-mono-num"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">নির্ধারিত মাসিক এয়ানত</p>
                      <p className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
                        ৳ {member.monthlyFee.toLocaleString('en-US')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 font-mono-num">
                        বার্ষিক মোট: ৳ {yearStats.annualExpected.toLocaleString('en-US')}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-xs font-medium text-emerald-900">এই বছর মোট দিয়েছে</p>
                      <p className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
                        ৳ {yearStats.paidTotal.toLocaleString('en-US')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-emerald-800 font-mono-num">
                        {yearStats.paidCount} / 12 মাস পরিশোধিত
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
                      <p className="text-xs font-medium text-red-900">এই বছর মোট বাকি</p>
                      <p className="mt-1.5 font-mono-num text-xl font-bold text-red-700">
                        ৳ {yearStats.dueTotal.toLocaleString('en-US')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-red-800 font-mono-num">
                        {12 - yearStats.paidCount} মাস বাকি
                      </p>
                    </div>
                  </div>
                </div>

                {/* Month-by-Month 12-Month Breakdown Table */}
                <div>
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">
                      মাস অনুযায়ী এয়ানত তালিকা (জানুয়ারি – ডিসেম্বর {selectedYear})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {canEditEyanot
                        ? 'অ্যাডমিন চাইলে পাশে ক্লিক করে এয়ানত আদায় বা বাতিল করতে পারবেন'
                        : 'শুধুমাত্র দেখার ও প্রিন্ট করার জন্য'}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                            <th className="px-4 py-2.5">মাস</th>
                            <th className="px-4 py-2.5 text-right">দেওয়ার কথা</th>
                            <th className="px-4 py-2.5 text-right">দিয়েছে</th>
                            <th className="px-4 py-2.5 text-right">বাকি</th>
                            <th className="px-4 py-2.5 text-right">
                              {canEditEyanot ? 'আদায় / অবস্থা' : 'অবস্থা'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {BENGALI_MONTHS.map((monthName, monthIndex) => {
                            const paidAmt = yearStats.monthMap[monthIndex] || 0;
                            const dueAmt = Math.max(0, (member.monthlyFee || 0) - paidAmt);
                            const isPaid = paidAmt > 0;

                            return (
                              <tr key={monthName} className="hover:bg-slate-50/70">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">
                                  {monthName}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num text-slate-600 whitespace-nowrap">
                                  ৳ {member.monthlyFee.toLocaleString('en-US')}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num font-semibold text-emerald-700 whitespace-nowrap">
                                  ৳ {paidAmt.toLocaleString('en-US')}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono-num font-semibold text-red-700 whitespace-nowrap">
                                  ৳ {dueAmt.toLocaleString('en-US')}
                                </td>
                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                  {canEditEyanot && onToggleMonth ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSmsMonthIndex(monthIndex);
                                        onToggleMonth(member.id, selectedYear, monthIndex);
                                      }}
                                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        isPaid
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                      }`}
                                    >
                                      {isPaid ? (
                                        <>
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                          <span className="font-mono-num">
                                            ৳ {paidAmt.toLocaleString('en-US')}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                                          <span>বাকি</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                        isPaid ? 'text-emerald-700' : 'text-red-700'
                                      }`}
                                    >
                                      {isPaid ? (
                                        <>
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                          <span className="font-mono-num">
                                            ৳ {paidAmt.toLocaleString('en-US')}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                                          <span>বাকি</span>
                                        </>
                                      )}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {showAnnualPrint && (
        <MemberAnnualEyanotPrintModal
          member={member}
          year={selectedYear}
          orgLogoUrl={orgLogoUrl}
          autoPrint={true}
          onClose={() => setShowAnnualPrint(false)}
        />
      )}
    </>
  );
};

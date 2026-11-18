import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { BENGALI_MONTHS, Member, ORG_NAME, ORG_TAGLINE } from '../types';
import { ORG_CONTACT } from '../services/contactConfig';
import { ORG_WATERMARK_LOGO_FALLBACK } from '../services/watermarkUtils';
import { OrgLogo } from './OrgLogo';

interface MemberAnnualEyanotPrintModalProps {
  member: Member | null;
  year: string;
  orgLogoUrl?: string;
  autoPrint?: boolean;
  onClose: () => void;
}

export const MemberAnnualEyanotPrintModal: React.FC<MemberAnnualEyanotPrintModalProps> = ({
  member,
  year,
  orgLogoUrl,
  autoPrint = false,
  onClose,
}) => {
  useEffect(() => {
    if (!member) return;
    document.body.classList.add('print-modal-active');

    let timer: number | undefined;
    if (autoPrint) {
      timer = window.setTimeout(() => {
        window.print();
      }, 150);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      document.body.classList.remove('print-modal-active');
    };
  }, [member, year, autoPrint]);

  const reportData = useMemo(() => {
    if (!member) {
      return {
        rows: [] as {
          monthName: string;
          expected: number;
          paid: number;
          due: number;
          statusLabel: 'পরিশোধিত' | 'আংশিক' | 'বাকি';
        }[],
        annualExpected: 0,
        totalPaid: 0,
        totalDue: 0,
        paidMonthsCount: 0,
      };
    }

    const monthMap = member.eyanotPayments?.[year] || {};
    const monthlyExpected = Number(member.monthlyFee) || 0;
    let totalPaid = 0;
    let totalDue = 0;
    let paidMonthsCount = 0;

    const rows = BENGALI_MONTHS.map((monthName, idx) => {
      const paid = Number(monthMap[idx]) || 0;
      const due = Math.max(0, monthlyExpected - paid);
      totalDue += due;
      if (paid > 0) {
        totalPaid += paid;
        paidMonthsCount += 1;
      }
      let statusLabel: 'পরিশোধিত' | 'আংশিক' | 'বাকি' = 'বাকি';
      if (paid >= monthlyExpected && monthlyExpected > 0) {
        statusLabel = 'পরিশোধিত';
      } else if (paid > 0) {
        statusLabel = 'আংশিক';
      }

      return {
        monthName,
        expected: monthlyExpected,
        paid,
        due,
        statusLabel,
      };
    });

    const annualExpected = monthlyExpected * 12;

    return {
      rows,
      annualExpected,
      totalPaid,
      totalDue,
      paidMonthsCount,
    };
  }, [member, year]);

  if (!member) return null;

  const activeLogoSrc = orgLogoUrl || ORG_WATERMARK_LOGO_FALLBACK;
  const memberPhotoSrc = member.photoUrl || activeLogoSrc;

  return createPortal(
    <div className="print-portal-root fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="print-modal-card max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Non-printable Action Bar */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              সদস্যের বাৎসরিক এয়ানত রিপোর্ট ({year})
            </h3>
            <p className="text-xs text-slate-500">
              {member.name} · {member.memberCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              প্রিন্ট করুন
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
              aria-label="বন্ধ করুন"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Single-Member Annual Eyanot Report */}
        <div className="relative overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Centered Transparent Organization Logo Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <img
              src={activeLogoSrc}
              alt=""
              className="h-72 w-72 sm:h-88 sm:w-88 rounded-full object-contain opacity-[0.09] mix-blend-multiply"
            />
          </div>
          {/* Organization Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold text-slate-900">{ORG_NAME}</h2>
                <p className="text-xs font-medium text-emerald-800">{ORG_TAGLINE}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2} · {ORG_CONTACT.phoneDisplay}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-sm font-bold text-slate-900">
                বাৎসরিক এয়ানত রিপোর্ট
              </p>
              <p className="font-mono-num text-xs font-semibold text-emerald-800">
                নির্বাচিত বছর: {year}
              </p>
            </div>
          </div>

          {/* Member Details Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <OrgLogo
                src={memberPhotoSrc}
                alt={member.name}
                variant="compact"
                isPhoto={Boolean(member.photoUrl)}
              />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">সদস্যের নাম</p>
                <h4 className="font-display text-base font-bold text-slate-900">{member.name}</h4>
                <p className="text-xs text-slate-600">{member.designation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
              <div>
                <p className="text-slate-500">সদস্য আইডি</p>
                <p className="font-mono-num font-bold text-slate-900">{member.memberCode}</p>
              </div>
              <div>
                <p className="text-slate-500">মোবাইল</p>
                <p className="font-mono-num font-semibold text-slate-900">
                  {member.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">মাসিক নির্ধারিত এয়ানত</p>
                <p className="font-mono-num font-bold text-emerald-800">
                  ৳ {member.monthlyFee.toLocaleString('en-US')}
                </p>
              </div>
            </div>
          </div>

          {/* 12 Months Table (জানুয়ারি থেকে ডিসেম্বর) */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                  <th className="px-4 py-2.5">ক্রম</th>
                  <th className="px-4 py-2.5">মাস ({year})</th>
                  <th className="px-4 py-2.5 text-right">দেওয়ার কথা</th>
                  <th className="px-4 py-2.5 text-right">দিয়েছে</th>
                  <th className="px-4 py-2.5 text-right">বাকি</th>
                  <th className="px-4 py-2.5 text-right">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row, idx) => (
                  <tr key={row.monthName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2 font-mono-num text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{row.monthName}</td>
                    <td className="px-4 py-2 text-right font-mono-num text-slate-700">
                      ৳ {row.expected.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-2 text-right font-mono-num font-semibold text-emerald-700">
                      ৳ {row.paid.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-2 text-right font-mono-num font-semibold text-red-700">
                      ৳ {row.due.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      <span
                        className={
                          row.statusLabel === 'পরিশোধিত'
                            ? 'text-emerald-700'
                            : row.statusLabel === 'আংশিক'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                  <td colSpan={2} className="px-4 py-3">
                    বাৎসরিক সর্বমোট ({reportData.paidMonthsCount}/12 মাস পরিশোধিত)
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num">
                    ৳ {reportData.annualExpected.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-emerald-700">
                    ৳ {reportData.totalPaid.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num text-red-700">
                    ৳ {reportData.totalDue.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Summary Totals (বছরে মোট দেওয়ার কথা, মোট দিয়েছে, মোট বাকি) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">বছরে মোট দেওয়ার কথা</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-slate-900">
                ৳ {reportData.annualExpected.toLocaleString('en-US')}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs font-medium text-emerald-900">মোট দিয়েছে</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-emerald-700">
                ৳ {reportData.totalPaid.toLocaleString('en-US')}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
              <p className="text-xs font-medium text-red-900">মোট বাকি</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-red-700">
                ৳ {reportData.totalDue.toLocaleString('en-US')}
              </p>
            </div>
          </div>

          {/* Print Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-slate-500">
            <div className="border-t border-slate-300 pt-2">সদস্যের স্বাক্ষর</div>
            <div className="border-t border-slate-300 pt-2">কোষাধ্যক্ষ / দায়িত্বপ্রাপ্ত অ্যাডমিন</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

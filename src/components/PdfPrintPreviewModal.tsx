import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X } from 'lucide-react';
import { DEFAULT_LOGO_URL, ORG_NAME, ORG_TAGLINE } from '../types';
import { ORG_CONTACT } from '../services/contactConfig';
import {
  generateDonationProjectPdfBlob,
  PdfPrintPayload,
} from '../services/donationProjectPdfGenerator';
import { OrgLogo } from './OrgLogo';

interface PdfPrintPreviewModalProps {
  payload: PdfPrintPayload | null;
  orgLogoUrl?: string;
  onClose: () => void;
}

export const PdfPrintPreviewModal: React.FC<PdfPrintPreviewModalProps> = ({
  payload,
  orgLogoUrl,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!payload) return;
    document.body.classList.add('print-modal-active');
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [payload]);

  if (!payload) return null;

  const activeLogoSrc = orgLogoUrl || DEFAULT_LOGO_URL;

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const { blob, fileName } = await generateDonationProjectPdfBlob(payload, orgLogoUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="print-portal-root fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="print-modal-card my-auto w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 truncate">
              {payload.documentTitle} — প্রিন্ট ও PDF প্রিভিউ
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
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

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Organization Header with Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center gap-4">
              <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-emerald-950">
                  {ORG_NAME}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-emerald-800">{ORG_TAGLINE}</p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600">
                  {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2} · {ORG_CONTACT.phoneDisplay}
                </p>
              </div>
            </div>

            <div className="self-start sm:self-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
              {payload.documentTitle}
            </div>
          </div>

          {/* Reference & Date Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <div>
              <span className="text-slate-500">রেফারেন্স / রসিদ নং: </span>
              <span className="font-mono-num font-bold text-slate-900">
                {payload.referenceNo || 'AAIS-DOC'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">তারিখ: </span>
              <span className="font-mono-num font-semibold text-slate-900">{payload.date}</span>
            </div>
          </div>

          {/* Core Required Details Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <th className="w-40 sm:w-48 bg-slate-50 px-4 py-3 font-semibold text-slate-600">
                    প্রকল্পের নাম
                  </th>
                  <td className="px-4 py-3 font-bold text-slate-900">{payload.projectName}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">দাতার নাম</th>
                  <td className="px-4 py-3 font-semibold text-slate-900">{payload.donorName}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">
                    টাকার পরিমাণ
                  </th>
                  <td className="px-4 py-3 font-mono-num text-lg font-bold text-emerald-800">
                    ৳ {payload.amount.toLocaleString('en-US')}/-
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">তারিখ</th>
                  <td className="px-4 py-3 font-mono-num font-semibold text-slate-900">
                    {payload.date}
                  </td>
                </tr>
                {payload.paymentInfo && (
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">
                      পেমেন্ট মাধ্যম
                    </th>
                    <td className="px-4 py-3 font-mono-num text-slate-800">
                      {payload.paymentInfo}
                    </td>
                  </tr>
                )}
                {payload.statusLabel && (
                  <tr>
                    <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-600">অবস্থা</th>
                    <td className="px-4 py-3 font-semibold text-slate-900">{payload.statusLabel}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Income, Total Expense, Current Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold text-emerald-800">মোট আয়</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-emerald-950">
                ৳ {payload.totalIncome.toLocaleString('en-US')}/-
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold text-rose-800">মোট ব্যয়</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-rose-950">
                ৳ {payload.totalExpense.toLocaleString('en-US')}/-
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold text-blue-800">বর্তমান ব্যালেন্স</p>
              <p className="mt-1 font-mono-num text-xl font-bold text-blue-950">
                ৳ {payload.currentBalance.toLocaleString('en-US')}/-
              </p>
            </div>
          </div>

          {payload.orgSummary && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">সংস্থার সার্বিক তহবিল:</span>
              <span className="font-mono-num">
                মোট আয়: <strong>৳ {payload.orgSummary.totalIncome.toLocaleString('en-US')}/-</strong> ·
                মোট ব্যয়: <strong>৳ {payload.orgSummary.totalExpense.toLocaleString('en-US')}/-</strong> ·
                বর্তমান ব্যালেন্স:{' '}
                <strong>৳ {payload.orgSummary.netBalance.toLocaleString('en-US')}/-</strong>
              </span>
            </div>
          )}

          {/* Optional Project Income & Expense Breakdown */}
          {((payload.incomeList && payload.incomeList.length > 0) ||
            (payload.expenseList && payload.expenseList.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payload.incomeList && payload.incomeList.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white">
                    <span>আয় / দাতাবৃন্দের তালিকা</span>
                    <span>{payload.incomeList.length} জন</span>
                  </div>
                  <ul className="divide-y divide-slate-100 text-xs">
                    {payload.incomeList.map((item, idx) => (
                      <li
                        key={`${item.name}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3.5 py-1.5"
                      >
                        <span className="text-slate-800">
                          <span className="font-mono-num text-slate-500 mr-1.5">{idx + 1}.</span>
                          {item.name}
                        </span>
                        <span className="font-mono-num font-bold text-emerald-800 shrink-0">
                          {item.amount}/-
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {payload.expenseList && payload.expenseList.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between bg-slate-800 px-3.5 py-2 text-xs font-bold text-white">
                    <span>ব্যয়ের খাতসমূহ</span>
                    <span>{payload.expenseList.length}টি খাত</span>
                  </div>
                  <ul className="divide-y divide-slate-100 text-xs">
                    {payload.expenseList.map((item, idx) => (
                      <li
                        key={`${item.name}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3.5 py-1.5"
                      >
                        <span className="text-slate-800">
                          <span className="font-mono-num text-slate-500 mr-1.5">{idx + 1}.</span>
                          {item.name}
                        </span>
                        <span className="font-mono-num font-bold text-rose-700 shrink-0">
                          {item.amount}/-
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {payload.note && payload.kind !== 'project' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-700">
              <span className="font-bold text-slate-800">বিবরণ / নোট: </span>
              {payload.note}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs text-slate-600">
            <div className="border-t border-slate-300 pt-2">কোষাধ্যক্ষ / হিসাবরক্ষক</div>
            <div className="border-t border-slate-300 pt-2">সাধারণ সম্পাদক</div>
            <div className="border-t border-slate-300 pt-2">সভাপতি</div>
          </div>

          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>{ORG_NAME}</span>
            <span>
              ফোন: {ORG_CONTACT.phoneDisplay} · ইমেইল: {ORG_CONTACT.email}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

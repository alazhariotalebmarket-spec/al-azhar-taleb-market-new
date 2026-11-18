import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { ORG_NAME, ORG_TAGLINE, Transaction } from '../types';
import { ORG_CONTACT } from '../services/contactConfig';
import { ORG_WATERMARK_LOGO_FALLBACK } from '../services/watermarkUtils';
import { OrgLogo } from './OrgLogo';

interface ReceiptModalProps {
  transaction: Transaction | null;
  orgLogoUrl?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  orgLogoUrl,
  onClose,
}) => {
  useEffect(() => {
    if (!transaction) return;
    document.body.classList.add('print-modal-active');
    return () => {
      document.body.classList.remove('print-modal-active');
    };
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const activeLogoSrc = orgLogoUrl || ORG_WATERMARK_LOGO_FALLBACK;

  return createPortal(
    <div className="print-portal-root fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs">
      <div className="print-modal-card w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <h3 className="font-display text-sm font-bold text-slate-900">
            {isIncome ? 'আয় রসিদ (Money Receipt)' : 'ব্যয় ভাউচার (Expense Voucher)'}
          </h3>
          <div className="flex items-center gap-2">
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

        <div className="relative overflow-hidden p-6 sm:p-7 space-y-5">
          {/* Centered Transparent Organization Logo Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <img
              src={activeLogoSrc}
              alt=""
              className="h-64 w-64 rounded-full object-contain opacity-[0.09] mix-blend-multiply"
            />
          </div>
          {/* Institutional Header */}
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-slate-900">{ORG_NAME}</h2>
              <p className="text-xs text-emerald-800 font-medium">{ORG_TAGLINE}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2} · {ORG_CONTACT.phoneDisplay}
              </p>
            </div>
          </div>

          {/* Receipt Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs">
            <div>
              <span className="text-slate-500">রসিদ / ভাউচার নং: </span>
              <span className="font-mono-num font-bold text-slate-900">{transaction.receiptNo}</span>
            </div>
            <div>
              <span className="text-slate-500">তারিখ: </span>
              <span className="font-mono-num font-semibold text-slate-900">{transaction.date}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">লেনদেনের ধরন</span>
              <span className={`font-semibold ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                {isIncome ? 'আয় (জমা)' : 'ব্যয় (খরচ)'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">খাত</span>
              <span className="font-semibold text-slate-900">{transaction.category}</span>
            </div>

            <div className="border-b border-slate-100 pb-2.5">
              <p className="text-slate-500 text-xs">বিবরণ</p>
              <p className="mt-1 font-medium text-slate-900 leading-relaxed">
                {transaction.description}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
              <span className="font-semibold text-slate-700">মোট পরিমাণ</span>
              <span
                className={`font-mono-num text-2xl font-bold ${
                  isIncome ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                ৳ {transaction.amount.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs text-slate-500">
            <div className="border-t border-slate-300 pt-2">কোষাধ্যক্ষ / হিসাবরক্ষক</div>
            <div className="border-t border-slate-300 pt-2">সভাপতি / সাধারণ সম্পাদক</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

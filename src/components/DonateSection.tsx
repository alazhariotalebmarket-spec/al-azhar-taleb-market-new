import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, FileCheck2, HeartHandshake, Send } from 'lucide-react';
import {
  ORG_CONTACT,
  copyTextToClipboard,
  triggerBkashSendMoney,
} from '../services/contactConfig';
import { DonationRequest } from '../types';

interface DonateSectionProps {
  onSubmitDonation?: (req: Omit<DonationRequest, 'id' | 'submittedAt' | 'status'>) => void;
}

export const DonateSection: React.FC<DonateSectionProps> = ({ onSubmitDonation }) => {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showFallbackLink, setShowFallbackLink] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('সাদাকাহ ও অনুদান');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);
  const deepLinkRef = useRef<HTMLAnchorElement | null>(null);
  const fallbackLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleCopyOnly = async () => {
    await copyTextToClipboard(ORG_CONTACT.bkashNumber);
    setCopiedMessage(`নাম্বার কপি হয়েছে: ${ORG_CONTACT.bkashNumber}`);
    setShowFallbackLink(false);
  };

  const handleSendViaBkash = async () => {
    await copyTextToClipboard(ORG_CONTACT.bkashNumber);
    setCopiedMessage(`নাম্বার কপি হয়েছে: ${ORG_CONTACT.bkashNumber}`);
    setShowFallbackLink(true);
    cleanupRef.current?.();
    cleanupRef.current = triggerBkashSendMoney(deepLinkRef.current, fallbackLinkRef.current);
  };

  const handleDonationFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitDonation) return;
    const numericAmount = Number(amount.trim());
    if (!donorName.trim() || !phone.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    onSubmitDonation({
      donorName: donorName.trim(),
      phone: phone.trim(),
      category,
      amount: Math.round(numericAmount),
      paymentMethod: 'বিকাশ (পার্সোনাল)',
      trxId: trxId.trim() || 'নগদ / উল্লেখ নেই',
      note: note.trim() || undefined,
    });

    setDonorName('');
    setPhone('');
    setAmount('');
    setTrxId('');
    setNote('');
    setFormOpen(false);
    setSubmittedNotice('জাযাকাল্লাহ খাইরান! আপনার দানের তথ্য অ্যাডমিনের নিকট জমা হয়েছে।');
  };

  return (
    <section
      aria-label="দান করুন"
      className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-rose-50/60 to-white p-6 sm:p-7 shadow-xs"
    >
      {/* Hidden anchor helpers (avoids window.open while supporting bKash app intent + Play Store fallback) */}
      <a ref={deepLinkRef} href={ORG_CONTACT.bkashAppIntentUrl} className="hidden" aria-hidden="true">
        bKash App
      </a>
      <a
        ref={fallbackLinkRef}
        href={ORG_CONTACT.bkashPlayStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden"
        aria-hidden="true"
      >
        bKash Play Store
      </a>

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-pink-900">
            <HeartHandshake className="h-5 w-5 text-[#E2136E] shrink-0" />
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              দান করুন - আল্লাহর রাস্তায় দান করুন
            </h2>
          </div>

          <p className="text-xs font-semibold text-pink-800">বিকাশ (পার্সোনাল)</p>

          {/* Number with Pink bKash Icon */}
          <button
            type="button"
            onClick={handleSendViaBkash}
            className="group inline-flex items-center gap-3 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-[#E2136E] hover:bg-pink-50/40"
            title="বিকাশ অ্যাপ খুলতে ও নাম্বার কপি করতে ক্লিক করুন"
          >
            {/* Pink bKash Emblem Icon */}
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E2136E] text-white shrink-0 shadow-xs"
              aria-hidden="true"
            >
              <svg viewBox="0 0 36 36" className="h-6 w-6 fill-current" role="img">
                <path d="M17.4 6.2 26.8 14l-5.7 2.2-3.7-10Zm9.9 8.7L21 17.3l7.3 5.5 2-4.7-3-3.2Zm-7 3.1-9.8 3.9 5.5 7.9 4.3-11.8Zm-9.9 3.1 6-8.9-9.1-1.9 3.1 10.8Zm7.2-14.2 3.1 8.5-7.4 2.9 4.3-11.4Z" />
              </svg>
            </span>

            <span className="font-mono-num text-2xl font-bold tracking-wider text-[#E2136E] sm:text-3xl">
              {ORG_CONTACT.bkashNumber}
            </span>
          </button>

          <p className="text-xs text-pink-900/80">
            বিকাশ অ্যাপে গিয়ে <span className="font-semibold">Send Money</span> তে চাপ দিয়ে কপি করা নাম্বারটি পেস্ট করুন।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col lg:flex-row shrink-0">
          <button
            type="button"
            onClick={handleSendViaBkash}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E2136E] px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#c50f5e] whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            বিকাশে পাঠান
          </button>

          <button
            type="button"
            onClick={handleCopyOnly}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-300 bg-white px-5 py-3 text-sm font-semibold text-pink-900 transition-colors hover:bg-pink-100/60 whitespace-nowrap"
          >
            <Copy className="h-4 w-4 text-[#E2136E]" />
            নাম্বার কপি করুন
          </button>
        </div>
      </div>

      {/* Copy confirmation & Play Store fallback link */}
      {(copiedMessage || showFallbackLink) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-xs">
          {copiedMessage && (
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-mono-num">{copiedMessage}</span>
            </div>
          )}
          {showFallbackLink && (
            <a
              href={ORG_CONTACT.bkashPlayStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#E2136E] hover:underline whitespace-nowrap"
            >
              বিকাশ অ্যাপ না থাকলে Play Store থেকে নিন
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {submittedNotice && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* Footer note + optional Donation Confirmation Form Toggle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pink-200/80 pt-3">
        <p className="text-xs font-medium text-pink-900">
          দান পাঠিয়ে আমাদের জানান, জাযাকাল্লাহ খাইরান
        </p>

        {onSubmitDonation && (
          <button
            type="button"
            onClick={() => {
              setFormOpen((prev) => !prev);
              setSubmittedNotice(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pink-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#E2136E] transition-colors hover:bg-pink-50 whitespace-nowrap"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            {formOpen ? 'ফর্ম বন্ধ করুন' : 'দানের তথ্য জমা দিন'}
          </button>
        )}
      </div>

      {/* Expandable Donation Confirmation Form */}
      {onSubmitDonation && formOpen && (
        <form
          onSubmit={handleDonationFormSubmit}
          className="mt-4 grid gap-3 rounded-xl border border-pink-200 bg-white p-4 sm:grid-cols-2"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700">
              দাতার নাম <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="আপনার নাম"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#E2136E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              মোবাইল নাম্বার <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-[#E2136E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">দানের খাত</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E2136E]"
            >
              <option value="সাদাকাহ ও অনুদান">সাদাকাহ ও অনুদান</option>
              <option value="যাকাত তহবিল">যাকাত তহবিল</option>
              <option value="এতিম ও শিক্ষা বৃত্তি">এতিম ও শিক্ষা বৃত্তি</option>
              <option value="শীতবস্ত্র প্রকল্প">শীতবস্ত্র প্রকল্প</option>
              <option value="সাধারণ অনুদান">সাধারণ অনুদান</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              টাকার পরিমাণ (৳) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="যেমন: 1000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-[#E2136E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              বিকাশ ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="যেমন: BK94X28..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-[#E2136E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">মন্তব্য (ঐচ্ছিক)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="দোয়া বা প্রকল্পের নাম"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#E2136E]"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#E2136E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#c50f5e]"
            >
              তথ্য জমা দিন
            </button>
          </div>
        </form>
      )}
    </section>
  );
};


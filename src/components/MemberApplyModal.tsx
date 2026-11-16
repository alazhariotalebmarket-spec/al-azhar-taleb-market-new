import React, { useState } from 'react';
import { CheckCircle2, UserPlus, X } from 'lucide-react';
import { BLOOD_GROUPS, BloodGroup, MemberApplication, ORG_NAME } from '../types';

interface MemberApplyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitApplication: (
    application: Omit<MemberApplication, 'id' | 'submittedAt' | 'status'>
  ) => void;
}

export const MemberApplyModal: React.FC<MemberApplyModalProps> = ({
  open,
  onClose,
  onSubmitApplication,
}) => {
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [feeInput, setFeeInput] = useState('200');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fatherName.trim() || !phone.trim()) {
      setError('নাম, পিতার নাম এবং মোবাইল নাম্বার অবশ্যই দিতে হবে।');
      return;
    }
    const parsedFee = Number(feeInput.trim());
    if (Number.isNaN(parsedFee) || parsedFee < 50) {
      setError('সর্বনিম্ন এয়ানত ৫০ টাকা');
      return;
    }

    onSubmitApplication({
      name: name.trim(),
      fatherName: fatherName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      bloodGroup,
      desiredMonthlyFee: Math.round(parsedFee),
      note: note.trim() || undefined,
    });

    setSubmitted(true);
    setError(null);
  };

  const handleResetAndClose = () => {
    setName('');
    setFatherName('');
    setAddress('');
    setPhone('');
    setBloodGroup('');
    setFeeInput('200');
    setNote('');
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-emerald-800" />
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                সদস্য হওয়ার আবেদন ফর্ম
              </h3>
              <p className="text-xs text-slate-500">{ORG_NAME}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-display text-lg font-bold text-slate-900">
              আপনার আবেদন সফলভাবে জমা হয়েছে!
            </h4>
            <p className="text-sm text-slate-600">
              অ্যাডমিন প্যানেল থেকে যাচাই ও অনুমোদনের পর আপনার নাম সদস্য তালিকায় যুক্ত করা হবে ইনশাআল্লাহ।
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  আবেদনকারীর নাম <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  পিতার নাম <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="পিতার নাম লিখুন"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">ব্লাড গ্রুপ</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup | '')}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                >
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">ঠিকানা / গ্রাম</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="গ্রাম / ইউনিয়ন / থানা"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  মাসিক এয়ানতের পরিমাণ (৳) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={feeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFeeInput(val);
                    if (val && Number(val) >= 50) setError(null);
                  }}
                  placeholder="সর্বনিম্ন ৫০ টাকা"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">মন্তব্য (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="সংগঠনে যুক্ত হওয়ার আগ্রহ বা পেশা"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                আবেদন জমা দিন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

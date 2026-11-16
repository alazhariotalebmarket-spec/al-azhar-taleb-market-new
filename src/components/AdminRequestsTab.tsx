import React from 'react';
import { Check, FileText, HandHeart, Printer, Trash2, UserPlus, X } from 'lucide-react';
import {
  DonationRequest,
  Member,
  MemberApplication,
  OrganizationData,
  Transaction,
} from '../types';

interface AdminRequestsTabProps {
  donationRequests: DonationRequest[];
  memberApplications: MemberApplication[];
  onMutateData: (
    updater: (prev: OrganizationData) => OrganizationData,
    actionDescription: string
  ) => void;
  onPrintDonation?: (req: DonationRequest) => void;
}

const STATUS_LABEL: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

export const AdminRequestsTab: React.FC<AdminRequestsTabProps> = ({
  donationRequests,
  memberApplications,
  onMutateData,
  onPrintDonation,
}) => {
  const handleApproveDonation = (req: DonationRequest) => {
    const newTx: Transaction = {
      id: `don-tx-${req.id}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'income',
      category: req.category,
      description: `${req.donorName} (${req.phone}) — ${req.paymentMethod} TrxID: ${req.trxId}${
        req.note ? ` · ${req.note}` : ''
      }`,
      amount: req.amount,
      receiptNo: `DON-${Date.now().toString().slice(-6)}`,
    };

    onMutateData(
      (prev) => ({
        ...prev,
        donationRequests: prev.donationRequests.map((d) =>
          d.id === req.id ? { ...d, status: 'approved' } : d
        ),
        transactions: prev.transactions.some((t) => t.id === newTx.id)
          ? prev.transactions
          : [newTx, ...prev.transactions],
      }),
      `অনুদান অনুমোদন (${req.donorName})`
    );
  };

  const handleRejectDonation = (req: DonationRequest) => {
    onMutateData(
      (prev) => ({
        ...prev,
        donationRequests: prev.donationRequests.map((d) =>
          d.id === req.id ? { ...d, status: 'rejected' } : d
        ),
      }),
      'অনুদান তথ্য বাতিল'
    );
  };

  const handleDeleteDonation = (id: string) => {
    onMutateData(
      (prev) => ({
        ...prev,
        donationRequests: prev.donationRequests.filter((d) => d.id !== id),
      }),
      'অনুদান রেকর্ড মুছে ফেলা'
    );
  };

  const handleApproveApplication = (app: MemberApplication) => {
    onMutateData((prev) => {
      const nextCode = `AAIS-${String(prev.members.length + 1).padStart(3, '0')}`;
      const newMember: Member = {
        id: `m-${Date.now()}`,
        memberCode: nextCode,
        name: app.name,
        fatherName: app.fatherName,
        designation: 'সাধারণ সদস্য',
        phone: app.phone,
        address: app.address,
        bloodGroup: app.bloodGroup,
        monthlyFee: Math.max(50, app.desiredMonthlyFee),
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'সক্রিয়',
        eyanotPayments: {},
      };

      return {
        ...prev,
        memberApplications: prev.memberApplications.map((a) =>
          a.id === app.id ? { ...a, status: 'approved' } : a
        ),
        members: [newMember, ...prev.members],
      };
    }, `নতুন সদস্য আবেদন অনুমোদন (${app.name})`);
  };

  const handleRejectApplication = (app: MemberApplication) => {
    onMutateData(
      (prev) => ({
        ...prev,
        memberApplications: prev.memberApplications.map((a) =>
          a.id === app.id ? { ...a, status: 'rejected' } : a
        ),
      }),
      'সদস্য আবেদন বাতিল'
    );
  };

  const handleDeleteApplication = (id: string) => {
    onMutateData(
      (prev) => ({
        ...prev,
        memberApplications: prev.memberApplications.filter((a) => a.id !== id),
      }),
      'সদস্য আবেদন মুছে ফেলা'
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          অনুদান যাচাই ও সদস্য আবেদন
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          দাতাদের পাঠানো বিকাশ অনুদানের তথ্য অনুমোদন করলে তা স্বয়ংক্রিয়ভাবে মোট আয়ে যোগ হবে, এবং সদস্য আবেদন অনুমোদন করলে নতুন সদস্য তৈরি হবে।
        </p>
      </div>

      {/* Donation Verification Queue */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <HandHeart className="h-5 w-5 text-[#E2136E]" />
            <h3 className="text-base font-bold text-slate-900">অনুদান ভেরিফিকেশন তালিকা</h3>
          </div>
          <span className="font-mono-num text-xs font-semibold text-slate-600">
            মোট: {donationRequests.length}টি
          </span>
        </div>

        {donationRequests.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            এখনো কোনো দাতার অনলাইন অনুদান তথ্য জমা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {donationRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`font-semibold ${
                        req.status === 'approved'
                          ? 'text-emerald-700'
                          : req.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {STATUS_LABEL[req.status]}
                    </span>
                    <span>·</span>
                    <span>{req.category}</span>
                    <span>·</span>
                    <span className="font-mono-num">{req.submittedAt.slice(0, 10)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {req.donorName} ({req.phone}) —{' '}
                      <span className="font-mono-num text-emerald-700">
                        ৳ {req.amount.toLocaleString('en-US')}
                      </span>
                    </p>
                    {onPrintDonation && (
                      <button
                        type="button"
                        onClick={() => onPrintDonation(req)}
                        className="no-print inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                        title={`${req.donorName} - PDF / প্রিন্ট`}
                      >
                        <FileText className="h-3 w-3 text-emerald-700" />
                        <span>PDF</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-mono-num">
                    মাধ্যম: {req.paymentMethod} · TrxID: {req.trxId}
                    {req.note ? ` · মন্তব্য: ${req.note}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {onPrintDonation && (
                    <button
                      type="button"
                      onClick={() => onPrintDonation(req)}
                      className="no-print inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                      title="অনুদানের PDF / প্রিন্ট"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-700" />
                      PDF / প্রিন্ট
                    </button>
                  )}
                  {req.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveDonation(req)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                      >
                        <Check className="h-3.5 w-3.5" />
                        অনুমোদন ও আয়ে যোগ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectDonation(req)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3.5 w-3.5" />
                        বাতিল
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteDonation(req.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership Applications Queue */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900">নতুন সদস্য আবেদন তালিকা</h3>
          </div>
          <span className="font-mono-num text-xs font-semibold text-slate-600">
            মোট: {memberApplications.length}টি
          </span>
        </div>

        {memberApplications.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            এখনো কোনো নতুন সদস্য হওয়ার আবেদন জমা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {memberApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`font-semibold ${
                        app.status === 'approved'
                          ? 'text-emerald-700'
                          : app.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>
                    {app.bloodGroup && (
                      <>
                        <span>·</span>
                        <span className="font-mono-num font-semibold text-red-700">
                          রক্ত: {app.bloodGroup}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-mono-num">{app.submittedAt.slice(0, 10)}</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {app.name} (পিতা: {app.fatherName})
                  </p>
                  <p className="text-xs text-slate-600">
                    মোবাইল: <span className="font-mono-num">{app.phone}</span> · ঠিকানা:{' '}
                    {app.address || 'উল্লেখ নেই'} · প্রস্তাবিত এয়ানত:{' '}
                    <strong className="font-mono-num">
                      ৳ {app.desiredMonthlyFee.toLocaleString('en-US')}
                    </strong>
                  </p>
                  {app.note && <p className="text-xs text-slate-500">মন্তব্য: {app.note}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {app.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveApplication(app)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                      >
                        <Check className="h-3.5 w-3.5" />
                        অনুমোদন ও সদস্য করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectApplication(app)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3.5 w-3.5" />
                        বাতিল
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteApplication(app.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

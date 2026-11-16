import React, { useMemo, useState } from 'react';
import { CheckCircle2, MessageSquare, Printer, Search, XCircle } from 'lucide-react';
import { BENGALI_MONTHS, Member, ORG_NAME } from '../types';
import { buildEyanotSmsHref } from '../services/smsUtils';
import { MemberAnnualEyanotPrintModal } from './MemberAnnualEyanotPrintModal';
import { MemberProfileModal } from './MemberProfileModal';
import { OrgLogo } from './OrgLogo';

interface AdminEyanotSheetProps {
  members: Member[];
  logoUrl?: string;
  isAdmin?: boolean;
  onToggleMonth?: (memberId: string, year: string, monthIndex: number) => void;
}

export const AdminEyanotSheet: React.FC<AdminEyanotSheetProps> = ({
  members,
  logoUrl,
  isAdmin = false,
  onToggleMonth,
}) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due'>('all');
  const [viewMode, setViewMode] = useState<'jul-nov' | 'single'>('jul-nov');
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [printMemberId, setPrintMemberId] = useState<string | null>(null);

  const canEditEyanot = isAdmin && Boolean(onToggleMonth);

  const displayedMonthIndices = useMemo(() => {
    if (viewMode === 'single') {
      return [selectedMonth];
    }
    const base = [6, 7, 8, 9, 10]; // জুলাই, আগস্ট, সেপ্টেম্বর, অক্টোবর, নভেম্বর
    if (!base.includes(selectedMonth)) {
      return [...base, selectedMonth].sort((a, b) => a - b);
    }
    return base;
  }, [viewMode, selectedMonth]);

  const yearOptions = useMemo(() => {
    const base = new Set<string>([
      String(now.getFullYear() - 1),
      String(now.getFullYear()),
      String(now.getFullYear() + 1),
    ]);
    members.forEach((m) => {
      if (m.eyanotPayments) {
        Object.keys(m.eyanotPayments).forEach((y) => base.add(y));
      }
    });
    return Array.from(base).sort((a, b) => Number(b) - Number(a));
  }, [members, now]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'সক্রিয়'),
    [members]
  );

  const activeIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    activeMembers.forEach((m, idx) => {
      map.set(m.id, idx + 1);
    });
    return map;
  }, [activeMembers]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const printMember = useMemo(
    () => members.find((m) => m.id === printMemberId) || null,
    [members, printMemberId]
  );

  const monthStats = useMemo(() => {
    let expected = 0;
    let collected = 0;
    let paidCount = 0;

    activeMembers.forEach((m) => {
      expected += m.monthlyFee || 0;
      const amt = m.eyanotPayments?.[selectedYear]?.[selectedMonth] || 0;
      if (amt > 0) {
        collected += amt;
        paidCount += 1;
      }
    });

    const due = Math.max(0, expected - collected);
    const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
    return {
      expected,
      collected,
      due,
      paidCount,
      dueCount: Math.max(0, activeMembers.length - paidCount),
      rate,
    };
  }, [activeMembers, selectedYear, selectedMonth]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeMembers.filter((m) => {
      const amt = m.eyanotPayments?.[selectedYear]?.[selectedMonth] || 0;
      const isPaid = amt > 0;
      if (statusFilter === 'paid' && !isPaid) return false;
      if (statusFilter === 'due' && isPaid) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.fatherName || '').toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
      );
    });
  }, [activeMembers, selectedYear, selectedMonth, statusFilter, search]);

  return (
    <div className="space-y-5 print-area">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            মাসিক এয়ানত কালেকশন শীট
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {canEditEyanot
              ? `${ORG_NAME} · ${BENGALI_MONTHS[selectedMonth]} ${selectedYear} — ১ ক্লিকে এয়ানত আদায় ও বকেয়া পরিচালনা`
              : `${ORG_NAME} · ${BENGALI_MONTHS[selectedMonth]} ${selectedYear} — সদস্যদের মাসিক এয়ানত তালিকা (শুধুমাত্র দেখার ও প্রিন্ট করার জন্য)`}
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('jul-nov')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'jul-nov'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              জুলাই–নভেম্বর
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              একক মাস
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            এয়ানত শীট প্রিন্ট
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="no-print grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">বছর নির্বাচন</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">মাস নির্বাচন</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
          >
            {BENGALI_MONTHS.map((mName, idx) => (
              <option key={mName} value={idx}>
                {mName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">অবস্থা ফিল্টার</label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {(
              [
                { id: 'all', label: 'সকল' },
                { id: 'paid', label: 'জমা' },
                { id: 'due', label: 'বাকি' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">সদস্য খুঁজুন</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম বা আইডি..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            মোট পাওয়ার কথা ({activeMembers.length} জন)
          </p>
          <p className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
            ৳ {monthStats.expected.toLocaleString('en-US')}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-medium text-emerald-900">
            আদায় হয়েছে ({monthStats.paidCount} জন)
          </p>
          <p className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
            ৳ {monthStats.collected.toLocaleString('en-US')}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <p className="text-xs font-medium text-red-900">
            বাকি আছে ({monthStats.dueCount} জন)
          </p>
          <p className="mt-1.5 font-mono-num text-xl font-bold text-red-700">
            ৳ {monthStats.due.toLocaleString('en-US')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">আদায়ের হার</p>
          <p className="mt-1.5 font-mono-num text-xl font-bold text-blue-700">{monthStats.rate}%</p>
        </div>
      </div>

      {/* Collection Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-4 py-3 text-center whitespace-nowrap">ক্রম</th>
                <th className="px-4 py-3 whitespace-nowrap">সদস্য ও আইডি</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">মাসিক</th>
                {displayedMonthIndices.map((mIdx) => (
                  <th
                    key={mIdx}
                    className={`px-3 py-3 text-center whitespace-nowrap ${
                      mIdx === selectedMonth ? 'bg-emerald-50/80 text-emerald-900' : ''
                    }`}
                  >
                    {BENGALI_MONTHS[mIdx]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right whitespace-nowrap">মোট জমা</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">মোট বাকি</th>
                <th className="no-print px-4 py-3 text-right whitespace-nowrap">
                  {isAdmin ? 'প্রিন্ট ও SMS' : 'রিপোর্ট'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member, idx) => {
                const serialNo = activeIndexMap.get(member.id) || idx + 1;
                const yearMap = member.eyanotPayments?.[selectedYear] || {};
                const selectedPaidAmt = yearMap[selectedMonth] || 0;
                const cleanPhone = (member.phone || '').replace(/[^\d+]/g, '');
                const smsAmount = selectedPaidAmt > 0 ? selectedPaidAmt : member.monthlyFee;
                const selectedMonthName = BENGALI_MONTHS[selectedMonth] || BENGALI_MONTHS[0];
                const smsHref = cleanPhone
                  ? buildEyanotSmsHref(member.phone, member.name, selectedMonthName, smsAmount)
                  : undefined;

                // Auto-calculated totals for displayed months / year
                const totalPaidYear = Object.values(yearMap).reduce(
                  (sum, v) => sum + (Number(v) || 0),
                  0
                );
                const totalDueDisplayed = displayedMonthIndices.reduce((sum, mIdx) => {
                  const p = yearMap[mIdx] || 0;
                  return sum + Math.max(0, (member.monthlyFee || 0) - p);
                }, 0);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-center font-mono-num text-xs font-bold text-slate-600 whitespace-nowrap">
                      {serialNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <OrgLogo
                          src={member.photoUrl || logoUrl}
                          alt={member.name}
                          variant="compact"
                          isPhoto={Boolean(member.photoUrl)}
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className="text-left font-semibold text-slate-900 hover:text-emerald-800 hover:underline focus-visible:outline-none focus-visible:underline whitespace-nowrap"
                          >
                            {member.name}
                          </button>
                          <div className="text-xs text-slate-500 font-mono-num whitespace-nowrap">
                            {member.memberCode}
                            {member.phone ? ` · ${member.phone}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                      ৳ {member.monthlyFee.toLocaleString('en-US')}
                    </td>

                    {displayedMonthIndices.map((mIdx) => {
                      const paidAmt = yearMap[mIdx] || 0;
                      const isPaid = paidAmt > 0;
                      return (
                        <td
                          key={mIdx}
                          className={`px-3 py-3 text-center whitespace-nowrap ${
                            mIdx === selectedMonth ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          {canEditEyanot && onToggleMonth ? (
                            <button
                              type="button"
                              onClick={() => onToggleMonth(member.id, selectedYear, mIdx)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                isPaid
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                              title={`${member.name} — ${BENGALI_MONTHS[mIdx]} ${selectedYear}`}
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
                      );
                    })}

                    <td className="px-4 py-3 text-right font-mono-num font-bold text-emerald-700 whitespace-nowrap">
                      ৳ {totalPaidYear.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-red-700 whitespace-nowrap">
                      ৳ {totalDueDisplayed.toLocaleString('en-US')}
                    </td>

                    <td className="no-print px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        {isAdmin &&
                          (smsHref ? (
                            <a
                              href={smsHref}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                              title={`${member.name} কে ${selectedMonthName} মাসের এয়ানত SMS পাঠান`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              SMS পাঠান
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed whitespace-nowrap"
                              title="মোবাইল নাম্বার দেওয়া নেই"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              SMS পাঠান
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={() => setPrintMemberId(member.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                          title={`${member.name} এর বাৎসরিক এয়ানত রিপোর্ট প্রিন্ট`}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          প্রিন্ট
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={6 + displayedMonthIndices.length}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    {activeMembers.length === 0
                      ? 'কোনো সদস্য যোগ করা হয়নি।'
                      : 'এই তালিকায় কোনো সদস্য পাওয়া যায়নি।'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clickable Member Details Modal (Admin gets Edit+Print+SMS, User gets strict View+Print) */}
      <MemberProfileModal
        member={selectedMember}
        isAdmin={canEditEyanot}
        orgLogoUrl={logoUrl}
        initialYear={selectedYear}
        initialMonthIndex={selectedMonth}
        onClose={() => setSelectedMemberId(null)}
        onToggleMonth={canEditEyanot ? onToggleMonth : undefined}
      />

      {/* Row-end Single Member Annual Eyanot Print Report Modal */}
      <MemberAnnualEyanotPrintModal
        member={printMember}
        year={selectedYear}
        orgLogoUrl={logoUrl}
        autoPrint={true}
        onClose={() => setPrintMemberId(null)}
      />
    </div>
  );
};

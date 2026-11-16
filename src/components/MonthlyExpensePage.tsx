import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Printer, ReceiptText, Search, Trash2 } from 'lucide-react';
import { BENGALI_MONTHS, ORG_NAME, Transaction } from '../types';

interface MonthlyExpensePageProps {
  transactions: Transaction[];
  isAdmin?: boolean;
  onAddExpense?: () => void;
  onEditExpense?: (tx: Transaction) => void;
  onDeleteExpense?: (tx: Transaction) => void;
  onViewReceipt?: (tx: Transaction) => void;
}

function formatDateDDMMYYYY(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function formatMonthLabel(ym: string): string {
  const [year, monthStr] = ym.split('-');
  const monthIdx = Number(monthStr) - 1;
  if (!year || Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return ym;
  }
  return `${BENGALI_MONTHS[monthIdx]} ${year}`;
}

export const MonthlyExpensePage: React.FC<MonthlyExpensePageProps> = ({
  transactions,
  isAdmin = false,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const canManage = isAdmin && Boolean(onEditExpense) && Boolean(onDeleteExpense);

  // All expense transactions sorted by date descending (newest on top)
  const sortedAllExpenses = useMemo(() => {
    return transactions
      .map((tx, idx) => ({ tx, idx }))
      .filter(({ tx }) => tx.type === 'expense')
      .sort((a, b) => {
        const dateCmp = b.tx.date.localeCompare(a.tx.date);
        if (dateCmp !== 0) return dateCmp;
        return b.idx - a.idx;
      })
      .map(({ tx }) => tx);
  }, [transactions]);

  const totalExpenseAll = useMemo(
    () => sortedAllExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [sortedAllExpenses]
  );

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    sortedAllExpenses.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [sortedAllExpenses]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    sortedAllExpenses.forEach((tx) => {
      if (tx.category) set.add(tx.category.trim());
    });
    return Array.from(set);
  }, [sortedAllExpenses]);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedAllExpenses.filter((tx) => {
      if (monthFilter !== 'all' && !tx.date.startsWith(monthFilter)) return false;
      if (categoryFilter !== 'all' && tx.category.trim() !== categoryFilter) return false;
      if (!q) return true;
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.receiptNo.toLowerCase().includes(q) ||
        formatDateDDMMYYYY(tx.date).includes(q)
      );
    });
  }, [sortedAllExpenses, monthFilter, categoryFilter, searchQuery]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [filteredExpenses]
  );

  const latestExpense = sortedAllExpenses[0] || null;
  const isFiltered = monthFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="space-y-5 print-area">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">মাসিক ব্যয়</h2>
          <p className="mt-1 text-sm text-slate-600">
            {ORG_NAME} · তারিখ অনুযায়ী খরচের পূর্ণাঙ্গ হিসাব (নতুনটা উপরে)
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && onAddExpense && (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              নতুন ব্যয় যোগ করুন
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            ব্যয়ের হিসাব প্রিন্ট
          </button>
        </div>
      </div>

      {/* Top Auto-Calculated Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-5">
          <p className="text-xs font-medium text-red-900">মোট খরচ (অটো হিসাব)</p>
          <p className="mt-1.5 font-mono-num text-2xl font-bold text-red-700">
            ৳ {totalExpenseAll.toLocaleString('en-US')}
          </p>
          <p className="mt-1 text-xs text-red-800 font-mono-num">
            মোট {sortedAllExpenses.length} টি খরচের হিসাব
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            {isFiltered ? 'ফিল্টারকৃত মোট খরচ' : 'তালিকায় প্রদর্শিত খরচ'}
          </p>
          <p className="mt-1.5 font-mono-num text-2xl font-bold text-slate-900">
            ৳ {filteredTotal.toLocaleString('en-US')}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono-num">
            {filteredExpenses.length} টি এন্ট্রি ·{' '}
            {monthFilter === 'all' ? 'সকল মাস' : formatMonthLabel(monthFilter)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">সর্বশেষ খরচ</p>
          {latestExpense ? (
            <>
              <p className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
                ৳ {latestExpense.amount.toLocaleString('en-US')}{' '}
                <span className="text-xs font-medium text-slate-500">
                  ({formatDateDDMMYYYY(latestExpense.date)})
                </span>
              </p>
              <p className="mt-1 truncate text-xs text-slate-600">{latestExpense.description}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">কোনো ব্যয় যোগ করা হয়নি</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="no-print grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">খরচ খুঁজুন</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কারণ, ক্যাটাগরি বা তারিখ..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">মাস নির্বাচন</label>
          <select
            aria-label="মাস নির্বাচন"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700"
          >
            <option value="all">সকল মাস</option>
            {monthOptions.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">ক্যাটাগরি</label>
          <select
            aria-label="ক্যাটাগরি নির্বাচন"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">কারণ / বিবরণ</th>
                <th className="px-5 py-3.5">ক্যাটাগরি</th>
                <th className="px-5 py-3.5 text-right">টাকা (৳)</th>
                <th className="no-print px-5 py-3.5 text-right">
                  {canManage ? 'কার্যক্রম' : 'ভাউচার'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-mono-num text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {formatDateDDMMYYYY(tx.date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">
                      {tx.description || tx.category}
                    </div>
                    {tx.receiptNo && (
                      <div className="mt-0.5 text-xs font-mono-num text-slate-500">
                        ভাউচার নং: {tx.receiptNo}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {tx.category}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono-num font-bold text-red-700 whitespace-nowrap">
                    ৳ {tx.amount.toLocaleString('en-US')}
                  </td>
                  <td className="no-print px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {onViewReceipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(tx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                          title="ভাউচার দেখুন ও প্রিন্ট করুন"
                        >
                          <ReceiptText className="h-3.5 w-3.5 text-emerald-700" />
                          ভাউচার
                        </button>
                      )}
                      {canManage && onEditExpense && (
                        <button
                          type="button"
                          onClick={() => onEditExpense(tx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                          title="এডিট করুন"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          এডিট
                        </button>
                      )}
                      {canManage && onDeleteExpense && (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(tx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 whitespace-nowrap"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ডিলিট
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    {sortedAllExpenses.length === 0
                      ? 'এখনো কোনো খরচ যোগ করা হয়নি।'
                      : 'খোঁজার শর্ত অনুযায়ী কোনো খরচ পাওয়া যায়নি।'}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-xs text-slate-700">
                    মোট খরচ ({filteredExpenses.length} টি):
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono-num text-base text-red-700 whitespace-nowrap">
                    ৳ {filteredTotal.toLocaleString('en-US')}
                  </td>
                  <td className="no-print px-5 py-3.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

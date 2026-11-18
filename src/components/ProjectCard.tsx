import React from 'react';
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Pencil,
  Printer,
  Trash2,
  Users,
} from 'lucide-react';
import { ProjectLedgerItem, WelfareProject } from '../types';
import { PieChart } from './PieChart';

interface ProjectCardProps {
  project: WelfareProject;
  isAdminView?: boolean;
  canPrintPdf?: boolean;
  hideFinancials?: boolean;
  onEdit?: (project: WelfareProject) => void;
  onDelete?: (project: WelfareProject) => void;
  onPrintProject?: (project: WelfareProject) => void;
  onPrintDonor?: (project: WelfareProject, donor: ProjectLedgerItem, index: number) => void;
  onDownloadProjectImage?: (project: WelfareProject) => void;
  onDownloadDonorImage?: (project: WelfareProject, donor: ProjectLedgerItem, index: number) => void;
  downloadingImageKey?: string | null;
  variant?: 'home' | 'page';
}

function ProjectCardComponent({
  project,
  isAdminView = false,
  canPrintPdf = false,
  hideFinancials = false,
  onEdit,
  onDelete,
  onPrintProject,
  onPrintDonor,
  onDownloadProjectImage,
  onDownloadDonorImage,
  downloadingImageKey,
  variant = 'page',
}: ProjectCardProps) {
  const showPdfButtons = !hideFinancials && Boolean(canPrintPdf || isAdminView);
  const hasLedger =
    !hideFinancials &&
    ((project.incomeList && project.incomeList.length > 0) ||
      (project.expenseList && project.expenseList.length > 0) ||
      Boolean(project.note));

  const pct =
    project.targetAmount > 0
      ? Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100))
      : 0;

  const totalIncome =
    project.incomeList && project.incomeList.length > 0
      ? project.incomeList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : project.raisedAmount;

  const totalExpense =
    project.expenseList && project.expenseList.length > 0
      ? project.expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : 0;

  const statusBadge =
    project.status === 'সম্পন্ন' ? (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        সম্পন্ন ✅
      </span>
    ) : project.status === 'চলমান' ? (
      <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800">
        চলমান
      </span>
    ) : (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        পরিকল্পিত
      </span>
    );

  if (hasLedger) {
    return (
      <article className="col-span-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-emerald-800">{project.category}</span>
              <span className="text-slate-300">·</span>
              {statusBadge}
            </div>
            <h3 className="mt-2 font-display text-lg sm:text-xl font-bold text-slate-900">
              {project.title}
            </h3>
            <p className="mt-1.5 text-[15px] sm:text-sm leading-relaxed text-slate-600">
              {project.description}
            </p>
          </div>

          {(showPdfButtons && onPrintProject) || (isAdminView && (onEdit || onDelete)) ? (
            <div className="no-print flex flex-wrap items-center gap-1.5 shrink-0">
              {showPdfButtons && onPrintProject && (
                <>
                  <button
                    type="button"
                    onClick={() => onPrintProject(project)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                    title="প্রকল্পের PDF / প্রিন্ট"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-700" />
                    <span>PDF / প্রিন্ট</span>
                  </button>
                  {onDownloadProjectImage && (
                    <button
                      type="button"
                      onClick={() => onDownloadProjectImage(project)}
                      disabled={downloadingImageKey === `project-${project.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-60 transition-colors"
                      title="প্রকল্পের ইমেজ ডাউনলোড"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-blue-700" />
                      <span>
                        {downloadingImageKey === `project-${project.id}` ? '...' : 'ইমেজ'}
                      </span>
                    </button>
                  )}
                </>
              )}
              {isAdminView && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  title="সম্পাদনা করুন"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {isAdminView && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Income & Expense Lists */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income List */}
          {project.incomeList && project.incomeList.length > 0 && (
            <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-emerald-200 bg-white">
              <div>
                <div className="flex items-center justify-between bg-emerald-800 px-3.5 py-2.5 text-white">
                  <h4 className="font-display text-sm font-bold">আয় এর লিস্ট</h4>
                  <span className="text-xs font-medium text-emerald-100">
                    {project.incomeList.length} জন
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {project.incomeList.map((item, idx) => (
                    <li
                      key={`${item.name}-${idx}`}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs sm:text-sm hover:bg-slate-50/70"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-mono-num text-slate-500 shrink-0 w-5 text-right">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-slate-800 break-words leading-snug">
                          {item.name}
                        </span>
                        {showPdfButtons && onPrintDonor && (
                          <div className="no-print inline-flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onPrintDonor(project, item, idx)}
                              className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                              title={`${item.name} - PDF / প্রিন্ট`}
                            >
                              <FileText className="h-3 w-3 text-emerald-700" />
                              <span>PDF</span>
                            </button>
                            {onDownloadDonorImage && (
                              <button
                                type="button"
                                onClick={() => onDownloadDonorImage(project, item, idx)}
                                disabled={downloadingImageKey === `donor-${project.id}-${idx}`}
                                className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-60 transition-colors"
                                title={`${item.name} - ইমেজ ডাউনলোড`}
                              >
                                <ImageIcon className="h-3 w-3 text-blue-700" />
                                <span>
                                  {downloadingImageKey === `donor-${project.id}-${idx}`
                                    ? '...'
                                    : 'ইমেজ'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="font-mono-num font-bold text-emerald-800 shrink-0 whitespace-nowrap">
                        {item.amount}/-
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-bold text-emerald-950">
                <span>মোট আয়</span>
                <span className="font-mono-num">= {totalIncome}/- টাকা</span>
              </div>
            </div>
          )}

          {/* Expense List */}
          {project.expenseList && project.expenseList.length > 0 && (
            <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-rose-200 bg-white">
              <div>
                <div className="flex items-center justify-between bg-slate-800 px-3.5 py-2.5 text-white">
                  <h4 className="font-display text-sm font-bold">ব্যয় এর লিস্ট</h4>
                  <span className="text-xs font-medium text-slate-300">
                    {project.expenseList.length}টি খাত
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {project.expenseList.map((item, idx) => (
                    <li
                      key={`${item.name}-${idx}`}
                      className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-slate-50/70"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span className="font-mono-num text-slate-500 shrink-0 w-5 text-right">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-slate-800 break-words leading-snug">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono-num font-bold text-rose-700 shrink-0 whitespace-nowrap">
                        {item.amount}/-
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between border-t border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-sm font-bold text-rose-950">
                <span>মোট ব্যয়</span>
                <span className="font-mono-num">= {totalExpense}/- টাকা</span>
              </div>
            </div>
          )}
        </div>

        {/* Project Round Pie Chart (Income vs Expense) */}
        {(totalIncome > 0 || totalExpense > 0) && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="sm:w-[190px] shrink-0">
                <PieChart
                  sizePx={96}
                  ariaLabel={`${project.title} আয়-ব্যয় রাউন্ড গ্রাফ`}
                  segments={[
                    {
                      key: 'income',
                      label: 'মোট আয়',
                      value: totalIncome,
                      formattedValue: `${totalIncome}/-`,
                      color: '#16a34a',
                    },
                    {
                      key: 'expense',
                      label: 'মোট ব্যয়',
                      value: totalExpense,
                      formattedValue: `${totalExpense}/-`,
                      color: '#dc2626',
                    },
                  ]}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <span className="font-display text-sm font-bold text-slate-900">
                    আয়-ব্যয় রাউন্ড গ্রাফ (Pie Chart)
                  </span>
                  <span className="font-mono-num text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                    স্থিতি: {totalIncome - totalExpense}/- টাকা
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-200/80 bg-white px-3 py-2">
                    <p className="text-[11px] text-slate-500">
                      মোট আয়{project.incomeList?.length ? ` (${project.incomeList.length} জনের দান)` : ''}
                    </p>
                    <p className="mt-0.5 font-mono-num text-sm font-bold text-emerald-800">
                      ৳ {totalIncome.toLocaleString('en-US')}/-
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-200/80 bg-white px-3 py-2">
                    <p className="text-[11px] text-slate-500">
                      মোট ব্যয়{project.expenseList?.length ? ` (${project.expenseList.length}টি খাত)` : ''}
                    </p>
                    <p className="mt-0.5 font-mono-num text-sm font-bold text-rose-700">
                      ৳ {totalExpense.toLocaleString('en-US')}/-
                    </p>
                  </div>
                </div>

                {project.expenseList && project.expenseList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {project.expenseList.map((ex, idx) => (
                      <span
                        key={`${ex.name}-${idx}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        <span className="truncate max-w-[200px]">{ex.name}:</span>
                        <strong className="font-mono-num text-rose-700 shrink-0">{ex.amount}/-</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Note Section */}
        {project.note && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 sm:px-4">
            <p className="text-xs font-bold text-amber-900">নোট:</p>
            <p className="mt-1 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-amber-950">
              {project.note}
            </p>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-800">{project.category}</span>
            <span className="text-slate-300">·</span>
            {hideFinancials ? (
              statusBadge
            ) : (
              <span
                className={
                  project.status === 'চলমান'
                    ? 'font-semibold text-emerald-700'
                    : project.status === 'সম্পন্ন'
                      ? 'font-semibold text-blue-700'
                      : 'font-semibold text-amber-700'
                }
              >
                {project.status}
              </span>
            )}
          </div>
          {(showPdfButtons && onPrintProject) || (isAdminView && (onEdit || onDelete)) ? (
            <div className="no-print flex flex-wrap items-center gap-1 shrink-0">
              {showPdfButtons && onPrintProject && (
                <>
                  <button
                    type="button"
                    onClick={() => onPrintProject(project)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                    title="প্রকল্পের PDF / প্রিন্ট"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-700" />
                    <span>PDF / প্রিন্ট</span>
                  </button>
                  {onDownloadProjectImage && (
                    <button
                      type="button"
                      onClick={() => onDownloadProjectImage(project)}
                      disabled={downloadingImageKey === `project-${project.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-60 transition-colors"
                      title="প্রকল্পের ইমেজ ডাউনলোড"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-blue-700" />
                      <span>
                        {downloadingImageKey === `project-${project.id}` ? '...' : 'ইমেজ'}
                      </span>
                    </button>
                  )}
                </>
              )}
              {isAdminView && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  title="সম্পাদনা করুন"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {isAdminView && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">{project.title}</h3>
        <p className="mt-2 text-[15px] sm:text-sm leading-relaxed text-slate-600">{project.description}</p>
      </div>

      {hideFinancials ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {project.status === 'সম্পন্ন'
              ? 'প্রকল্পের কাজ সম্পন্ন হয়েছে'
              : project.status === 'চলমান'
                ? 'প্রকল্প চলমান রয়েছে'
                : 'পরিকল্পিত প্রকল্প'}
          </span>
          <div className="flex items-center gap-3">
            {project.beneficiaries > 0 && (
              <span className="inline-flex items-center gap-1">
                উপকারভোগী:{' '}
                <strong className="font-mono-num text-slate-800">{project.beneficiaries} জন</strong>
              </span>
            )}
            {project.startDate && <span className="font-mono-num">তারিখ: {project.startDate}</span>}
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {variant === 'home' ? 'তহবিল অগ্রগতি' : 'সংগৃহীত তহবিল'}
            </span>
            <span className="font-mono-num font-bold text-slate-900">
              ৳ {project.raisedAmount.toLocaleString('en-US')} / ৳{' '}
              {project.targetAmount.toLocaleString('en-US')} ({pct}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              {isAdminView && <Users className="h-3.5 w-3.5 text-emerald-700" />}
              উপকারভোগী:{' '}
              <strong className="font-mono-num text-slate-800">{project.beneficiaries} জন</strong>
            </span>
            {variant !== 'home' && <span className="font-mono-num">শুরু: {project.startDate}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export const ProjectCard = React.memo(ProjectCardComponent);

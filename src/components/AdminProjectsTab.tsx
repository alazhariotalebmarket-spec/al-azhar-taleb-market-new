import React, { useState } from 'react';
import { FolderKanban, Plus, X } from 'lucide-react';
import {
  OrganizationData,
  ProjectLedgerItem,
  WelfareProject,
  WelfareProjectStatus,
} from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { ProjectCard } from './ProjectCard';

interface AdminProjectsTabProps {
  projects: WelfareProject[];
  onMutateData: (
    updater: (prev: OrganizationData) => OrganizationData,
    actionDescription: string
  ) => void;
  onPrintProject?: (project: WelfareProject) => void;
  onPrintDonor?: (project: WelfareProject, donor: ProjectLedgerItem, index: number) => void;
  onDownloadProjectImage?: (project: WelfareProject) => void;
  onDownloadDonorImage?: (project: WelfareProject, donor: ProjectLedgerItem, index: number) => void;
  downloadingImageKey?: string | null;
}

const STATUS_OPTIONS: WelfareProjectStatus[] = ['চলমান', 'সম্পন্ন', 'পরিকল্পিত'];

export const AdminProjectsTab: React.FC<AdminProjectsTabProps> = ({
  projects,
  onMutateData,
  onPrintProject,
  onPrintDonor,
  onDownloadProjectImage,
  onDownloadDonorImage,
  downloadingImageKey,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<WelfareProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WelfareProject | null>(null);
  const [form, setForm] = useState<Omit<WelfareProject, 'id'>>({
    title: '',
    category: 'মানবিক সহায়তা',
    description: '',
    targetAmount: 50000,
    raisedAmount: 0,
    beneficiaries: 50,
    startDate: new Date().toISOString().slice(0, 10),
    status: 'চলমান',
    note: '',
  });

  const openAdd = () => {
    setEditingProject(null);
    setForm({
      title: '',
      category: 'মানবিক সহায়তা',
      description: '',
      targetAmount: 50000,
      raisedAmount: 0,
      beneficiaries: 50,
      startDate: new Date().toISOString().slice(0, 10),
      status: 'চলমান',
      note: '',
    });
    setModalOpen(true);
  };

  const openEdit = (project: WelfareProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      category: project.category,
      description: project.description,
      targetAmount: project.targetAmount,
      raisedAmount: project.raisedAmount,
      beneficiaries: project.beneficiaries,
      startDate: project.startDate,
      status: project.status,
      note: project.note || '',
    });
    setModalOpen(true);
  };

  const saveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    if (editingProject) {
      onMutateData(
        (prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === editingProject.id
              ? {
                  ...editingProject,
                  ...form,
                  id: editingProject.id,
                  note: form.note?.trim() ? form.note : undefined,
                }
              : p
          ),
        }),
        'প্রকল্প তথ্য হালনাগাদ'
      );
    } else {
      const created: WelfareProject = {
        ...form,
        id: `p-${Date.now()}`,
      };
      onMutateData(
        (prev) => ({
          ...prev,
          projects: [created, ...prev.projects],
        }),
        'নতুন প্রকল্প যোগ'
      );
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            প্রকল্প ও কল্যাণ কর্মসূচি
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            সংস্থার চলমান ও পরিকল্পিত সমাজকল্যাণ প্রকল্প পরিচালনা করুন (পাবলিক পোর্টালে সরাসরি প্রদর্শিত হবে)।
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
        >
          <Plus className="h-4 w-4" />
          নতুন প্রকল্প যোগ করুন
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          কোনো প্রকল্প যোগ করা হয়নি। "নতুন প্রকল্প যোগ করুন" বাটনে ক্লিক করে প্রথম প্রকল্প তৈরি করুন।
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdminView
              canPrintPdf={Boolean(onPrintProject)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onPrintProject={onPrintProject}
              onPrintDonor={onPrintDonor}
              onDownloadProjectImage={onDownloadProjectImage}
              onDownloadDonorImage={onDownloadDonorImage}
              downloadingImageKey={downloadingImageKey}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-emerald-800" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {editingProject ? 'প্রকল্প সম্পাদনা' : 'নতুন প্রকল্প যোগ করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">প্রকল্পের নাম</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="যেমন: শীতবস্ত্র ও কম্বল বিতরণ প্রকল্প"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">বিভাগ</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">অবস্থা</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as WelfareProjectStatus })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">লক্ষ্যমাত্রা (৳)</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={form.targetAmount || ''}
                    onChange={(e) =>
                      setForm({ ...form, targetAmount: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">সংগৃহীত পরিমাণ (৳)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.raisedAmount}
                    onChange={(e) =>
                      setForm({ ...form, raisedAmount: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">উপকারভোগী সংখ্যা (জন)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.beneficiaries}
                    onChange={(e) =>
                      setForm({ ...form, beneficiaries: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">শুরুর তারিখ</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">নোট (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={form.note || ''}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="প্রকল্প সংক্রান্ত কোনো বিশেষ নোট থাকলে লিখুন..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="প্রকল্প মুছে ফেলবেন?"
        description={`আপনি কি "${deleteTarget?.title || ''}" প্রকল্পটি স্থায়ীভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={() => {
          if (deleteTarget) {
            onMutateData(
              (prev) => ({
                ...prev,
                projects: prev.projects.filter((p) => p.id !== deleteTarget.id),
              }),
              'প্রকল্প মুছে ফেলা'
            );
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

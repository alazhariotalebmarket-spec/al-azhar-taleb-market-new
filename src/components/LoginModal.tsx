import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, LogOut, ShieldCheck, UserCheck, X } from 'lucide-react';
import {
  ADMIN_EMAIL,
  USER_EMAIL,
  verifyAdminLogin,
  verifyUserLogin,
} from '../services/adminAuth';
import { DEFAULT_LOGO_URL, ORG_NAME, ORG_TAGLINE, UserRole } from '../types';
import { OrgLogo } from './OrgLogo';

interface LoginModalProps {
  open: boolean;
  currentRole: UserRole;
  logoUrl?: string;
  defaultTab?: 'user' | 'admin';
  lockedSectionLabel?: string;
  onLoginSuccess: (role: 'user' | 'admin') => void;
  onLogout: () => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  currentRole,
  logoUrl,
  defaultTab = 'user',
  lockedSectionLabel,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const activeLogoSrc = logoUrl || DEFAULT_LOGO_URL;
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(defaultTab);
  const [userIdentifier, setUserIdentifier] = useState(USER_EMAIL);
  const [userPassword, setUserPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
    setError('');
    setShowPassword(false);
  }, [open, defaultTab, lockedSectionLabel]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'user') {
      if (!userIdentifier.trim() || !userPassword) {
        setError('অনুগ্রহ করে ইউজার ইমেইল/আইডি এবং পাসওয়ার্ড লিখুন।');
        return;
      }
      if (verifyUserLogin(userIdentifier, userPassword)) {
        setError('');
        setUserPassword('');
        onLoginSuccess('user');
        return;
      }
      setError('ভুল ইউজার ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিন।');
      return;
    }

    if (!adminEmail.trim() || !adminPassword) {
      setError('অনুগ্রহ করে অ্যাডমিন ইমেইল ও পাসওয়ার্ড লিখুন।');
      return;
    }
    if (verifyAdminLogin(adminEmail, adminPassword)) {
      setError('');
      setAdminPassword('');
      onLoginSuccess('admin');
      return;
    }
    setError('ভুল অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিন।');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <div className="min-w-0">
              <h2
                id="login-modal-title"
                className="truncate font-display text-lg font-bold text-slate-900"
              >
                লগইন করুন
              </h2>
              <p className="truncate text-xs text-slate-500">
                {ORG_NAME} · {ORG_TAGLINE}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Locked Section Notice */}
          {lockedSectionLabel && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="font-bold text-amber-900">লগইন করুন</p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                  <span className="font-semibold">{lockedSectionLabel}</span> দেখার জন্য অনুগ্রহ করে ইউজার অথবা অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।
                </p>
              </div>
            </div>
          )}

          {/* Active User Session Card (when logged in as User) */}
          {currentRole === 'user' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-950">
                <UserCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-bold">ইউজার হিসেবে লগইন আছেন</p>
                  <p className="text-emerald-800">সকল হিসাব পেজ দেখতে পারবেন (শুধুমাত্র দেখার অনুমতি)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                লগআউট
              </button>
            </div>
          )}

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'user'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4 shrink-0" />
              ইউজার লগইন
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'admin'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              অ্যাডমিন লগইন
            </button>
          </div>

          {/* Role Helper Caption */}
          <p className="text-xs leading-relaxed text-slate-600">
            {activeTab === 'user'
              ? 'ইউজার লগইন করলে এয়ানত শীট, মাসিক ব্যয় ও আয়-ব্যয়সহ সকল পেজ দেখতে পারবেন।'
              : 'অ্যাডমিন লগইন করলে সকল হিসাব দেখা এবং তথ্য যোগ, পরিবর্তন ও পরিচালনা করতে পারবেন।'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'user' ? (
              <>
                <div>
                  <label
                    htmlFor="login-user-email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    ইউজার ইমেইল / আইডি
                  </label>
                  <input
                    id="login-user-email"
                    type="text"
                    value={userIdentifier}
                    onChange={(e) => setUserIdentifier(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                    placeholder={USER_EMAIL}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-user-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    পাসওয়ার্ড
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="login-user-password"
                      type={showPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                      placeholder="ইউজার পাসওয়ার্ড লিখুন"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="login-admin-email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    অ্যাডমিন ইমেইল
                  </label>
                  <input
                    id="login-admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                    placeholder={ADMIN_EMAIL}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-admin-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    পাসওয়ার্ড
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="login-admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                      placeholder="আপনার অ্যাডমিন পাসওয়ার্ড লিখুন"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shadow-xs"
              >
                <Lock className="h-4 w-4" />
                {activeTab === 'user' ? 'ইউজার লগইন করুন' : 'অ্যাডমিন প্যানেলে প্রবেশ করুন'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

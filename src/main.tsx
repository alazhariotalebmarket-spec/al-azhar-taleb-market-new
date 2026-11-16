import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Root render error:', error);
    try {
      const recoveredKey = 'al_azhar_render_recovered_v1';
      if (!sessionStorage.getItem(recoveredKey)) {
        sessionStorage.setItem(recoveredKey, '1');
        localStorage.removeItem('al_azhar_islami_sangstha_data_v2');
        localStorage.removeItem('al_azhar_islami_sangstha_data_v1');
        window.location.reload();
      }
    } catch {
      // Ignore storage errors in private mode
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h1 className="font-display text-lg font-bold text-slate-900">
              আল আজহার ইসলামী সংস্থা
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              পেজটি লোড করতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার রিলোড করুন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    try {
      const key = 'al_azhar_chunk_reload_v1';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        void reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

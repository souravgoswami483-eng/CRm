'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X, RefreshCw } from 'lucide-react';

export interface ChangeToastEvent {
  id: string;
  title: string;
  detail: string;
  status: 'processing' | 'success';
}

// Global dispatcher function that any component can call directly
export function notifyChange(detail: string = 'Updating studio records...', title: string = 'Changes are being made') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('crm-change', {
        detail: { title, detail },
      })
    );
  }
}

export default function ChangesToast() {
  const [toasts, setToasts] = useState<ChangeToastEvent[]>([]);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext might be silent until user interaction, safely ignore
    }
  };

  const addToast = (title: string, detail: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    playChime();

    const newToast: ChangeToastEvent = {
      id,
      title,
      detail,
      status: 'processing',
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 visible

    // After 600ms, mark as confirmed/applied
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'success' } : t))
      );
    }, 600);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // 1. Listen for manual custom change events
    const handleCustomChange = (e: any) => {
      const { title, detail } = e.detail || {};
      addToast(title || 'Changes are being made', detail || 'Saving updates in real-time...');
    };

    window.addEventListener('crm-change', handleCustomChange);

    // 2. Global fetch interceptor: automatically detect all non-GET API mutations (POST, PUT, PATCH, DELETE)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const method = (config?.method || 'GET').toUpperCase();
      const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';

      // Only intercept our app's mutating API endpoints
      if (
        (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') &&
        url.includes('/api/') &&
        !url.includes('/api/auth/login') // Login has its own feedback
      ) {
        let label = 'Updating studio records...';
        if (url.includes('/api/clients')) label = 'Client profile & access changes being saved';
        else if (url.includes('/api/projects')) label = 'Project pipeline & tasks being updated';
        else if (url.includes('/api/files')) label = 'Deliverable files & feedback comments being updated';
        else if (url.includes('/api/invoices')) label = 'Invoice totals & billing records being updated';
        else if (url.includes('/api/payments')) label = 'Payment ledger & authentication being updated';
        else if (url.includes('/api/settings')) label = 'Studio configurations & branding being saved';
        else if (url.includes('/api/messages')) label = 'New studio message being sent';

        addToast('Changes are being made', label);
      }

      return originalFetch(...args);
    };

    return () => {
      window.removeEventListener('crm-change', handleCustomChange);
      window.fetch = originalFetch;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 sm:right-8 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-violet-400/40 dark:border-violet-500/40 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden"
        >
          {/* Top Progress countdown line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-400 animate-[shrink_4s_linear_forwards]" />
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors shadow-md ${
                  toast.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20'
                    : 'bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/40 shadow-violet-500/20'
                }`}
              >
                {toast.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-white">
                    {toast.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      toast.status === 'success'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                    }`}
                  >
                    {toast.status === 'success' ? 'Saved' : 'In Progress'}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  {toast.detail}
                </p>
              </div>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client portal caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-8 shadow-xl space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Client Portal Render Error
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            A temporary display issue occurred. Your files and invoices remain completely secure.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Action</span>
          </button>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Client Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

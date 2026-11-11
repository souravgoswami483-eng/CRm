'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global critical error caught:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-zinc-950 text-white min-h-screen flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Studio Workspace Reconnecting
            </h2>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              The application recovered from an unexpected client-side runtime error. Click below to reload the session.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

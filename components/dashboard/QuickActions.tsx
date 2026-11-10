'use client';

import React from 'react';
import {
  UserPlus,
  FolderPlus,
  UploadCloud,
  FilePlus2,
  DollarSign,
} from 'lucide-react';

interface QuickActionsProps {
  onNewClient: () => void;
  onNewProject: () => void;
  onUploadFile: () => void;
  onCreateInvoice: () => void;
  onRecordPayment: () => void;
}

export default function QuickActions({
  onNewClient,
  onNewProject,
  onUploadFile,
  onCreateInvoice,
  onRecordPayment,
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        onClick={onNewClient}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <UserPlus className="h-4 w-4" />
        <span>+ New Client</span>
      </button>

      <button
        onClick={onNewProject}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <FolderPlus className="h-4 w-4" />
        <span>+ New Project</span>
      </button>

      <button
        onClick={onUploadFile}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
      >
        <UploadCloud className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        <span>+ Upload File</span>
      </button>

      <button
        onClick={onCreateInvoice}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
      >
        <FilePlus2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span>+ Create Invoice</span>
      </button>

      <button
        onClick={onRecordPayment}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
      >
        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>+ Record Payment</span>
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  History,
  CheckCircle2,
  MessageSquare,
  Eye,
  LogIn,
  DollarSign,
  FileUp,
  ChevronRight,
} from 'lucide-react';
import { ActivityLog } from '@/types';

interface RecentActivityProps {
  activities: ActivityLog[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Client Logged In':
      case 'Admin Logged In':
        return <LogIn className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />;
      case 'File Approved':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Pinned Comment':
      case 'Video Timestamp Feedback':
      case 'File Comment':
        return <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case 'File Viewed':
      case 'Invoice Viewed':
        return <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'Payment Recorded':
        return <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Version Uploaded':
      case 'File Uploaded':
        return <FileUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />;
      default:
        return <History className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Live Studio Activity Feed</h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {activities.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              No recent activity recorded
            </p>
          ) : (
            activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mt-0.5 shadow-sm">
                  {getActionIcon(act.action)}
                </div>

                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                    {act.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-4 text-right">
        <Link
          href="/admin/activity"
          className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
        >
          <span>View complete audit trail</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

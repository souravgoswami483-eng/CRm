'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Project } from '@/types';

interface DeadlinesWidgetProps {
  projects: Project[];
}

export default function DeadlinesWidget({ projects }: DeadlinesWidgetProps) {
  const today = new Date();

  // Find projects with deadlines in next 10 days
  const upcoming = projects
    .filter((p) => p.status !== 'Approved' && p.status !== 'Final Delivered' && p.deadline)
    .map((p) => {
      const deadlineDate = new Date(p.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...p, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 5);

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Upcoming Deadlines</h3>
          </div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Next 7–10 Days</span>
        </div>

        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              No imminent deadlines this week. All projects on track!
            </p>
          ) : (
            upcoming.map((proj) => {
              const isUrgent = proj.diffDays <= 3;
              const isDueToday = proj.diffDays === 0;

              return (
                <div
                  key={proj.id}
                  className="group flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 hover:border-violet-400 dark:hover:border-violet-500/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200 truncate">
                        {proj.title}
                      </span>
                      <span className="text-[10px] rounded px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 font-semibold">
                        {proj.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {proj.clientCompany} • Due: {proj.deadline}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDueToday
                          ? 'bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                          : isUrgent
                          ? 'bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {isDueToday ? 'Today!' : `${proj.diffDays}d left`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-4 text-right">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
        >
          <span>View all work pipelines</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

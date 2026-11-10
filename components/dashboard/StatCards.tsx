'use client';

import React from 'react';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Users,
  FolderKanban,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalRevenueAllTime: number;
    totalRevenueThisMonth: number;
    totalRevenueThisYear: number;
    totalPending: number;
    overdueAmount: number;
    overdueCount: number;
    maxDaysOverdue: number;
    activeClientsCount: number;
    activeProjectsCount: number;
  };
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue Card */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-br from-violet-50/70 via-white to-zinc-50 dark:from-violet-950/30 dark:via-zinc-900/90 dark:to-zinc-950 p-5 shadow-sm dark:shadow-xl dark:shadow-violet-950/20 backdrop-blur group hover:border-violet-400 dark:hover:border-violet-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
            Total Revenue
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 group-hover:scale-110 transition-transform">
            <span className="font-extrabold text-sm">₹</span>
          </div>
        </div>
        <div className="mt-3 text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          ₹{stats.totalRevenueAllTime.toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800/80 pt-2">
          <span>This month: <strong className="text-zinc-800 dark:text-zinc-200">₹{stats.totalRevenueThisMonth.toLocaleString('en-IN')}</strong></span>
          <span>YTD: <strong className="text-violet-600 dark:text-violet-300">₹{stats.totalRevenueThisYear.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 2. Outstanding / Pending Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/70 via-white to-zinc-50 dark:from-amber-950/20 dark:via-zinc-900/90 dark:to-zinc-950 p-5 shadow-sm dark:shadow-xl backdrop-blur group hover:border-amber-400 dark:hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Pending Balance
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 group-hover:scale-110 transition-transform">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          ₹{stats.totalPending.toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400/90 border-t border-zinc-200 dark:border-zinc-800/80 pt-2 font-medium">
          <span>Awaiting invoice settlement from clients</span>
        </div>
      </div>

      {/* 3. Overdue Invoices (Highlighted in red) */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50 via-white to-zinc-50 dark:from-rose-950/30 dark:via-zinc-900/90 dark:to-zinc-950 p-5 shadow-sm dark:shadow-xl backdrop-blur group hover:border-rose-400 dark:hover:border-rose-500/60 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Overdue Invoices
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-600/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl lg:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-300">
          ₹{stats.overdueAmount.toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 border-t border-zinc-200 dark:border-zinc-800/80 pt-2">
          <span className="font-bold">{stats.overdueCount} invoice overdue</span>
          <span className="bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-800/60 px-1.5 py-0.5 rounded text-[10px] text-rose-800 dark:text-rose-200 font-bold">
            {stats.maxDaysOverdue} days overdue
          </span>
        </div>
      </div>

      {/* 4. Active Clients & Work */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50/70 via-white to-zinc-50 dark:from-cyan-950/20 dark:via-zinc-900/90 dark:to-zinc-950 p-5 shadow-sm dark:shadow-xl backdrop-blur group hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Clients & Workload
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-600/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 group-hover:scale-110 transition-transform">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            {stats.activeClientsCount}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Active Clients</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800/80 pt-2">
          <span>Active Projects: <strong className="text-cyan-700 dark:text-cyan-300 font-bold">{stats.activeProjectsCount}</strong></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% capacity</span>
        </div>
      </div>
    </div>
  );
}

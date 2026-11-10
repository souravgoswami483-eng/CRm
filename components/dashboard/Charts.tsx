'use client';

import React from 'react';

interface ChartsProps {
  monthlyIncome: { month: string; amount: number }[];
  paidVsPending: { paid: number; pending: number };
  topClients: { name: string; company: string; revenue: number }[];
}

export default function DashboardCharts({ monthlyIncome, paidVsPending, topClients }: ChartsProps) {
  // Max for monthly bar chart
  const maxMonth = Math.max(...monthlyIncome.map((m) => m.amount), 1);
  const totalFinancials = (paidVsPending.paid + paidVsPending.pending) || 1;
  const paidPercent = Math.round((paidVsPending.paid / totalFinancials) * 100);
  const pendingPercent = 100 - paidPercent;

  // Max for client horizontal bar chart
  const maxClient = Math.max(...topClients.map((c) => c.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Monthly Income Bar Chart */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Monthly Revenue</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Cashflow received over past 6 months</p>
          </div>
          <span className="text-xs font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 px-2 py-0.5 rounded-full">
            INR (₹)
          </span>
        </div>

        <div className="mt-6 flex h-48 items-end justify-between gap-3 px-2">
          {monthlyIncome.map((item) => {
            const heightPercent = Math.max(12, Math.round((item.amount / maxMonth) * 100));
            return (
              <div key={item.month} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
                {/* Tooltip value on hover */}
                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-violet-700 dark:text-violet-300 transition-opacity bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shadow-sm -mb-1">
                  ₹{(item.amount / 1000).toFixed(0)}k
                </span>
                <div className="w-full relative flex items-end justify-center">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-400 dark:from-violet-700 dark:to-cyan-400 group-hover:from-violet-500 group-hover:to-cyan-300 transition-all duration-300 shadow-sm"
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Paid vs Pending Donut Visualization */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Paid vs Pending</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Collection status ratio</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {paidPercent}% Cleared
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            {/* SVG Donut Circle */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-100 dark:text-zinc-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${paidPercent}, 100`}
                strokeWidth="4.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{paidPercent}%</span>
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Collected</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 w-full text-xs">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20 p-3">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Paid Received</span>
              </div>
              <div className="mt-1 font-black text-zinc-900 dark:text-zinc-100 text-sm">
                ₹{paidVsPending.paid.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/20 p-3">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Pending Due</span>
              </div>
              <div className="mt-1 font-black text-zinc-900 dark:text-zinc-100 text-sm">
                ₹{paidVsPending.pending.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Revenue by Client (Top 5) */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Top Revenue Clients</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">High-value studio relationships</p>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Ranked</span>
        </div>

        <div className="mt-4 space-y-3.5">
          {topClients.map((client, idx) => {
            const width = Math.max(10, Math.round((client.revenue / maxClient) * 100));
            return (
              <div key={client.company} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                    {idx + 1}. {client.company}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{client.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${width}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

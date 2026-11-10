'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FolderKanban,
  FileCheck2,
  Receipt,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Project, CreativeFile, Invoice, Payment } from '@/types';

export default function ClientPortalHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CreativeFile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const clientId = user?.clientId || user?.id || 'client_1';

  const loadClientData = async () => {
    try {
      const [pRes, fRes, iRes, payRes] = await Promise.all([
        fetch(`/api/projects?clientId=${user?.id || 'client_1'}`),
        fetch(`/api/files?clientId=${user?.id || 'client_1'}`),
        fetch(`/api/invoices?clientId=${user?.id || 'client_1'}`),
        fetch(`/api/payments?clientId=${user?.id || 'client_1'}`),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        setFiles(fData.files || []);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setInvoices(iData.invoices || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [user]);

  // Files awaiting review
  const pendingReviewFiles = files.filter(
    (f) => f.status === 'For Review' || f.status === 'Draft'
  );

  // Financial totals
  const totalBilled = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const balanceDue = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-50 via-white to-blue-50 dark:from-cyan-950/40 dark:via-zinc-900/90 dark:to-zinc-950 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Client'}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg ring-2 ring-zinc-200 dark:ring-zinc-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  Welcome to your Portal
                </span>
                <span className="rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800/40 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300">
                  {user?.clientId || 'CL-2026-0042'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                {user?.companyName || 'Zenith Techworks'}
              </h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Primary Contact: {user?.name || 'Alex Rivers'} • Production Studio: Vortex Creative Labs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal/files"
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all flex items-center gap-2"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Review Creatives</span>
            </Link>
            <Link
              href="/portal/invoices"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Invoices & Pay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Files Awaiting Review Highlight Banner */}
      {pendingReviewFiles.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {pendingReviewFiles.length} Creative {pendingReviewFiles.length === 1 ? 'Asset' : 'Assets'} Awaiting Your Feedback
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Click on the designs to pin your feedback spots or leave frame-accurate video comments.
              </p>
            </div>
          </div>

          <Link
            href={`/portal/files?id=${pendingReviewFiles[0]?.id}`}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 text-xs shadow transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Review Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Financial Snapshot: Billed, Paid, Balance Due */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Billed
          </span>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">All invoices generated</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Paid
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Cleared settlements</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Balance Due
          </span>
          <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">
            ₹{balanceDue.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">Pending settlement</p>
        </div>
      </div>

      {/* Active Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Active Projects & Status</h2>
          </div>
          <Link
            href="/portal/projects"
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
          >
            View all projects →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const completedCount = proj.tasks?.filter((t) => t.completed).length || 0;
            const totalTasks = proj.tasks?.length || 1;
            const progressPercent = Math.round((completedCount / totalTasks) * 100);

            return (
              <div
                key={proj.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm backdrop-blur hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 px-2 py-0.5 rounded">
                      {proj.type}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                    {proj.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Deliverable Progress</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                    <span>Deadline: {proj.deadline}</span>
                    <span className="font-mono">Rev: {proj.revisionsUsed}/{proj.revisionsAllowed} used</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gallery of Recent Creatives */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Creatives & Video Deliverables</h2>
          </div>
          <Link
            href="/portal/files"
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
          >
            Open review gallery →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Link
              key={file.id}
              href={`/portal/files?id=${file.id}`}
              className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden hover:border-violet-500/40 transition-all flex flex-col justify-between shadow-sm"
            >
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                <img
                  src={file.thumbnailUrl || file.fileUrl}
                  alt={file.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur ${
                      file.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                        : 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors truncate">
                  {file.title}
                </h4>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Version {file.currentVersion}</span>
                  <span>{file.comments?.length || 0} feedback notes</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

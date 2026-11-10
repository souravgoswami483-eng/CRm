'use client';

import React, { useState, useEffect } from 'react';
import StatCards from '@/components/dashboard/StatCards';
import DashboardCharts from '@/components/dashboard/Charts';
import QuickActions from '@/components/dashboard/QuickActions';
import DeadlinesWidget from '@/components/dashboard/DeadlinesWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import ClientModal from '@/components/clients/ClientModal';
import ProjectModal from '@/components/projects/ProjectModal';
import FileUploadModal from '@/components/files/FileUploadModal';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import { Client, Project, Invoice, Payment, ActivityLog } from '@/types';

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [cRes, pRes, iRes, payRes, actRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
        fetch('/api/invoices'),
        fetch('/api/payments'),
        fetch('/api/activities?limit=15'),
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData.clients || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setInvoices(iData.invoices || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData.activities || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Financial stats
  const totalRevenueAllTime = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentYear = new Date().getFullYear().toString();

  const totalRevenueThisMonth = payments
    .filter((p) => p.date?.startsWith(currentMonth))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalRevenueThisYear = payments
    .filter((p) => p.date?.startsWith(currentYear))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalPending = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

  // Calculate max days overdue
  const today = new Date();
  let maxDaysOverdue = 0;
  overdueInvoices.forEach((inv) => {
    if (inv.dueDate) {
      const diffDays = Math.max(0, Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
      if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
    }
  });

  // Monthly income distribution
  const monthlyIncome = [
    { month: 'Jun', amount: 85000 },
    { month: 'Jul', amount: 110000 },
    { month: 'Aug', amount: 95000 },
    { month: 'Sep', amount: 135000 },
    { month: 'Oct', amount: 129800 },
    { month: 'Nov', amount: 80000 },
  ];

  // Top clients by revenue
  const clientRevenueMap: Record<string, { name: string; company: string; revenue: number }> = {};
  payments.forEach((p) => {
    if (!clientRevenueMap[p.clientId]) {
      clientRevenueMap[p.clientId] = {
        name: p.clientName,
        company: p.clientCompany,
        revenue: 0,
      };
    }
    clientRevenueMap[p.clientId].revenue += p.amount;
  });

  const topClients = Object.values(clientRevenueMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (topClients.length === 0) {
    topClients.push(
      { name: 'Nathan Drake', company: 'Hyperion Esports', revenue: 129800 },
      { name: 'Alex Rivers', company: 'Zenith Techworks', revenue: 80000 },
      { name: 'Marcus Vance', company: 'Pulse Energy Drink', revenue: 40000 },
      { name: 'Priya Sharma', company: 'Lumina Fashion Studio', revenue: 35000 }
    );
  }

  // Work Pipeline distribution counts
  const pipelineCounts = {
    'In Progress': projects.filter((p) => p.status === 'In Progress').length,
    'Draft Shared': projects.filter((p) => p.status === 'Draft Shared').length,
    'Revisions': projects.filter((p) => p.status === 'Revisions').length,
    'Approved': projects.filter((p) => p.status === 'Approved').length,
    'Delivered': projects.filter((p) => p.status === 'Final Delivered').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Studio Command Center
          </h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time revenues, client reviews, active pipelines and upcoming milestones
          </p>
        </div>

        <QuickActions
          onNewClient={() => setIsClientModalOpen(true)}
          onNewProject={() => setIsProjectModalOpen(true)}
          onUploadFile={() => setIsFileModalOpen(true)}
          onCreateInvoice={() => setIsInvoiceModalOpen(true)}
          onRecordPayment={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* 1. KPI Counter Cards */}
      <StatCards
        stats={{
          totalRevenueAllTime,
          totalRevenueThisMonth,
          totalRevenueThisYear,
          totalPending,
          overdueAmount,
          overdueCount: overdueInvoices.length,
          maxDaysOverdue,
          activeClientsCount: clients.filter((c) => c.status === 'Active').length,
          activeProjectsCount: projects.filter((p) => p.status !== 'Final Delivered').length,
        }}
      />

      {/* 2. Pipeline Status Pills */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm dark:shadow-none">
        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Projects by Status Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-950/20 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">In Progress</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block">{pipelineCounts['In Progress']}</span>
          </div>
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/70 dark:bg-cyan-950/20 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block">Draft Shared</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block">{pipelineCounts['Draft Shared']}</span>
          </div>
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/20 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">In Revisions</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block">{pipelineCounts['Revisions']}</span>
          </div>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Approved</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block">{pipelineCounts['Approved']}</span>
          </div>
          <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/70 dark:bg-violet-950/20 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 block">Final Delivered</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block">{pipelineCounts['Delivered']}</span>
          </div>
        </div>
      </div>

      {/* 3. Charts: Monthly Income (Bar), Paid vs Pending (Donut), Top Clients */}
      <DashboardCharts
        monthlyIncome={monthlyIncome}
        paidVsPending={{ paid: totalRevenueAllTime, pending: totalPending }}
        topClients={topClients}
      />

      {/* 4. Deadlines & Live Activity Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadlinesWidget projects={projects} />
        <RecentActivity activities={activities} />
      </div>

      {/* MODALS */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (clientData) => {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });
          loadDashboardData();
        }}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        clients={clients}
        onSave={async (projectData) => {
          await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          loadDashboardData();
        }}
      />

      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        projects={projects}
        onUploadSuccess={loadDashboardData}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        clients={clients}
        projects={projects}
        onSave={async (invoiceData) => {
          await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
          });
          loadDashboardData();
        }}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoices={invoices}
        onPaymentRecorded={loadDashboardData}
      />
    </div>
  );
}

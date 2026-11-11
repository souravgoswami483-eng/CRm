'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Share2,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Invoice, Client, Project } from '@/types';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { useAuth } from '@/lib/auth-context';

export default function InvoicesPage() {
  const { settings } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const loadInvoices = async () => {
    try {
      const [iRes, cRes, pRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients'),
        fetch('/api/projects'),
      ]);

      if (iRes.ok) {
        const iData = await iRes.json();
        setInvoices(iData.invoices || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData.clients || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDownloadPDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, settings || undefined);
  };

  const handleConvertToInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convertToInvoice: true }),
      });
      if (res.ok) {
        loadInvoices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // WhatsApp share link
  const handleWhatsAppShare = (inv: Invoice) => {
    const text = encodeURIComponent(
      `Hello ${inv.clientName},\n\nHere is your creative services invoice ${inv.invoiceNumber} from Vortex Creative Labs for ₹${(inv.total || 0).toLocaleString('en-IN')}.\nDue Date: ${inv.dueDate}.\n\nPlease let us know once settled!\n\nBest,\nSourav Roy (Vortex Creative)`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300';
      case 'Partially Paid':
        return 'bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-500/40 text-blue-800 dark:text-blue-300';
      case 'Sent':
        return 'bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300';
      case 'Viewed':
        return 'bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300';
      case 'Overdue':
        return 'bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 animate-pulse';
      case 'Draft':
        return 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400';
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);

  const filteredInvoices = invoices.filter((i) => {
    const invNum = i.invoiceNumber || '';
    const comp = i.clientCompany || '';
    const name = i.clientName || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      invNum.toLowerCase().includes(q) ||
      comp.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q);

    const isOverdue =
      i.status === 'Overdue' ||
      (i.dueDate &&
        i.dueDate < todayStr &&
        (i.balanceDue || 0) > 0 &&
        i.status !== 'Paid' &&
        i.status !== 'Draft' &&
        i.status !== 'Cancelled');

    const matchesStatus = !statusFilter || (statusFilter === 'Overdue' ? isOverdue : i.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Invoices & Quotations</h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            GST compliant invoices, milestone breakdowns, recurring retainers & instant PDF export
          </p>
        </div>

        <button
          onClick={() => {
            loadInvoices(); // Refetch clients and projects whenever form opens
            setEditingInvoice(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm dark:shadow-none backdrop-blur">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by invoice # (e.g. INV-2026-0105), client or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Sent">Sent</option>
          <option value="Viewed">Viewed</option>
          <option value="Overdue">Overdue (Action Required)</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-2xl backdrop-blur">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-950/80 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Invoice # & Date</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Balance Due</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">PDF & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 font-mono group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                      <span>{inv.invoiceNumber}</span>
                      {inv.isEstimate && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-1 rounded uppercase font-bold">
                          Quote
                        </span>
                      )}
                      {inv.isRecurring && (
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 px-1 rounded font-bold">
                          Retainer
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{inv.date}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-200">{inv.clientCompany}</div>
                    <div className="text-[10px] text-zinc-500">{inv.clientName}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    {inv.dueDate}
                  </td>

                  <td className="py-3.5 px-4 font-black text-zinc-900 dark:text-zinc-200">
                    ₹{(inv.total || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-black ${
                        (inv.balanceDue || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {(() => {
                      const effectiveStatus = (inv.status === 'Overdue' || (inv.dueDate && inv.dueDate < todayStr && (inv.balanceDue || 0) > 0 && inv.status !== 'Paid' && inv.status !== 'Draft' && inv.status !== 'Cancelled')) ? 'Overdue' : inv.status;
                      return (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(effectiveStatus)}`}>
                          {effectiveStatus}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.isEstimate && (
                        <button
                          onClick={() => handleConvertToInvoice(inv.id)}
                          className="px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-600/30 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-500/40 text-[10px] font-bold hover:bg-violet-200 dark:hover:bg-violet-600/50"
                          title="Convert quotation into official invoice"
                        >
                          Convert → Invoice
                        </button>
                      )}

                      <button
                        onClick={() => handleWhatsAppShare(inv)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Share via WhatsApp"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                        title="Download Professional PDF"
                      >
                        <Download className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE INVOICE MODAL */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        clients={clients}
        projects={projects}
        initialData={editingInvoice}
        onSave={async (invoiceData) => {
          await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
          });
          loadInvoices();
        }}
      />
    </div>
  );
}

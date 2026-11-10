'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  FileCheck2,
  Send,
  Building,
} from 'lucide-react';
import { Payment, Invoice, PaymentMode } from '@/types';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import { generatePaymentReceiptPDF } from '@/lib/pdf-generator';
import { useAuth } from '@/lib/auth-context';

export default function PaymentsPage() {
  const { settings } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<any>({
    totalReceived: 0,
    totalPending: 0,
    overdueAmount: 0,
    clientOutstanding: [],
  });

  const [loading, setLoading] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderSent, setReminderSent] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      const [payRes, invRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/invoices'),
      ]);

      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments || []);
        if (payData.summary) setSummary(payData.summary);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleDownloadReceipt = (payment: Payment) => {
    generatePaymentReceiptPDF(payment, settings || undefined);
  };

  const triggerPaymentReminder = (clientName: string, amount: number) => {
    setReminderSent(`Automated payment reminder sent to ${clientName} for ₹${amount.toLocaleString('en-IN')}`);
    setTimeout(() => setReminderSent(null), 5000);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = !modeFilter || p.mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Payments & Financial Ledger</h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time collections, client balances, instant PDF receipts & payment tracking
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all self-start sm:self-auto"
        >
          <DollarSign className="h-4 w-4" />
          <span>+ Record Client Payment</span>
        </button>
      </div>

      {reminderSent && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="font-semibold">✓ {reminderSent}</span>
          <button onClick={() => setReminderSent(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-zinc-50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-950 p-6 shadow-sm dark:shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Received
          </span>
          <div className="mt-2 text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white">
            ₹{(summary.totalReceived || 0).toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Total settled lifetime collections</p>
        </div>

        <div className="rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 via-white to-zinc-50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-950 p-6 shadow-sm dark:shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Total Pending (Yet to Come)
          </span>
          <div className="mt-2 text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white">
            ₹{(summary.totalPending || 0).toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Awaiting clearance from clients</p>
        </div>

        <div className="rounded-3xl border border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50 via-white to-zinc-50 dark:from-rose-950/30 dark:via-zinc-900 dark:to-zinc-950 p-6 shadow-sm dark:shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Overdue Balance
          </span>
          <div className="mt-2 text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-300">
            ₹{(summary.overdueAmount || 0).toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">Exceeded invoice payment term</p>
        </div>
      </div>

      {/* Client-wise Outstanding Breakdown */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Client-Wise Outstanding Balance Breakdown
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Automatic Real-Time Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {summary.clientOutstanding?.map((c: any) => (
            <div
              key={c.clientId}
              className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200 truncate">{c.companyName}</span>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-bold">{c.clientCode}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500">Pending Due:</span>
                  <span
                    className={`font-black ${
                      c.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    ₹{c.pending.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {c.pending > 0 && (
                <button
                  onClick={() => triggerPaymentReminder(c.companyName, c.pending)}
                  className="mt-3 w-full py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Send Reminder Email</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search and Mode Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm dark:shadow-none backdrop-blur">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search payments by client, invoice # or transaction reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
        >
          <option value="">All Payment Modes</option>
          <option value="UPI">UPI (Google Pay, PhonePe...)</option>
          <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
          <option value="Card">Card</option>
          <option value="Razorpay">Razorpay</option>
          <option value="PayPal">PayPal</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      {/* Payment History Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-2xl backdrop-blur">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-950/80 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Transaction / UTR</th>
              <th className="py-3 px-4">Amount Paid</th>
              <th className="py-3 px-4 text-right">Receipt (PDF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                  <td className="py-3.5 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                    <div className="font-bold">{pay.date}</div>
                    <div className="text-[10px] text-zinc-500">{pay.time}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{pay.clientCompany}</div>
                    <div className="text-[10px] text-zinc-500">{pay.clientName}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-violet-700 dark:text-violet-400">
                    {pay.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {pay.mode}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
                    {pay.transactionRef}
                  </td>

                  <td className="py-3.5 px-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadReceipt(pay)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 transition-colors shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        invoices={invoices}
        onPaymentRecorded={loadPayments}
      />
    </div>
  );
}

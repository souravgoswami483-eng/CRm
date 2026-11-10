'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Invoice, Payment } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { generateInvoicePDF, generatePaymentReceiptPDF } from '@/lib/pdf-generator';

export default function ClientInvoicesPage() {
  const { user, settings } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<Payment | null>(null);

  const loadData = async () => {
    try {
      const [iRes, pRes] = await Promise.all([
        fetch(`/api/invoices?clientId=${user?.id || 'client_1'}`),
        fetch(`/api/payments?clientId=${user?.id || 'client_1'}`),
      ]);

      if (iRes.ok) {
        const iData = await iRes.json();
        setInvoices(iData.invoices || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPayments(pData.payments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDownloadInvoicePDF = (inv: Invoice) => {
    generateInvoicePDF(inv, settings || undefined);
  };

  const handleDownloadPaymentReceipt = (pay: Payment) => {
    generatePaymentReceiptPDF(pay, settings || undefined);
  };

  const openPayModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPayingAmount(inv.balanceDue);
    setPaymentSuccessReceipt(null);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || payingAmount <= 0) return;
    setPaymentProcessing(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceForPayment.id,
          amount: payingAmount,
          mode: paymentMode,
          transactionRef: `GATEWAY/PAY/${Date.now().toString().slice(-8)}`,
          recordedBy: user?.id,
          recordedByName: user?.name,
          recordedByRole: 'CLIENT',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentSuccessReceipt(data.payment);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const totalBilled = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
  const balanceDue = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Invoices & Direct Settlement</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Review itemized invoices, download official GST tax receipts, or settle via UPI and Cards
        </p>
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Invoiced</span>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">₹{totalBilled.toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Settled to Date</span>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">₹{totalPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Current Balance Due</span>
          <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">₹{balanceDue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur transition-colors">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
            Your Invoices
          </h3>
          <span className="text-[11px] text-zinc-500">{invoices.length} issued</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{inv.date}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">{inv.dueDate}</td>
                  <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-zinc-100">
                    ₹{inv.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                    ₹{inv.balanceDue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300'
                          : 'bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadInvoicePDF(inv)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-xs"
                        title="Download PDF Invoice"
                      >
                        <Download className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>PDF</span>
                      </button>

                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => openPayModal(inv)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Now</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur transition-colors">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
            Payment Receipts & Clearance History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Transaction UTR</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                    {p.date} at {p.time}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">{p.invoiceNumber}</td>
                  <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{p.mode}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{p.transactionRef}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDownloadPaymentReceipt(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-xs"
                    >
                      <Download className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Receipt PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT GATEWAY / INSTANT PAY MODAL */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl transition-colors">
            {paymentSuccessReceipt ? (
              <div className="text-center py-6 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Payment Confirmed!</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Thank you! Your payment of ₹{paymentSuccessReceipt.amount.toLocaleString('en-IN')} for {paymentSuccessReceipt.invoiceNumber} has been received and credited.
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => handleDownloadPaymentReceipt(paymentSuccessReceipt)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Official PDF Receipt</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceForPayment(null)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Instant Payment Portal</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceForPayment(null)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Invoice:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{selectedInvoiceForPayment.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Balance Due:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">₹{selectedInvoiceForPayment.balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Amount to Pay (INR ₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedInvoiceForPayment.balanceDue}
                    value={payingAmount}
                    onChange={(e) => setPayingAmount(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Payment Gateway Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="UPI">Instant UPI (GPay / PhonePe / Paytm / BHIM)</option>
                    <option value="Razorpay">Razorpay Checkout (Credit/Debit/Netbanking)</option>
                    <option value="Bank Transfer">Direct Bank IMPS / NEFT</option>
                  </select>
                </div>

                {/* Studio UPI details preview */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold">Studio VPA: {settings?.upiId || 'sourav.vortex@okhdfcbank'}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Account: Vortex Creative Labs (HDFC Bank)</div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceForPayment(null)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>{paymentProcessing ? 'Authorizing Payment...' : `Authorize ₹${payingAmount.toLocaleString('en-IN')}`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

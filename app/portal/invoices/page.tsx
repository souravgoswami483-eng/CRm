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
  Clock,
  Info,
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
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<Payment | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
    if (pay.status === 'Pending Confirmation') return;
    generatePaymentReceiptPDF(pay, settings || undefined);
  };

  const openPayModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPayingAmount(inv.balanceDue || inv.total || 0);
    setTransactionRef(`UPI/UTR/${Date.now().toString().slice(-8)}`);
    setPaymentNotes('');
    setPaymentSuccessReceipt(null);
    setPaymentError(null);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!selectedInvoiceForPayment) return;

    const amt = Number(payingAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    const maxAllowed = selectedInvoiceForPayment.balanceDue || selectedInvoiceForPayment.total || 0;
    if (amt > maxAllowed) {
      setPaymentError(`Payment amount cannot exceed the pending balance of ₹${maxAllowed.toLocaleString('en-IN')}.`);
      return;
    }

    if (!transactionRef || transactionRef.trim().length < 3) {
      setPaymentError('Please enter a valid Transaction / UTR reference (at least 3 characters).');
      return;
    }

    setPaymentProcessing(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceForPayment.id,
          amount: amt,
          mode: paymentMode,
          transactionRef: transactionRef.trim(),
          notes: paymentNotes.trim() || `Client payment submission of ₹${amt}`,
          recordedBy: user?.id,
          recordedByName: user?.name,
          recordedByRole: 'CLIENT',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentSuccessReceipt(data.payment);
        loadData();
      } else {
        const errData = await res.json();
        setPaymentError(errData.error || 'Failed to submit payment request.');
      }
    } catch (e: any) {
      console.error(e);
      setPaymentError(e.message || 'An unexpected network error occurred.');
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
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          Invoices & Direct Settlement
        </h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Review itemized invoices, download official GST tax receipts, or submit custom milestone &amp; full payments
        </p>
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Invoiced</span>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">₹{(totalBilled || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Settled to Date</span>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">₹{(totalPaid || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-5 shadow-sm backdrop-blur transition-colors">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Current Balance Due</span>
          <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">₹{(balanceDue || 0).toLocaleString('en-IN')}</div>
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
              {invoices.map((inv) => {
                const hasPendingVerification = payments.some(
                  (p) => p.invoiceId === inv.id && p.status === 'Pending Confirmation'
                );

                return (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{inv.date}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-zinc-100">
                      ₹{(inv.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                      <div>₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</div>
                      {hasPendingVerification && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Verification in progress</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const todayStr = new Date().toISOString().substring(0, 10);
                        const isOverdue = inv.status === 'Overdue' || (inv.dueDate && inv.dueDate < todayStr && (inv.balanceDue || 0) > 0 && inv.status !== 'Paid' && inv.status !== 'Draft' && inv.status !== 'Cancelled');
                        const displayStatus = isOverdue ? 'Overdue' : inv.status;
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              displayStatus === 'Paid'
                                ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                                : displayStatus === 'Overdue'
                                ? 'bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 animate-pulse'
                                : 'bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300'
                            }`}
                          >
                            {displayStatus}
                          </span>
                        );
                      })()}
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
                            <span>Pay / Settle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History & Clearance Status */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur transition-colors">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
            Payment Submissions &amp; Clearance History
          </h3>
          <span className="text-[11px] text-zinc-500">Requires Admin Authentication</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Transaction UTR</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Authentication Status</th>
                <th className="py-3 px-4 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    No payment records submitted yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPending = p.status === 'Pending Confirmation';

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                        {p.date} at {p.time}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{p.mode}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{p.transactionRef}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            <Clock className="h-3 w-3 animate-spin text-amber-600" />
                            <span>Pending Admin Confirmation</span>
                          </span>
                        ) : p.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            <span>Verification Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Authenticated &amp; Settled</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <span className="text-[11px] text-zinc-400 italic">
                            Receipt unlocks upon admin approval
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDownloadPaymentReceipt(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-xs"
                          >
                            <Download className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Receipt PDF</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT & CONFIRMATION REQUEST MODAL */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl transition-colors">
            {paymentSuccessReceipt ? (
              <div className="text-center py-5 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 mx-auto">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Payment Confirmation Requested!
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Your payment submission of{' '}
                  <strong className="text-zinc-900 dark:text-white">
                    ₹{(paymentSuccessReceipt.amount || 0).toLocaleString('en-IN')}
                  </strong>{' '}
                  for <strong>{paymentSuccessReceipt.invoiceNumber}</strong> has been submitted with reference{' '}
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                    {paymentSuccessReceipt.transactionRef}
                  </span>.
                </p>

                <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-left text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>Awaiting Admin Authentication</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                    The payment will NOT show as completed and the pending balance will NOT be cleared until Studio Director{' '}
                    <strong>Sourav Roy</strong> verifies and authenticates the transaction in the admin portal. Once authenticated, your official GST tax receipt will be available immediately.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => setSelectedInvoiceForPayment(null)}
                    className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 shadow"
                  >
                    Got It &amp; Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSimulatePayment} noValidate className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Submit Payment Confirmation</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceForPayment(null)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Invoice:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{selectedInvoiceForPayment.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Invoice Amount:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">₹{(selectedInvoiceForPayment.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Balance Due:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">₹{(selectedInvoiceForPayment.balanceDue || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Amount to Pay (Custom Partial or Full) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Amount You Are Paying (INR ₹) *
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      Balance: ₹{(selectedInvoiceForPayment.balanceDue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={selectedInvoiceForPayment.balanceDue}
                    value={payingAmount}
                    onChange={(e) => setPayingAmount(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    💡 You can pay the full pending balance or specify a custom milestone amount (e.g., ₹4,000).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="UPI">Instant UPI (GPay / PhonePe / Paytm / BHIM)</option>
                    <option value="Bank Transfer">Direct Bank IMPS / NEFT / RTGS</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Razorpay">Razorpay Checkout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Transaction / UTR Reference ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 523891024891 or IMPS reference"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Payment Note / Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sent ₹4,000 via Google Pay for milestone 1"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
                  />
                </div>

                {/* Studio Bank & UPI Details */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold">Studio VPA: {settings?.upiId || 'sourav.vortex@okhdfcbank'}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Account: Vortex Creative Labs (HDFC Bank: 50200067891234)</div>
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
                    <span>{paymentProcessing ? 'Submitting Request...' : `Submit Payment of ₹${(Number(payingAmount) || 0).toLocaleString('en-IN')}`}</span>
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

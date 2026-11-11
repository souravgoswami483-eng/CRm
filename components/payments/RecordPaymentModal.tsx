'use client';

import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Invoice, PaymentMode } from '@/types';
import { isValidNumber } from '@/lib/validators';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onPaymentRecorded: () => void;
  preselectedInvoiceId?: string;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoices,
  onPaymentRecorded,
  preselectedInvoiceId,
}: RecordPaymentModalProps) {
  const [invoiceId, setInvoiceId] = useState<string>(
    preselectedInvoiceId || invoices.find((i) => (i.balanceDue || 0) > 0)?.id || (invoices[0]?.id || '')
  );

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  const [amount, setAmount] = useState<number>(selectedInvoice?.balanceDue || 0);
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState<string>(new Date().toTimeString().substring(0, 8));
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setAmount(inv.balanceDue || inv.total || 0);
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!invoiceId) {
      errs.invoiceId = 'Please select an invoice.';
    }

    if (!isValidNumber(amount, 1)) {
      errs.amount = 'Payment amount must be greater than ₹0.';
    } else if (selectedInvoice && amount > (selectedInvoice.balanceDue || selectedInvoice.total || 0)) {
      errs.amount = `Amount cannot exceed the invoice balance of ₹${(selectedInvoice.balanceDue || selectedInvoice.total || 0).toLocaleString('en-IN')}.`;
    }

    if (transactionRef.trim().length > 0 && transactionRef.trim().length < 3) {
      errs.transactionRef = 'Transaction reference must be at least 3 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          mode,
          transactionRef: transactionRef.trim() || `TXN${Date.now().toString().slice(-8)}`,
          date,
          time,
          notes: notes.trim(),
        }),
      });

      if (res.ok) {
        onPaymentRecorded();
        onClose();
      } else {
        const data = await res.json();
        setErrors({ general: data.error || 'Failed to record payment' });
      }
    } catch (err: any) {
      console.error(err);
      setErrors({ general: err.message || 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Record Client Settlement</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Log offline or online receipts against outstanding balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.general && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select Invoice *
            </label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                  {inv.invoiceNumber} — {inv.clientCompany} (Pending: ₹{(inv.balanceDue || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Received Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-bold text-zinc-900 dark:text-white outline-none transition-all ${
                  errors.amount
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-emerald-500'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0 inline" /> {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Payment Channel *
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PaymentMode)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Razorpay">Razorpay Gateway</option>
                <option value="Stripe">Stripe Checkout</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              UTR / Transaction Ref ID
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/402847291038 or NEFT-HDFC-9938"
              value={transactionRef}
              onChange={(e) => {
                setTransactionRef(e.target.value);
                setErrors((prev) => ({ ...prev, transactionRef: '' }));
              }}
              className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white outline-none transition-all ${
                errors.transactionRef
                  ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-emerald-500'
              }`}
            />
            {errors.transactionRef && (
              <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0 inline" /> {errors.transactionRef}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Timestamp (IST)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Settlement Notes & Remittance Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received via client direct IMPS reference 99281..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{saving ? 'Recording Settlement...' : 'Record Payment Cleared'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

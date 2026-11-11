'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Download, Receipt, Sparkles } from 'lucide-react';
import { Invoice, InvoiceItem, Client, Project, TaxType } from '@/types';
import { generateInvoicePDF } from '@/lib/pdf-generator';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: Partial<Invoice>) => Promise<void>;
  clients: Client[];
  projects: Project[];
  initialData?: Invoice | null;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  onSave,
  clients,
  projects,
  initialData,
}: InvoiceModalProps) {
  const [isEstimate, setIsEstimate] = useState<boolean>(initialData?.isEstimate || false);
  const [clientId, setClientId] = useState<string>(initialData?.clientId || (clients[0]?.id || ''));
  const [projectId, setProjectId] = useState<string>(initialData?.projectId || '');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(initialData?.paymentTerms || 'Net 15 Days');
  const [taxType, setTaxType] = useState<TaxType>(initialData?.taxType || 'GST (18%)');
  const [taxPercent, setTaxPercent] = useState<number>(initialData?.taxPercent !== undefined ? initialData.taxPercent : 18);
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>(initialData?.discountType || 'flat');
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
  const [notes, setNotes] = useState<string>(initialData?.notes || 'Thank you for choosing Vortex Creative Labs.');
  const [terms, setTerms] = useState<string>(initialData?.terms || 'Payment due on or before specified due date.');
  const [isRecurring, setIsRecurring] = useState<boolean>(initialData?.isRecurring || false);

  // Synchronize client selection whenever clients list loads or modal opens
  useEffect(() => {
    if (clients.length > 0 && (!clientId || !clients.some((c) => c.id === clientId))) {
      setClientId(initialData?.clientId || clients[0].id);
    }
  }, [clients, initialData, clientId]);

  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [
      {
        id: 'item_1',
        service: 'Graphic Design / Video Editing',
        description: 'Creative design, motion animation & sound mastering',
        quantity: 1,
        rate: 50000,
        amount: 50000,
      },
    ]
  );

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].amount = q * r;
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        service: 'Social Media / Branding Asset',
        description: '',
        quantity: 1,
        rate: 15000,
        amount: 15000,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const discountAmount =
    discountType === 'percentage'
      ? (subtotal * discountValue) / 100
      : discountValue;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * taxPercent) / 100;
  const total = Math.round(taxable + taxAmount);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || clientId.trim() === '') {
      alert('Please select a valid client for this invoice.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        isEstimate,
        clientId,
        clientName: selectedClient ? selectedClient.name : 'Client',
        clientCompany: selectedClient ? selectedClient.companyName : 'Company',
        clientEmail: selectedClient ? selectedClient.email : '',
        clientAddress: selectedClient?.address,
        clientGstin: selectedClient?.gstin,
        projectId: projectId || undefined,
        date,
        dueDate,
        paymentTerms,
        items,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxType,
        taxPercent,
        taxAmount,
        total,
        balanceDue: total,
        amountPaid: 0,
        status: 'Sent',
        notes,
        terms,
        isRecurring,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {initialData ? 'Edit Invoice' : isEstimate ? 'Create Quotation / Estimate' : 'Create New Invoice'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generate branded GST invoice with auto-numbering & PDF support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEstimate(!isEstimate)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isEstimate
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              {isEstimate ? 'Type: Quotation / Estimate' : 'Type: Official Invoice'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Row 1: Client & Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Select Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                {clients.length === 0 ? (
                  <option value="" disabled>Loading clients...</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {c.companyName} ({c.name} - {c.clientId})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Link to Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">-- Standalone Invoice --</option>
                {projects
                  .filter((p) => !clientId || p.clientId === clientId)
                  .map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {p.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
              </select>
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Invoice Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                <span>Monthly Retainer Auto-Recurring</span>
              </label>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
                Services & Deliverables
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Service title (e.g. YouTube Reel Edit, 3D Render)"
                      value={item.service}
                      onChange={(e) => handleItemChange(idx, 'service', e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Detailed scope description..."
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-900 dark:text-white text-center outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Rate (₹)"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-900 dark:text-white text-right outline-none"
                      required
                    />
                  </div>

                  <div className="col-span-2 text-right font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-zinc-400 hover:text-rose-500 disabled:opacity-20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Discount Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tax / GST
                </label>
                <select
                  value={taxType}
                  onChange={(e) => {
                    const t = e.target.value as TaxType;
                    setTaxType(t);
                    setTaxPercent(t === 'None' ? 0 : 18);
                  }}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
                >
                  <option value="GST (18%)">GST (18% Integrated / Standard)</option>
                  <option value="CGST+SGST (9%+9%)">CGST (9%) + SGST (9%)</option>
                  <option value="IGST (18%)">IGST (18% Interstate)</option>
                  <option value="VAT (5%)">VAT (5%)</option>
                  <option value="None">None (0% Tax Exemption)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Discount
                </label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-28 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-xs text-zinc-900 dark:text-white outline-none"
                  >
                    <option value="flat">Flat (₹)</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Tax ({taxType}):</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-violet-700 dark:text-violet-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total Amount:</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all disabled:opacity-50"
            >
              <Receipt className="h-4 w-4" />
              <span>{saving ? 'Saving...' : isEstimate ? 'Save Quotation' : 'Issue Official Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

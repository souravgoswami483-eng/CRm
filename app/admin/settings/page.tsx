'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Receipt,
  Mail,
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  Shield,
  Sparkles,
  QrCode,
  Sun,
  Moon,
} from 'lucide-react';
import { StudioSettings } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function AdminSettingsPage() {
  const { theme, toggleTheme, settings, refreshSettings } = useAuth();
  const [formSettings, setFormSettings] = useState<StudioSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  if (!formSettings) {
    return (
      <div className="py-20 text-center text-xs text-zinc-500">
        Loading studio settings...
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        refreshSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      });
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data.backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Vortex_Studio_Database_Backup_${new Date().toISOString().substring(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Studio Brand & Operations Settings</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Branding, tax preferences, UPI bank details, backup exports & security controls
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Settings saved and applied successfully across all invoices and portals!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Business Profile */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <Building className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Studio Profile & Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Studio Name</label>
              <input
                type="text"
                value={formSettings.studioName}
                onChange={(e) => setFormSettings({ ...formSettings, studioName: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Owner / Director Name</label>
              <input
                type="text"
                value={formSettings.ownerName}
                onChange={(e) => setFormSettings({ ...formSettings, ownerName: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Official Email</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Phone / WhatsApp</label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">GSTIN Number</label>
              <input
                type="text"
                value={formSettings.gstin}
                onChange={(e) => setFormSettings({ ...formSettings, gstin: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Registered Studio Address</label>
            <input
              type="text"
              value={formSettings.address}
              onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Section 2: Bank & UPI Payment Details */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Bank Settlement & UPI Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">UPI ID / VPA</label>
              <input
                type="text"
                value={formSettings.upiId}
                onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Displayed on invoices and dynamic QR code generation
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Bank Account Name</label>
              <input
                type="text"
                value={formSettings.bankDetails?.accountName || ''}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    bankDetails: { ...formSettings.bankDetails, accountName: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Bank Name</label>
              <input
                type="text"
                value={formSettings.bankDetails?.bankName || ''}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    bankDetails: { ...formSettings.bankDetails, bankName: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Account Number</label>
              <input
                type="text"
                value={formSettings.bankDetails?.accountNumber || ''}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    bankDetails: { ...formSettings.bankDetails, accountNumber: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">IFSC Code</label>
              <input
                type="text"
                value={formSettings.bankDetails?.ifsc || ''}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    bankDetails: { ...formSettings.bankDetails, ifsc: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Invoice Prefix & Defaults */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <Receipt className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Invoice Numbering & Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Invoice Prefix</label>
              <input
                type="text"
                value={formSettings.invoicePrefix}
                onChange={(e) => setFormSettings({ ...formSettings, invoicePrefix: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Next Invoice Number</label>
              <input
                type="number"
                value={formSettings.invoiceNextNumber}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, invoiceNextNumber: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Default Tax Rate (%)</label>
              <input
                type="number"
                value={formSettings.defaultTaxRate}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, defaultTaxRate: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Storage Usage & Data Backup */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Storage Overview & Cloud Backups</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">14.8 GB of 1 TB Used</span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 w-[15%]" />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>High-Res Footage & 4K Masters</span>
              <span>15% Cloud Quota</span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Download Full JSON Database Dump</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              <span>Current Theme: {theme.toUpperCase()} (Toggle Mode)</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

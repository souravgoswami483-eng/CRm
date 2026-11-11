'use client';

import React, { useState } from 'react';
import { X, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Client } from '@/types';
import { isValidEmail, isValidPhone, isValidGSTIN, isValidName } from '@/lib/validators';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => Promise<void>;
  initialData?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ClientModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [gstin, setGstin] = useState(initialData?.gstin || '');
  const [industry, setIndustry] = useState(initialData?.industry || 'Creative & Media');
  const [source, setSource] = useState<any>(initialData?.source || 'Instagram');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [tag, setTag] = useState<any>(initialData?.tags?.[0] || 'VIP');
  const [logo, setLogo] = useState(
    initialData?.logo ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
  );
  const [saving, setSaving] = useState(false);

  // Field validation error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!isValidName(value, 2)) return 'Contact person name must be at least 2 characters.';
        return '';
      case 'companyName':
        if (!isValidName(value, 2)) return 'Brand / company name must be at least 2 characters.';
        return '';
      case 'email':
        if (!isValidEmail(value)) return 'Please enter a valid email address (e.g. client@company.com).';
        return '';
      case 'phone':
        if (!isValidPhone(value)) {
          return 'Please enter a valid phone number (digits only, e.g. +91 98765 43210).';
        }
        return '';
      case 'whatsapp':
        if (value && value.trim() && !isValidPhone(value)) {
          return 'Please enter a valid WhatsApp number (digits only).';
        }
        return '';
      case 'gstin':
        if (value && value.trim() && !isValidGSTIN(value)) {
          return 'Invalid GSTIN format (must be 15 alphanumeric characters, e.g. 29AABCT1334M1Z8).';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched and run full validation
    const newErrors: { [key: string]: string } = {
      name: validateField('name', name),
      companyName: validateField('companyName', companyName),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      whatsapp: validateField('whatsapp', whatsapp),
      gstin: validateField('gstin', gstin),
    };

    setTouched({
      name: true,
      companyName: true,
      email: true,
      phone: true,
      whatsapp: true,
      gstin: true,
    });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((msg) => !!msg);
    if (hasErrors) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        whatsapp: (whatsapp || phone).trim(),
        address: address.trim(),
        gstin: gstin.trim().toUpperCase(),
        industry,
        source,
        notes: notes.trim(),
        tags: [tag],
        logo: logo.trim(),
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
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl my-8 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {initialData ? `Edit Client: ${initialData.clientId}` : 'Onboard New Client'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {initialData
                  ? 'Update contact info and brand tags'
                  : 'Assigns unique Client ID & portal login credentials'}
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

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Client Contact Person *
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivers"
                value={name}
                onChange={(e) => handleChange('name', e.target.value, setName)}
                onBlur={(e) => handleBlur('name', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.name && errors.name
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Brand / Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Zenith Techworks"
                value={companyName}
                onChange={(e) => handleChange('companyName', e.target.value, setCompanyName)}
                onBlur={(e) => handleBlur('companyName', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.companyName && errors.companyName
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.companyName && errors.companyName && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.companyName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => handleChange('email', e.target.value, setEmail)}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.email && errors.email
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Phone / WhatsApp Number *
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  handleChange('phone', e.target.value, setPhone);
                  if (!whatsapp) setWhatsapp(e.target.value);
                }}
                onBlur={(e) => handleBlur('phone', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.phone && errors.phone
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.phone && errors.phone ? (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.phone}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  Include country code for Indian/international clients (e.g. +91 98765 43210)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Industry
              </label>
              <input
                type="text"
                placeholder="SaaS / Esports / Fashion"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Client Category Tag
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="VIP">VIP</option>
                <option value="Retainer">Monthly Retainer</option>
                <option value="One-time">One-Time Project</option>
                <option value="High Priority">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Acquisition Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="Instagram">Instagram</option>
                <option value="Referral">Client Referral</option>
                <option value="Website">Portfolio Website</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Billing Address & GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="GSTIN (e.g. 29AABCT1334M1Z8)"
                value={gstin}
                onChange={(e) => handleChange('gstin', e.target.value, setGstin)}
                onBlur={(e) => handleBlur('gstin', e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white uppercase outline-none transition-all ${
                  touched.gstin && errors.gstin
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.gstin && errors.gstin && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.gstin}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Portal Security & Access
              </label>
              <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-generated one-time password will be shown upon creation.</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Client Brand Logo URL
            </label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Client Production Notes & Preferences
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Prefers fast turnarounds, likes dark neo-noir cinematic styling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 resize-none"
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
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving Client...' : initialData ? 'Update Client' : 'Create & Assign ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

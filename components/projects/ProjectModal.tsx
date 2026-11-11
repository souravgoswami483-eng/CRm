'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderKanban, AlertCircle } from 'lucide-react';
import { Project, ProjectPriority, ProjectType, ProjectStatus, Client } from '@/types';
import { isValidName, isValidNumber } from '@/lib/validators';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => Promise<void>;
  clients: Client[];
  initialData?: Project | null;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  clients,
  initialData,
}: ProjectModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [clientId, setClientId] = useState(initialData?.clientId || (clients[0]?.id || ''));
  const [type, setType] = useState<ProjectType>(initialData?.type || 'Reel / Short');
  const [description, setDescription] = useState(initialData?.description || '');
  const [referenceLinksText, setReferenceLinksText] = useState(
    initialData?.referenceLinks?.join('\n') || ''
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate || new Date().toISOString().substring(0, 10)
  );
  const [deadline, setDeadline] = useState(
    initialData?.deadline || new Date(Date.now() + 10 * 86400000).toISOString().substring(0, 10)
  );
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || 'Brief Received');
  const [priority, setPriority] = useState<ProjectPriority>(initialData?.priority || 'High');
  const [revisionsAllowed, setRevisionsAllowed] = useState<number>(
    initialData?.revisionsAllowed || 3
  );
  const [quotedAmount, setQuotedAmount] = useState<number>(initialData?.quotedAmount || 50000);
  const [saving, setSaving] = useState(false);

  // Field validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Synchronize client selection whenever clients list loads or modal opens
  useEffect(() => {
    if (clients.length > 0 && (!clientId || !clients.some((c) => c.id === clientId))) {
      setClientId(initialData?.clientId || clients[0].id);
    }
  }, [clients, initialData, clientId]);

  if (!isOpen) return null;

  const validateField = (field: string, val: any): string => {
    switch (field) {
      case 'title':
        if (!isValidName(val, 3)) return 'Project title must be at least 3 characters.';
        return '';
      case 'clientId':
        if (!val || String(val).trim() === '') return 'Please select a client for this project.';
        return '';
      case 'quotedAmount':
        if (!isValidNumber(val, 1)) return 'Quoted fee must be greater than ₹0.';
        return '';
      case 'deadline':
        if (startDate && val && val < startDate) return 'Deadline cannot be earlier than project start date.';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, val: any) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {
      title: validateField('title', title),
      clientId: validateField('clientId', clientId),
      quotedAmount: validateField('quotedAmount', quotedAmount),
      deadline: validateField('deadline', deadline),
    };

    setTouched({
      title: true,
      clientId: true,
      quotedAmount: true,
      deadline: true,
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSaving(true);
    const selectedClient = clients.find((c) => c.id === clientId);

    const refLinks = referenceLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      await onSave({
        title: title.trim(),
        clientId,
        clientName: selectedClient?.name || 'Client',
        clientCompany: selectedClient?.companyName || 'Company',
        type,
        description: description.trim(),
        referenceLinks: refLinks,
        startDate,
        deadline,
        status,
        priority,
        revisionsAllowed: Math.max(1, Number(revisionsAllowed) || 1),
        quotedAmount: Math.max(0, Number(quotedAmount) || 0),
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
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {initialData ? 'Edit Project Brief' : 'Start New Creative Project'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Setup milestones, pipeline stage, priority, and quotation
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
                Project Title *
              </label>
              <input
                type="text"
                placeholder="e.g. 9:16 Viral Reels Pack (10 Episodes)"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (touched.title) setErrors((prev) => ({ ...prev, title: validateField('title', e.target.value) }));
                }}
                onBlur={() => handleBlur('title', title)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.title && errors.title
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.title && errors.title && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Assign to Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (touched.clientId) setErrors((prev) => ({ ...prev, clientId: validateField('clientId', e.target.value) }));
                }}
                onBlur={() => handleBlur('clientId', clientId)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.clientId && errors.clientId
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              >
                {clients.length === 0 ? (
                  <option value="" disabled>Loading clients...</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                      {c.companyName} ({c.name}) [{c.clientId}]
                    </option>
                  ))
                )}
              </select>
              {touched.clientId && errors.clientId && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.clientId}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Creative Discipline
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="Reel / Short">Reel / Short</option>
                <option value="YouTube Video">YouTube Video</option>
                <option value="Logo & Visual Identity">Logo & Visual Identity</option>
                <option value="Motion Graphics">Motion Graphics</option>
                <option value="Social Media Creatives">Social Media Creatives</option>
                <option value="Ad Film / Commercial">Ad Film / Commercial</option>
                <option value="Thumbnail Pack">Thumbnail Pack</option>
                <option value="Branding Kit">Branding Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Pipeline Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="Brief Received">Brief Received</option>
                <option value="In Progress">In Progress</option>
                <option value="Draft Shared">Draft Shared</option>
                <option value="Revisions">Revisions</option>
                <option value="Approved">Approved</option>
                <option value="Final Delivered">Final Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Priority Urgency
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (touched.deadline) setErrors((prev) => ({ ...prev, deadline: validateField('deadline', deadline) }));
                }}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Delivery Deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (touched.deadline) setErrors((prev) => ({ ...prev, deadline: validateField('deadline', e.target.value) }));
                }}
                onBlur={() => handleBlur('deadline', deadline)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none transition-all ${
                  touched.deadline && errors.deadline
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.deadline && errors.deadline && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.deadline}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Revisions Limit
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={revisionsAllowed}
                onChange={(e) => setRevisionsAllowed(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Quoted Fee (₹) *
              </label>
              <input
                type="number"
                min={1}
                value={quotedAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuotedAmount(val);
                  if (touched.quotedAmount) setErrors((prev) => ({ ...prev, quotedAmount: validateField('quotedAmount', val) }));
                }}
                onBlur={() => handleBlur('quotedAmount', quotedAmount)}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-zinc-900 dark:text-white font-bold outline-none transition-all ${
                  touched.quotedAmount && errors.quotedAmount
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:border-violet-500'
                }`}
              />
              {touched.quotedAmount && errors.quotedAmount && (
                <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {errors.quotedAmount}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Project Description & Creative Brief
            </label>
            <textarea
              rows={3}
              placeholder="Detail out aspect ratios, references, sound style, branding guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Reference Links & Moodboard URLs (One per line)
            </label>
            <textarea
              rows={2}
              placeholder="https://vimeo.com/...&#10;https://instagram.com/reel/..."
              value={referenceLinksText}
              onChange={(e) => setReferenceLinksText(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-violet-500 resize-none"
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
              {saving ? 'Saving Project...' : initialData ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

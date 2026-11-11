'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Eye,
  KeyRound,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Receipt,
  FolderKanban,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ExternalLink,
  DollarSign,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import ClientModal from '@/components/clients/ClientModal';
import { Client } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Profile Drawer
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeProfileClient, setActiveProfileClient] = useState<any | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [generatedPasswordModal, setGeneratedPasswordModal] = useState<{
    isOpen: boolean;
    clientName: string;
    companyName: string;
    clientId: string;
    password: string;
  } | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openProfile = async (client: any) => {
    setActiveProfileClient(client);
    try {
      const res = await fetch(`/api/clients/${client.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle client status (Active / Inactive)
  const toggleStatus = async (client: any) => {
    const nextStatus = client.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchClients();
      if (activeProfileClient?.id === client.id) {
        setActiveProfileClient({ ...activeProfileClient, status: nextStatus });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Client Password (generates new one-time password and forces change on next login)
  const resetPassword = async (client: any) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword' }),
      });
      const data = await res.json();
      if (data.oneTimePassword) {
        setGeneratedPasswordModal({
          isOpen: true,
          clientName: client.name,
          companyName: client.companyName,
          clientId: client.clientId,
          password: data.oneTimePassword,
        });
      }
      fetchClients();
    } catch (e) {
      console.error('Password reset failed', e);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (clients.length === 0) return;
    const headers = [
      'Client ID',
      'Contact Name',
      'Company Name',
      'Email',
      'Phone',
      'Industry',
      'Source',
      'Tags',
      'Total Billed',
      'Total Paid',
      'Balance Due',
      'Status',
    ];

    const rows = clients.map((c) => [
      c.clientId,
      `"${c.name}"`,
      `"${c.companyName}"`,
      c.email,
      c.phone,
      `"${c.industry}"`,
      c.source,
      `"${(c.tags || []).join(', ')}"`,
      c.totalBilled || 0,
      c.totalPaid || 0,
      c.balanceDue || 0,
      c.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vortex_Clients_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || (c.tags && c.tags.includes(selectedTag));
    const matchesStatus = !selectedStatus || c.status === selectedStatus;

    return matchesSearch && matchesTag && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Client Management</h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Client profiles, Unique IDs, portal access credentials & billing records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 shadow-sm dark:shadow-none backdrop-blur">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, company, Client ID (CL-2026-...) or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
          >
            <option value="">All Tags (VIP, Retainer...)</option>
            <option value="VIP">VIP</option>
            <option value="Retainer">Retainer</option>
            <option value="High-Priority">High-Priority</option>
            <option value="One-time">One-time</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-2xl backdrop-blur">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-950/80 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Client ID & Brand</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Tags & Source</th>
              <th className="py-3 px-4">Projects</th>
              <th className="py-3 px-4">Billed / Paid</th>
              <th className="py-3 px-4">Balance Due</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-zinc-500">
                  No clients match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => openProfile(client)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={client.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={client.companyName}
                        className="h-9 w-9 rounded-xl object-cover border border-zinc-300 dark:border-zinc-700 ring-1 ring-violet-500/30"
                      />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                          {client.companyName}
                        </div>
                        <span className="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 px-1.5 py-0.5 rounded">
                          {client.clientId}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-zinc-900 dark:text-zinc-200 font-semibold">{client.name}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{client.email}</div>
                    <div className="text-[10px] text-zinc-500">{client.phone}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {client.tags?.map((t: string) => (
                        <span
                          key={t}
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Source: {client.source}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-zinc-800 dark:text-zinc-300">
                    {client.projectCount || 0} active
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-200">
                      ₹{(client.totalBilled || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{(client.totalPaid || 0).toLocaleString('en-IN')} paid
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-black ${
                        client.balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      ₹{(client.balanceDue || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        client.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          client.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-400'
                        }`}
                      />
                      <span>{client.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openProfile(client)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resetPassword(client)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Reset Portal Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(client)}
                        className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                          client.status === 'Active'
                            ? 'text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400'
                            : 'text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title={client.status === 'Active' ? 'Deactivate Client' : 'Activate Client'}
                      >
                        {client.status === 'Active' ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CLIENT PROFILE SIDE DRAWER */}
      {activeProfileClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <img
                    src={activeProfileClient.logo}
                    alt={activeProfileClient.companyName}
                    className="h-12 w-12 rounded-2xl object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                      {activeProfileClient.companyName}
                    </h2>
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {activeProfileClient.clientId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveProfileClient(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              {/* Financial Snapshot */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase block">Total Billed</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    ₹{(activeProfileClient.totalBilled || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3.5">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">Total Paid</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    ₹{(activeProfileClient.totalPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3.5">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase block">Balance Due</span>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    ₹{(activeProfileClient.balanceDue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="mt-5 space-y-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contact Person:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-200">{activeProfileClient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{activeProfileClient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Phone / WhatsApp:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{activeProfileClient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GSTIN:</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{activeProfileClient.gstin || 'Unregistered'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Security Credentials:</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Salted Hash Protected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Last Login:</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{activeProfileClient.lastLogin || 'Never'}</span>
                </div>
              </div>

              {/* Projects linked to this client */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Projects ({profileData?.projects?.length || 0})
                </h3>
                <div className="space-y-2">
                  {profileData?.projects?.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-200">{proj.title}</div>
                        <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">{proj.type}</span>
                      </div>
                      <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {proj.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaction Timeline */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Interaction History Timeline
                </h3>
                <div className="space-y-2">
                  {profileData?.activities?.slice(0, 5).map((act: any) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800 dark:text-zinc-300">
                        <span>{act.action}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">{act.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button
                onClick={() => resetPassword(activeProfileClient)}
                className="flex-1 rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/20 py-2.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
              >
                Reset Password
              </button>
              <button
                onClick={() => toggleStatus(activeProfileClient)}
                className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {activeProfileClient.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARD MODAL */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        initialData={editingClient}
        onSave={async (clientData) => {
          try {
            const res = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientData),
            });
            const data = await res.json();
            if (data.oneTimePassword) {
              setGeneratedPasswordModal({
                isOpen: true,
                clientName: data.client.name,
                companyName: data.client.companyName,
                clientId: data.client.clientId,
                password: data.oneTimePassword,
              });
            }
            fetchClients();
          } catch (err) {
            console.error('Failed to save client', err);
          }
        }}
      />

      {/* ONE-TIME PASSWORD MODAL (Displayed once on create or reset) */}
      {generatedPasswordModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-white dark:bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  One-Time Portal Password
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {generatedPasswordModal.clientName} ({generatedPasswordModal.companyName})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
              ⚠️ <strong>Security Notice:</strong> This password is shown only once and is securely stored as a salted PBKDF2 hash. The client will be required to choose a new password upon first login.
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-500">Unique Client ID:</span>
              <div className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
                {generatedPasswordModal.clientId}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-500">One-Time Password:</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-800 p-2.5 rounded-lg select-all">
                  {generatedPasswordModal.password}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Client ID: ${generatedPasswordModal.clientId}\nTemporary Password: ${generatedPasswordModal.password}\nLogin at: ${window.location.origin}/login`
                    );
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  className="px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {copiedPass ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setGeneratedPasswordModal(null)}
                className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                I Have Safely Saved / Shared The Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

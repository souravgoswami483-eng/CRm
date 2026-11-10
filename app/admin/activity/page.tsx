'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  LogIn,
  Eye,
  MessageSquare,
  DollarSign,
  FileUp,
  Download,
} from 'lucide-react';
import { ActivityLog, Client, Project } from '@/types';

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      const [actRes, cRes, pRes] = await Promise.all([
        fetch('/api/activities?limit=200'),
        fetch('/api/clients'),
        fetch('/api/projects'),
      ]);
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData.activities || []);
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
    loadActivities();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Client Logged In':
      case 'Admin Logged In':
        return <LogIn className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case 'File Approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Pinned Comment':
      case 'Video Timestamp Feedback':
      case 'File Comment':
        return <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'File Viewed':
      case 'Invoice Viewed':
        return <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case 'Payment Recorded':
        return <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Version Uploaded':
      case 'File Uploaded':
        return <FileUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
      default:
        return <History className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />;
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClient = !selectedClient || act.clientId === selectedClient;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Activity Audit Trail</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Immutable logging of logins, file views, pinned comments, approvals and payment events
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 backdrop-blur shadow-sm dark:shadow-none">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search audit trail by event action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500"
          />
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
        >
          <option value="">All Clients Filter</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName} ({c.name})
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur shadow-sm dark:shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-950/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Event Action</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-zinc-500">
                  No activity records match criteria.
                </td>
              </tr>
            ) : (
              filteredActivities.map((act) => (
                <tr key={act.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {act.timestamp}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {getActionIcon(act.action)}
                      </div>
                      <span>{act.action}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                    {act.userName}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        act.userRole === 'ADMIN'
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800/60'
                          : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/60'
                      }`}
                    >
                      {act.userRole}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {act.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { User, KeyRound, ShieldCheck, CheckCircle2, Lock, Building, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', success: false });
      return;
    }

    setUpdating(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/clients/${user?.id || 'client_1'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempPassword: newPassword }),
      });

      if (res.ok) {
        setMsg({ text: 'Password successfully updated!', success: true });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMsg({ text: 'Failed to update password.', success: false });
      }
    } catch (e) {
      console.error(e);
      setMsg({ text: 'Network error', success: false });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Client Account & Credentials</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Manage your verified studio identity and portal access password
        </p>
      </div>

      {/* Verified Client Badge Card */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-50 via-white to-blue-50 dark:from-cyan-950/40 dark:via-zinc-900 dark:to-zinc-950 p-6 shadow-sm dark:shadow-xl backdrop-blur flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Client'}
            className="h-14 w-14 rounded-2xl object-cover border border-cyan-500/40 shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">{user?.name}</h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">{user?.companyName}</div>
            <div className="mt-1 inline-block text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800/60 px-2 py-0.5 rounded">
              Client ID: {user?.clientId || 'CL-2026-0042'} (Non-editable)
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-4 transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Change Portal Password</h3>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              msg.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            {msg.success ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter at least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 disabled:opacity-50 transition-all"
            >
              {updating ? 'Saving Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

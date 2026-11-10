'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const { login, theme, toggleTheme } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          twoFactorCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requires2FA) {
          setShow2FA(true);
        }
        setErrorMsg(data.error || 'Authentication failed. Please check credentials.');
        return;
      }

      login(data.user);
      router.push(data.redirectUrl || (data.role === 'ADMIN' ? '/admin' : '/portal'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Network connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm hover:scale-105 transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-[120px] -z-10" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-violet-600/25 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white dark:bg-zinc-950">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <span className="text-xl font-black tracking-wider text-zinc-900 dark:text-white">
            VORTEX STUDIO
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Sign In
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter your studio credentials or unique Client ID
        </p>
      </div>

      {/* Single Unified Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotPasswordNotice && (
            <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                To reset your password, contact studio director Sourav Roy at admin@studiovortex.com or WhatsApp +91 98765 43210.
              </span>
            </div>
          )}

          {/* Unified Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username / Client ID / Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. admin@studiovortex.com or CL-2026-0042"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
                  className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                />
              </div>
            </div>

            {show2FA && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-50/50 dark:bg-violet-950/30 p-3">
                <label className="block text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">
                  2-Factor Authentication Code (Demo: 123456)
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full rounded-xl border border-violet-400 dark:border-violet-600 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none text-center font-mono tracking-widest"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}

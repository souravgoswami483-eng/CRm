'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNotification } from '@/types';

export default function Navbar() {
  const { user, logout, theme, toggleTheme, quickSwitchUser, settings } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const recipient = user.role === 'ADMIN' ? 'ADMIN' : user.id || user.clientId || '';
      const res = await fetch(`/api/notifications?recipientId=${recipient}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: AppNotification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAllRead: true,
          recipientId: user?.role === 'ADMIN' ? 'ADMIN' : user?.id,
        }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-white transition-colors">
                {settings?.studioName || 'VORTEX'}
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {user?.role === 'ADMIN' ? 'STUDIO DIRECTOR CRM' : 'CLIENT COLLABORATION HUB'}
              </span>
            </div>
          </Link>

          {/* Role Badge */}
          {user && (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
              {user.role === 'ADMIN' ? (
                <>
                  <Shield className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                  <span>Admin Workspace</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  <span>Client: {user.clientId}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
              title="Switch demo persona instantly"
            >
              <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span className="hidden md:inline">Switch Role:</span>
              <span className="text-zinc-900 dark:text-white font-bold">{user?.role === 'ADMIN' ? 'Admin' : user?.name?.split(' ')[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>

            {showSwitchMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Test Personas
                </div>
                <button
                  onClick={() => {
                    quickSwitchUser('admin');
                    setShowSwitchMenu(false);
                    router.push('/admin');
                  }}
                  className={`w-full text-left rounded-xl px-2.5 py-2 text-xs transition-colors flex items-center justify-between ${
                    user?.role === 'ADMIN'
                      ? 'bg-violet-50 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>👑 Admin (Sourav Roy)</span>
                  {user?.role === 'ADMIN' && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
                </button>
                <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
                <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Client Logins
                </div>
                <button
                  onClick={() => {
                    quickSwitchUser('client1');
                    setShowSwitchMenu(false);
                    router.push('/portal');
                  }}
                  className={`w-full text-left rounded-xl px-2.5 py-2 text-xs transition-colors flex items-center justify-between ${
                    user?.clientId === 'CL-2026-0042'
                      ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Alex Rivers (Zenith)</span>
                  <span className="text-[10px] text-zinc-500">CL-2026-0042</span>
                </button>
                <button
                  onClick={() => {
                    quickSwitchUser('client2');
                    setShowSwitchMenu(false);
                    router.push('/portal');
                  }}
                  className={`w-full text-left rounded-xl px-2.5 py-2 text-xs transition-colors flex items-center justify-between ${
                    user?.clientId === 'CL-2026-0089'
                      ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Priya Sharma (Lumina)</span>
                  <span className="text-[10px] text-zinc-500">CL-2026-0089</span>
                </button>
                <button
                  onClick={() => {
                    quickSwitchUser('client3');
                    setShowSwitchMenu(false);
                    router.push('/portal');
                  }}
                  className={`w-full text-left rounded-xl px-2.5 py-2 text-xs transition-colors flex items-center justify-between ${
                    user?.clientId === 'CL-2026-0104'
                      ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Marcus Vance (Pulse)</span>
                  <span className="text-[10px] text-zinc-500">CL-2026-0104</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:scale-105 transition-all shadow-sm"
            title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) markAllRead();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-2xl z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-2.5 max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-500">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.link || '#'}
                        onClick={() => setShowNotifMenu(false)}
                        className={`block p-2.5 rounded-xl text-xs transition-colors border ${
                          notif.read
                            ? 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                            : 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-500/30 text-zinc-900 dark:text-zinc-200 hover:bg-violet-100 dark:hover:bg-violet-950/30 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-200">{notif.title}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                          {notif.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-violet-500/40 object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
              />
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{user.name}</div>
                <div className="text-[10px] text-zinc-500">{user.companyName || user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-violet-500 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

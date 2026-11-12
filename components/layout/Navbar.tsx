'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Sparkles,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck2,
  Receipt,
  CreditCard,
  MessageSquare,
  History,
  Settings,
  TrendingUp,
  User,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNotification } from '@/types';
import LiveMessagePopup from '@/components/notifications/LiveMessagePopup';
import ChangesToast from '@/components/notifications/ChangesToast';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/projects', label: 'Projects & Work', icon: FolderKanban },
  { href: '/admin/files', label: 'File Review Studio', icon: FileCheck2 },
  { href: '/admin/invoices', label: 'Invoices & Quotes', icon: Receipt },
  { href: '/admin/payments', label: 'Payments & Revenue', icon: CreditCard },
  { href: '/admin/messages', label: 'Client Messages', icon: MessageSquare },
  { href: '/admin/activity', label: 'Activity Audit Log', icon: History },
  { href: '/admin/settings', label: 'Studio Settings', icon: Settings },
];

const CLIENT_NAV_ITEMS = [
  { href: '/portal', label: 'Welcome Portal', icon: LayoutDashboard },
  { href: '/portal/projects', label: 'My Projects', icon: FolderKanban },
  { href: '/portal/files', label: 'Review Creatives', icon: FileCheck2 },
  { href: '/portal/invoices', label: 'Invoices & Pay', icon: Receipt },
  { href: '/portal/messages', label: 'Studio Chat', icon: MessageSquare },
  { href: '/portal/profile', label: 'Account & Security', icon: User },
];

export default function Navbar() {
  const { user, logout, theme, toggleTheme, settings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mobile Hamburger Button */}
          {user && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-sm"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 select-none cursor-default">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-md shadow-violet-500/20">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {settings?.studioName || 'VORTEX'}
              </span>
              <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {user?.role === 'ADMIN' ? 'STUDIO DIRECTOR CRM' : 'CLIENT HUB'}
              </span>
            </div>
          </div>

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

      {/* Real-time Message Notification Popup */}
      <LiveMessagePopup />

      {/* Global "Changes Are Being Made" Toast Popup */}
      <ChangesToast />

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative z-50 w-72 max-w-[85vw] bg-white dark:bg-zinc-950 h-full p-4 flex flex-col justify-between shadow-2xl border-r border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {/* Top Section */}
            <div>
              {/* Header with Title & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 select-none">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-md">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {settings?.studioName || 'VORTEX'}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      {user?.role === 'ADMIN' ? 'Studio Director' : 'Client Portal'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status / Role Header Card */}
              {user?.role === 'ADMIN' ? (
                <div className="my-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-zinc-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-zinc-900 border border-violet-200 dark:border-violet-500/20">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 text-xs font-bold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Creative Studio Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Production CRM for Design &amp; Video
                  </p>
                </div>
              ) : (
                <div className="my-3 p-3 rounded-2xl bg-gradient-to-br from-cyan-50 via-zinc-50 to-white dark:from-cyan-950/40 dark:via-zinc-900 dark:to-zinc-950 border border-cyan-200 dark:border-cyan-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      Verified Client Portal
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.companyName || user?.name || 'Client Workspace'}
                  </div>
                  <div className="mt-1 inline-block text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 px-2 py-0.5 rounded">
                    {user?.clientId || 'CL-2026-CLIENT'}
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="space-y-1 mt-2">
                {(user?.role === 'ADMIN' ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS).map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && item.href !== '/portal' && pathname.startsWith(item.href));
                  const isClientArea = user?.role !== 'ADMIN';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? isClientArea
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 font-bold'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-white'
                            : isClientArea
                            ? 'text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600'
                            : 'text-zinc-500 dark:text-zinc-400 group-hover:text-violet-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions: User Info, Theme Toggle, Sign Out */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5 mt-4">
              {/* If admin is previewing client portal, back button */}
              {user?.role === 'ADMIN' && pathname.startsWith('/portal') && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span>Back to Studio Admin</span>
                </Link>
              )}

              {/* User Identity */}
              {user && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-violet-500/40 object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{user.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.companyName || user.email}</div>
                  </div>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
                  <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Sign Out Button */}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  Receipt,
  MessageSquare,
  User,
  Shield,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const CLIENT_NAV_ITEMS = [
  { href: '/portal', label: 'Welcome Portal', icon: LayoutDashboard },
  { href: '/portal/projects', label: 'My Projects', icon: FolderKanban },
  { href: '/portal/files', label: 'Review Creatives', icon: FileCheck2 },
  { href: '/portal/invoices', label: 'Invoices & Pay', icon: Receipt },
  { href: '/portal/messages', label: 'Studio Chat', icon: MessageSquare },
  { href: '/portal/profile', label: 'Account & Security', icon: User },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 backdrop-blur min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Client ID Card Header */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50 via-zinc-50 to-white dark:from-cyan-950/40 dark:via-zinc-900 dark:to-zinc-950 border border-cyan-200 dark:border-cyan-500/20">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
              Verified Client Portal
            </span>
          </div>
          <div className="mt-2 font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {user?.companyName || user?.name || 'Client Workspace'}
          </div>
          <div className="mt-1 inline-block text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 px-2 py-0.5 rounded">
            {user?.clientId || 'CL-2026-CLIENT'}
          </div>
        </div>

        <nav className="space-y-1">
          {CLIENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Switch back to Admin Studio */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span>Back to Studio Admin</span>
        </Link>
      </div>
    </aside>
  );
}

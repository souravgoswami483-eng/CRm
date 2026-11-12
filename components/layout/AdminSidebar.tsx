'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
} from 'lucide-react';

const NAV_ITEMS = [
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

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 backdrop-blur min-h-[calc(100vh-4rem)] p-4 flex-col justify-between transition-colors duration-200">
      <div>
        <div className="mb-6 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-zinc-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-zinc-900 border border-violet-200 dark:border-violet-500/20">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 text-xs font-bold">
            <TrendingUp className="h-4 w-4" />
            <span>Creative Studio Mode</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
            Production CRM for Design & Video
          </p>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

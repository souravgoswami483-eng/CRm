'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RootRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/portal');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-xs text-zinc-500 transition-colors">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-600 animate-ping" />
        <span>Loading Vortex Studio Portal...</span>
      </div>
    </div>
  );
}

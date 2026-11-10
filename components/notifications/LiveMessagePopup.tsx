'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, X, ArrowRight, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function LiveMessagePopup() {
  const { user } = useAuth();
  const router = useRouter();
  const [activePopup, setActivePopup] = useState<ChatMessage | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // AudioContext might be blocked until user gesture, safely ignore
    }
  };

  useEffect(() => {
    if (!user) return;

    const checkNewMessages = async () => {
      try {
        const res = await fetch('/api/messages');
        if (!res.ok) return;
        const data = await res.json();
        const messages: ChatMessage[] = data.messages || [];

        if (!initialLoadDone.current) {
          // Record existing messages on first load so we don't spam popups
          messages.forEach((m) => seenIdsRef.current.add(m.id));
          initialLoadDone.current = true;
          return;
        }

        // Check for any new message that wasn't seen
        for (const msg of messages) {
          if (!seenIdsRef.current.has(msg.id)) {
            seenIdsRef.current.add(msg.id);

            // Only show popup if message is FROM someone else
            const isFromOther =
              msg.senderId !== user.id &&
              msg.senderId !== 'user_admin' && user.role === 'CLIENT' ||
              user.role === 'ADMIN' && msg.senderRole === 'CLIENT' ||
              user.role === 'CLIENT' && msg.senderRole === 'ADMIN';

            if (isFromOther) {
              setActivePopup(msg);
              playChime();
              break;
            }
          }
        }
      } catch (err) {
        console.error('Failed to poll messages', err);
      }
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-dismiss popup after 8 seconds
  useEffect(() => {
    if (!activePopup) return;
    const timer = setTimeout(() => {
      setActivePopup(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activePopup]);

  if (!activePopup) return null;

  const handleOpenChat = () => {
    setActivePopup(null);
    if (user?.role === 'ADMIN') {
      router.push(`/admin/messages`);
    } else {
      router.push(`/portal/messages`);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-violet-400/40 dark:border-violet-500/30 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
              <MessageSquare className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {activePopup.senderName}
                </span>
                <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 px-2 py-0.2 text-[9px] font-bold uppercase text-violet-700 dark:text-violet-300">
                  {activePopup.senderRole === 'ADMIN' ? 'Studio Director' : 'Client'}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">Just sent a new message</span>
            </div>
          </div>

          <button
            onClick={() => setActivePopup(null)}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          "{activePopup.message}"
        </p>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setActivePopup(null)}
            className="rounded-xl px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Dismiss
          </button>
          <button
            onClick={handleOpenChat}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-all"
          >
            <span>Open Chat</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

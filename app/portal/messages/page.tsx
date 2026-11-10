'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ChatMessage } from '@/types';

export default function ClientMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);

  const clientId = user?.id || 'client_1';

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [clientId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: clientId,
          senderName: user?.name || 'Client',
          senderRole: 'CLIENT',
          recipientId: 'ADMIN',
          message: newMsg.trim(),
        }),
      });

      if (res.ok) {
        setNewMsg('');
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Direct Studio Chat</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Instant messaging with Creative Director Sourav Roy
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-[580px] shadow-sm dark:shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Sourav Roy (Vortex Creative)</h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Director Online
              </span>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
          {messages.length === 0 ? (
            <div className="py-20 text-center text-xs text-zinc-500">
              No messages yet. Send a greeting to start talking!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderRole === 'CLIENT';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 px-1">
                    {msg.senderName} • {msg.createdAt}
                  </div>
                  <div
                    className={`max-w-md rounded-2xl p-3 text-xs shadow-xs ${
                      isMine
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message or brief question for Sourav..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={sending || !newMsg.trim()}
            className="rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-1.5 transition-all"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

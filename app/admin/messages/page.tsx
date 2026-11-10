'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  FolderKanban,
  Paperclip,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, Client, Project } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        const cList = cData.clients || [];
        setClients(cList);
        if (cList.length > 0 && !selectedClientId) {
          setSelectedClientId(cList[0].id);
        }
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadMessages = async () => {
    if (!selectedClientId) return;
    try {
      const res = await fetch(`/api/messages?clientId=${selectedClientId}`);
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
  }, [selectedClientId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedClientId) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user_admin',
          senderName: 'Sourav Roy',
          senderRole: 'ADMIN',
          recipientId: selectedClientId,
          message: newMessageText.trim(),
        }),
      });

      if (res.ok) {
        setNewMessageText('');
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const activeClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Client Communications</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Direct messaging channel with each onboarded client
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[640px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm dark:shadow-2xl">
        {/* Left: Client Contacts List */}
        <div className="md:col-span-4 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950/80">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Client Conversations
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {clients.map((client) => {
              const isSelected = selectedClientId === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-violet-600/20 text-zinc-900 dark:text-white'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <img
                    src={client.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={client.name}
                    className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">{client.companyName}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{client.name}</div>
                    <span className="text-[9px] font-mono text-cyan-400">{client.clientId}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Message Chat Window */}
        <div className="md:col-span-8 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900/30">
          {activeClient ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950/70">
                <div className="flex items-center gap-3">
                  <img
                    src={activeClient.logo}
                    alt={activeClient.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">{activeClient.companyName}</h3>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                      {activeClient.clientId} • {activeClient.name}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Active Portal User
                </span>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-zinc-500">
                    No messages yet with {activeClient.companyName}.
                    <p className="mt-1">Send a greeting or share deliverable updates below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                            isAdmin
                              ? 'bg-violet-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60 rounded-bl-sm'
                          }`}
                        >
                          <div className="text-[10px] opacity-75 font-semibold mb-1 flex items-center justify-between gap-4">
                            <span>{msg.senderName}</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${activeClient.name}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || sending}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              Select a client to open chat thread
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


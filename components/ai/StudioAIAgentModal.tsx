'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  TrendingUp,
  FolderKanban,
  Users,
  Receipt,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface StudioAIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  tools?: { toolName: string; result: any }[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: '📊 Financial Summary', query: 'Give me a summary of total revenue, pending balances, and overdue invoices.' },
  { label: '🎬 Active Project Deadlines', query: 'Show me all current projects, their pipeline stage, priority, and upcoming deadlines.' },
  { label: '👥 Client Balances', query: 'List all client accounts, their billing status, and who has a balance due.' },
  { label: '📝 Draft 30s Reel Brief', query: 'Draft a creative brief for a 30-second high-energy Instagram/TikTok Reel campaign.' },
];

export default function StudioAIAgentModal({ isOpen, onClose }: StudioAIAgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `### 👋 Welcome to Vortex Studio AI Copilot!

I am your **Creative Director & Operations AI Agent**, powered by the **Vercel AI SDK**. 

I have direct access to your CRM tools and can query live data or draft deliverables. Try asking me a question or tap one of the quick actions below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const agentMsg: Message = {
          id: `agt_${Date.now()}`,
          sender: 'agent',
          text: data.reply || 'No response generated.',
          tools: data.executedTools || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'agent',
            text: `⚠️ **Agent Error:** ${errData.error || 'Failed to generate response.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: `⚠️ **Connection Error:** Could not reach the AI agent service.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'reset',
        sender: 'agent',
        text: 'Chat history cleared. How can I assist you with your creative studio today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col overflow-hidden transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-md shadow-violet-500/20 text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Vortex Studio AI Copilot</h3>
                <span className="text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800/60 px-2 py-0.5 rounded-full">
                  Vercel AI SDK v7
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Multi-step tool calling • Live CRM queries • Creative Direction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Strip */}
        <div className="flex items-center gap-2 p-2.5 px-4 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex-shrink-0">
            Quick Prompts:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.query)}
              disabled={loading}
              className="flex-shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-all shadow-sm disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs ${
                    isUser
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Tool Call Pills (if any were executed by the agent) */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {msg.tools.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300"
                        >
                          <Wrench className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Tool: {t.toolName}()</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-2">{msg.text}</div>
                  </div>

                  <span className="mt-1 text-[10px] text-zinc-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span>Vortex AI is reasoning & calling CRM tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Vortex AI about clients, active deadlines, revenue, or briefs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-40 transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Agent</span>
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 px-1">
            <span>Powered by Vercel AI SDK • Multi-step tool execution</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Link as LinkIcon,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/types';

export default function ClientProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/projects?clientId=${user?.id || 'client_1'}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Your Studio Projects</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Track production stages, milestones, task progress and expected delivery deadlines
        </p>
      </div>

      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
            <FolderKanban className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No active projects</h3>
            <p className="text-xs text-zinc-500 mt-1">Contact your designer to begin your next campaign.</p>
          </div>
        ) : (
          projects.map((proj) => {
            const completedCount = proj.tasks?.filter((t) => t.completed).length || 0;
            const totalTasks = proj.tasks?.length || 1;
            const progressPercent = Math.round((completedCount / totalTasks) * 100);

            return (
              <div
                key={proj.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm backdrop-blur space-y-5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800/40 px-2.5 py-0.5 rounded">
                        {proj.type}
                      </span>
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Stage: {proj.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-2">{proj.title}</h2>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-center shadow-xs">
                      <span className="text-[10px] text-zinc-500 block uppercase">Due Date</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{proj.deadline}</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-center shadow-xs">
                      <span className="text-[10px] text-zinc-500 block uppercase">Revisions</span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-400">
                        {proj.revisionsUsed} / {proj.revisionsAllowed}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  {proj.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-300">Milestone Completion</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-400">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  </div>
                </div>

                {/* Production Task Checklist */}
                {proj.tasks && proj.tasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Deliverable Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {proj.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-colors ${
                            task.completed
                              ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-zinc-800 dark:text-zinc-300'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${
                              task.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-600'
                            }`}
                          />
                          <span className={task.completed ? 'line-through opacity-80' : ''}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

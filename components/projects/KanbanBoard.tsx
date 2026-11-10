'use client';

import React, { useState } from 'react';
import {
  FolderKanban,
  List,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
  MoreVertical,
  Plus,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '@/types';

interface KanbanBoardProps {
  projects: Project[];
  onProjectStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
}

const PIPELINE_COLUMNS: { status: ProjectStatus; label: string; color: string }[] = [
  { status: 'Brief Received', label: 'Brief Received', color: 'border-zinc-400 dark:border-zinc-700' },
  { status: 'In Progress', label: 'In Progress', color: 'border-blue-500/50' },
  { status: 'Draft Shared', label: 'Draft Shared', color: 'border-cyan-500/50' },
  { status: 'Revisions', label: 'Revisions', color: 'border-amber-500/50' },
  { status: 'Approved', label: 'Approved', color: 'border-emerald-500/50' },
  { status: 'Final Delivered', label: 'Final Delivered', color: 'border-violet-500/50' },
];

export default function KanbanBoard({
  projects,
  onProjectStatusChange,
  onSelectProject,
  onNewProject,
}: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60';
      case 'High':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60';
      case 'Medium':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60';
      default:
        return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: View Switcher (Kanban, List, Calendar) & + Add Project */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 text-xs shadow-sm">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Kanban Pipeline</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendar View</span>
          </button>
        </div>

        <button
          onClick={onNewProject}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create New Project</span>
        </button>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
          {PIPELINE_COLUMNS.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.status);

            return (
              <div
                key={col.status}
                className="w-80 flex-shrink-0 flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-950/70 p-3.5 backdrop-blur shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full border ${col.color} bg-current`} />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{col.label}</span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-400">
                    {colProjects.length}
                  </span>
                </div>

                {/* Cards in this Column */}
                <div className="mt-3 flex-1 space-y-3 min-h-[300px]">
                  {colProjects.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800/60 p-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
                      Empty stage
                    </div>
                  ) : (
                    colProjects.map((proj) => {
                      const completedTasks = proj.tasks?.filter((t) => t.completed).length || 0;
                      const totalTasks = proj.tasks?.length || 0;

                      return (
                        <div
                          key={proj.id}
                          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 shadow-sm dark:shadow-lg hover:border-violet-500/40 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => onSelectProject(proj)}
                        >
                          {/* Priority & Type badges */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 px-2 py-0.5 rounded-md">
                              {proj.type}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(
                                proj.priority
                              )}`}
                            >
                              {proj.priority}
                            </span>
                          </div>

                          <h4 className="mt-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors line-clamp-2">
                            {proj.title}
                          </h4>

                          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {proj.clientCompany} • {proj.clientName}
                          </p>

                          {/* Revisions & Task Progress */}
                          <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                              <span>
                                {completedTasks}/{totalTasks} tasks
                              </span>
                            </span>

                            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                              Rev: {proj.revisionsUsed}/{proj.revisionsAllowed}
                            </span>
                          </div>

                          {/* Quick stage transition button */}
                          <div
                            className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px]">
                              <Clock className="h-3 w-3 text-amber-500" />
                              <span>Due {proj.deadline}</span>
                            </span>

                            {/* Dropdown to advance status */}
                            <select
                              value={proj.status}
                              onChange={(e) => onProjectStatusChange(proj.id, e.target.value as ProjectStatus)}
                              className="bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-800 dark:text-zinc-200 rounded px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 outline-none cursor-pointer"
                            >
                              {PIPELINE_COLUMNS.map((c) => (
                                <option key={c.status} value={c.status}>
                                  Move → {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur shadow-sm dark:shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-950/80 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Quote</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {projects.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300">
                    <div>{proj.title}</div>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">{proj.type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                    <div className="font-semibold">{proj.clientCompany}</div>
                    <div className="text-[10px] text-zinc-500">{proj.clientName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getPriorityBadge(proj.priority)}`}>
                      {proj.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    {proj.deadline}
                  </td>
                  <td className="py-3.5 px-4 font-black text-zinc-900 dark:text-zinc-200">
                    ₹{proj.quotedAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm dark:shadow-none backdrop-blur">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              November 2026 Work Calendar & Deadlines
            </h3>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-bold">Interactive Schedule</span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2 font-bold text-zinc-500 uppercase text-[11px]">
                {day}
              </div>
            ))}

            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-11-${dayNum.toString().padStart(2, '0')}`;
              const dayProjects = projects.filter((p) => p.deadline === dateStr);

              return (
                <div
                  key={dayNum}
                  className={`min-h-[90px] rounded-2xl border p-2 text-left flex flex-col justify-between ${
                    dayNum === 10
                      ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/20'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        dayNum === 10 ? 'text-violet-700 dark:text-violet-300 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {dayNum} {dayNum === 10 && '(Today)'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectProject(p)}
                        className="rounded-lg bg-violet-100 dark:bg-violet-600/30 border border-violet-300 dark:border-violet-500/40 p-1 text-[10px] font-bold text-violet-800 dark:text-violet-200 truncate cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-600/50"
                        title={p.title}
                      >
                        {p.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

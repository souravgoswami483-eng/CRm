'use client';

import React, { useState, useEffect } from 'react';
import KanbanBoard from '@/components/projects/KanbanBoard';
import ProjectModal from '@/components/projects/ProjectModal';
import { Project, ProjectStatus, Client } from '@/types';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Sparkles,
  Link as LinkIcon,
  X,
  FileCheck2,
  Receipt,
  Plus,
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clients'),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData.clients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle checklist item
  const toggleTask = async (taskId: string) => {
    if (!selectedProject) return;
    const updatedTasks = selectedProject.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    try {
      await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      setSelectedProject({ ...selectedProject, tasks: updatedTasks });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Work & Project Pipelines</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Kanban boards, deliverable scopes, interactive checklists & revision tracking
        </p>
      </div>

      {/* Main Interactive Kanban / List / Calendar Board */}
      <KanbanBoard
        projects={projects}
        onProjectStatusChange={handleStatusChange}
        onSelectProject={(proj) => setSelectedProject(proj)}
        onNewProject={() => {
          setEditingProject(null);
          setIsModalOpen(true);
        }}
      />

      {/* PROJECT DETAILS MODAL / DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">{selectedProject.title}</h2>
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                    {selectedProject.clientCompany} • {selectedProject.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Pipeline Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Stage</span>
                  <span className="font-bold text-zinc-900 dark:text-white text-sm">{selectedProject.status}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Priority</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{selectedProject.priority}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Revisions</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                    {selectedProject.revisionsUsed} / {selectedProject.revisionsAllowed} used
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Deadline</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProject.deadline}</span>
                </div>
              </div>

              {/* Brief Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Creative Scope & Brief
                </h4>
                <p className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {selectedProject.description || 'No detailed brief description provided.'}
                </p>
              </div>

              {/* Reference Links */}
              {selectedProject.referenceLinks && selectedProject.referenceLinks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                    Reference Links & Moodboards
                  </h4>
                  <div className="space-y-1.5">
                    {selectedProject.referenceLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 transition-colors truncate"
                      >
                        <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Task Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Production Checklist ({selectedProject.tasks?.filter((t) => t.completed).length || 0}/
                    {selectedProject.tasks?.length || 0})
                  </h4>
                </div>

                <div className="space-y-2">
                  {selectedProject.tasks?.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        task.completed
                          ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-zinc-400 line-through'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-emerald-500 h-4 w-4 pointer-events-none"
                        />
                        <span>{task.title}</span>
                      </div>
                      {task.dueDate && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Due {task.dueDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Invoices and Files Quick Access */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Quoted Budget: <strong className="text-zinc-900 dark:text-zinc-100 font-bold">₹{selectedProject.quotedAmount.toLocaleString('en-IN')}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProject(selectedProject);
                      setSelectedProject(null);
                      setIsModalOpen(true);
                    }}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Edit Project
                  </button>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        clients={clients}
        initialData={editingProject}
        onSave={async (projectData) => {
          if (editingProject) {
            await fetch(`/api/projects/${editingProject.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData),
            });
          } else {
            await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(projectData),
            });
          }
          fetchProjects();
        }}
      />
    </div>
  );
}




'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FileReviewStudio from '@/components/files/FileReviewStudio';
import FileUploadModal from '@/components/files/FileUploadModal';
import { CreativeFile, Project } from '@/types';
import {
  FileCheck2,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  CheckCircle2,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';

function AdminFilesContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [files, setFiles] = useState<CreativeFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; companyName: string; clientId: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<CreativeFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fRes, pRes, cRes] = await Promise.all([
        fetch('/api/files'),
        fetch('/api/projects'),
        fetch('/api/clients'),
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        const fileList = fData.files || [];
        setFiles(fileList);

        if (initialId) {
          const match = fileList.find((f: CreativeFile) => f.id === initialId);
          if (match) setSelectedFile(match);
          else if (fileList.length > 0) setSelectedFile(fileList[0]);
        } else if (fileList.length > 0 && !selectedFile) {
          setSelectedFile(fileList[0]);
        }
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData.clients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialId]);

  const refreshActiveFile = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch(`/api/files/${selectedFile.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFile(data.file);
        setFiles((prev) =>
          prev.map((f) => (f.id === data.file.id ? data.file : f))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Projects belonging to selected client
  const projectsForClient = filterClient
    ? projects.filter((p) => p.clientId === filterClient)
    : projects;

  const clientProjectIds = new Set(projectsForClient.map((p) => p.id));

  const filteredFiles = files.filter((f) => {
    const p = projects.find((proj) => proj.id === f.projectId);
    const matchesClient = !filterClient || f.clientId === filterClient || p?.clientId === filterClient || clientProjectIds.has(f.projectId);
    const matchesProject = !filterProject || f.projectId === filterProject;
    return matchesClient && matchesProject;
  });

  const handleClientChange = (clientId: string) => {
    setFilterClient(clientId);
    setFilterProject(''); // Reset project when client changes
    // Auto-select the first file belonging to this client if any
    const matching = files.filter((f) => {
      const p = projects.find((proj) => proj.id === f.projectId);
      return !clientId || f.clientId === clientId || p?.clientId === clientId;
    });
    if (matching.length > 0) {
      setSelectedFile(matching[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setFilterProject(projectId);
    const matching = files.filter((f) => {
      const p = projects.find((proj) => proj.id === f.projectId);
      const matchesClient = !filterClient || f.clientId === filterClient || p?.clientId === filterClient;
      const matchesProj = !projectId || f.projectId === projectId;
      return matchesClient && matchesProj;
    });
    if (matching.length > 0) {
      setSelectedFile(matching[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const clearFilters = () => {
    setFilterClient('');
    setFilterProject('');
    if (files.length > 0) setSelectedFile(files[0]);
  };

  const activeClientObj = clients.find((c) => c.id === filterClient);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Creative Review Studio
          </h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
            Interactive point-to-point pin comments, video timestamp revisions, side-by-side comparison &amp; watermarking
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="h-4 w-4" />
          <span>+ Upload New Asset</span>
        </button>
      </div>

      {/* Filter Bar: Client + Project */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-sm dark:shadow-none backdrop-blur">
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs">
          <Filter className="h-4 w-4" />
          <span>Filter Works:</span>
        </div>

        {/* Client Name Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Client:</label>
          <select
            value={filterClient}
            onChange={(e) => handleClientChange(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-200 outline-none focus:border-violet-500 dark:focus:border-violet-500 cursor-pointer shadow-sm"
          >
            <option value="">All Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} — {c.name} ({c.clientId})
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter (scoped to selected client) */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Project:</label>
          <select
            value={filterProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-200 outline-none focus:border-violet-500 dark:focus:border-violet-500 cursor-pointer shadow-sm"
          >
            <option value="">All Projects ({projectsForClient.length})</option>
            {projectsForClient.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {(filterClient || filterProject) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filter
          </button>
        )}

        {filterClient && activeClientObj && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-950/80 border border-violet-300 dark:border-violet-800/60 px-3 py-1 text-xs font-bold text-violet-800 dark:text-violet-300">
            <span>Filtered for: {activeClientObj.companyName}</span>
          </span>
        )}

        <span className="ml-auto text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
          Showing {filteredFiles.length} of {files.length} assets
        </span>
      </div>

      {/* Quick Asset Selector Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          {filterClient || filterProject ? 'Filtered:' : 'All Files:'}
        </span>
        {filteredFiles.map((file) => {
          const isSelected = selectedFile?.id === file.id;
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-violet-600/20 border-violet-500 text-violet-900 dark:text-white shadow-lg'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {file.fileType === 'video' ? (
                <Video className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              )}
              <span className="max-w-[140px] truncate">{file.title}</span>
              <span className="font-mono text-[10px] text-zinc-500">
                V{file.currentVersion}
              </span>
            </button>
          );
        })}
        {filteredFiles.length === 0 && !loading && (
          <span className="text-xs text-zinc-400 italic">No files match the current filter.</span>
        )}
      </div>

      {/* Main Review Studio View */}
      {selectedFile ? (
        <FileReviewStudio
          file={selectedFile}
          currentUserRole="ADMIN"
          currentUserName="Sourav Roy"
          onRefreshFile={refreshActiveFile}
        />
      ) : (
        <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
          <UploadCloud className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No creative asset selected</h3>
          <p className="text-xs text-zinc-500 mt-1">Upload a design or video file to start client review.</p>
        </div>
      )}

      {/* UPLOAD MODAL */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projects={projects}
        onUploadSuccess={loadData}
      />
    </div>
  );
}

export default function AdminFilesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500 text-xs">Loading Review Studio...</div>}>
      <AdminFilesContent />
    </Suspense>
  );
}

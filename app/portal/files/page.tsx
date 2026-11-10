'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FileReviewStudio from '@/components/files/FileReviewStudio';
import { CreativeFile } from '@/types';
import { useAuth } from '@/lib/auth-context';
import {
  FileCheck2,
  Image as ImageIcon,
  Video,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

function ClientFilesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [files, setFiles] = useState<CreativeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CreativeFile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      // Load files for this client
      const res = await fetch(`/api/files?clientId=${user?.id || 'client_1'}`);
      if (res.ok) {
        const data = await res.json();
        const fileList: CreativeFile[] = data.files || [];
        setFiles(fileList);

        if (initialId) {
          const match = fileList.find((f) => f.id === initialId);
          if (match) setSelectedFile(match);
          else if (fileList.length > 0) setSelectedFile(fileList[0]);
        } else if (fileList.length > 0 && !selectedFile) {
          setSelectedFile(fileList[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [user, initialId]);

  const refreshActiveFile = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch(`/api/files/${selectedFile.id}?view=true&viewerName=${encodeURIComponent(user?.name || 'Client')}&viewerRole=CLIENT`);
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

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Review Creatives & Videos</h1>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1">
          Point-and-click pin comments on images, timestamped notes on video clips, and 1-click approvals
        </p>
      </div>

      {/* Selector Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex-shrink-0">
          Select Asset:
        </span>
        {files.map((file) => {
          const isSelected = selectedFile?.id === file.id;
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-cyan-100 dark:bg-cyan-600/20 border-cyan-500 text-cyan-900 dark:text-white shadow'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {file.fileType === 'video' ? (
                <Video className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              )}
              <span className="truncate max-w-[150px]">{file.title}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold ${
                  file.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                {file.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Review Studio Container */}
      {selectedFile ? (
        <FileReviewStudio
          file={selectedFile}
          currentUserRole="CLIENT"
          currentUserName={user?.name || 'Client'}
          onRefreshFile={refreshActiveFile}
        />
      ) : (
        <div className="py-24 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
          <FileCheck2 className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">No file selected</h3>
          <p className="text-xs text-zinc-500 mt-1">Select an artwork or video above to begin review</p>
        </div>
      )}
    </div>
  );
}

export default function ClientFilesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-zinc-500">
          Loading Review Studio...
        </div>
      }
    >
      <ClientFilesContent />
    </Suspense>
  );
}

'use client';

import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, ShieldAlert, Lock, Image as ImageIcon, Video } from 'lucide-react';
import { Project } from '@/types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onUploadSuccess: () => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  projects,
  onUploadSuccess,
}: FileUploadModalProps) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [sampleUrl, setSampleUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80'
  );
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [versionNotes, setVersionNotes] = useState('Initial draft v1 render');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'image' | 'video') => {
    setFileType(type);
    if (type === 'video') {
      setSampleUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      if (!title) setTitle('Campaign_Reel_RoughCut_V1.mp4');
    } else {
      setSampleUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');
      if (!title) setTitle('Brand_Visual_Asset_V1.jpg');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 200);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: title || (fileType === 'video' ? 'Video_Cut_V1.mp4' : 'Artwork_V1.jpg'),
          fileType,
          fileUrl: sampleUrl,
          thumbnailUrl: sampleUrl,
          fileSize: fileType === 'video' ? '64.5 MB' : '4.2 MB',
          isWatermarked,
          downloadAllowed,
          versionNotes,
        }),
      });

      if (res.ok) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          onUploadSuccess();
          onClose();
        }, 400);
      }
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Upload Deliverable for Client Review</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Large file chunking, auto-versioning, watermark and download permission controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Select Destination Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                  {p.title} ({p.clientCompany || p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Deliverable Media Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSelect('image')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  fileType === 'image'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Graphic Artwork / Still Image</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('video')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  fileType === 'video'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Video Reel / Motion Clip</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Asset Title / Filename *
            </label>
            <input
              type="text"
              placeholder="e.g. Hero_Section_Visual_V1.jpg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cloud Media Source URL
            </label>
            <input
              type="text"
              value={sampleUrl}
              onChange={(e) => setSampleUrl(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Version Release Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Updated color grading to match director notes"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            />
          </div>

          {/* Security & Access Controls */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Protection & Download Controls
            </span>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs text-zinc-800 dark:text-zinc-300">Overlay Studio Watermark ("DRAFT PREVIEW")</span>
              </div>
              <input
                type="checkbox"
                checked={isWatermarked}
                onChange={(e) => setIsWatermarked(e.target.checked)}
                className="h-4 w-4 rounded accent-violet-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-zinc-800 dark:text-zinc-300">Allow Master File Download Before Payment</span>
              </div>
              <input
                type="checkbox"
                checked={downloadAllowed}
                onChange={(e) => setDownloadAllowed(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                <span>Encoding & Uploading chunks...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {uploading ? 'Processing File...' : 'Upload & Publish to Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

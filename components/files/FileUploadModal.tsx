'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Image as ImageIcon,
  Video,
  Link2,
  FileCode,
  AlertCircle,
  FileVideo,
} from 'lucide-react';
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
  const [fileType, setFileType] = useState<'image' | 'video'>('video');
  const [uploadMode, setUploadMode] = useState<'direct' | 'link'>('direct');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [versionNotes, setVersionNotes] = useState('Initial review cut V1');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

  const handleTypeSelect = (type: 'image' | 'video') => {
    setFileType(type);
    setFileError(null);
    setSelectedFile(null);
    setFileUrl('');
    setFileSizeStr('');

    if (type === 'video') {
      setTitle('Brand_Campaign_Reel_Cut_V1.mp4');
      setFileUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setFileSizeStr('18.4 MB');
    } else {
      setTitle('Keynote_Hero_Graphic_V1.jpg');
      setFileUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');
      setFileSizeStr('4.2 MB');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 30MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `File size exceeds 30MB limit! (Selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB). Please choose a file under 30MB or provide a cloud link.`
      );
      setSelectedFile(null);
      return;
    }

    // If video mode, check MP4 extension/mime
    if (fileType === 'video') {
      const isMp4 =
        file.type === 'video/mp4' ||
        file.name.toLowerCase().endsWith('.mp4');

      if (!isMp4) {
        setFileError('Invalid video format! Only MP4 videos are allowed for review playback.');
        setSelectedFile(null);
        return;
      }
    }

    setSelectedFile(file);
    setTitle(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setFileSizeStr(sizeInMb);

    // Create object URL for local playback / preview
    const previewUrl = URL.createObjectURL(file);
    setFileUrl(previewUrl);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    const finalUrl = fileUrl.trim() ||
      (fileType === 'video'
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');

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
    }, 150);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || projects[0]?.id,
          title: title || (fileType === 'video' ? 'Reel_Cut_V1.mp4' : 'Artwork_V1.jpg'),
          fileType,
          fileUrl: finalUrl,
          thumbnailUrl: fileType === 'video'
            ? 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80'
            : finalUrl,
          fileSize: fileSizeStr || (fileType === 'video' ? '18.4 MB' : '4.2 MB'),
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
        }, 350);
      } else {
        clearInterval(interval);
        setUploading(false);
        const data = await res.json();
        setFileError(data.error || 'Failed to upload asset');
      }
    } catch (err: any) {
      console.error(err);
      setUploading(false);
      setFileError(err.message || 'Upload error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-7 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 shadow-inner">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Upload Deliverable for Client Review
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Supports MP4 video (up to 30MB) and graphics with direct upload or cloud link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fileError && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
            <span>{fileError}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
          {/* Select Project */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Destination Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                  {p.title} ({p.clientCompany || p.clientName})
                </option>
              ))}
            </select>
          </div>

          {/* Media Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Deliverable Media Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSelect('video')}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                  fileType === 'video'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-sm'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Video className="h-4 w-4" />
                <span>MP4 Video (up to 30MB)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('image')}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                  fileType === 'image'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Graphic Still Artwork / PDF</span>
              </button>
            </div>
          </div>

          {/* Upload Method Tabs: Direct File vs Cloud Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Upload Method
            </label>
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 mb-3">
              <button
                type="button"
                onClick={() => setUploadMode('direct')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === 'direct'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Direct File Upload (Max 30MB)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === 'link'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Cloud Media Link / URL</span>
              </button>
            </div>

            {uploadMode === 'direct' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={fileType === 'video' ? 'video/mp4,.mp4' : 'image/*,.psd,.pdf'}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-900/40 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mx-auto text-zinc-500 group-hover:scale-105 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all">
                    {fileType === 'video' ? <FileVideo className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
                  </div>
                  <div className="mt-3 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedFile ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ Selected: {selectedFile.name} ({fileSizeStr})
                      </span>
                    ) : (
                      <span>
                        Click to browse or drag &amp; drop {fileType === 'video' ? 'MP4 video' : 'image'} file
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {fileType === 'video' ? 'Supported format: MP4 • Maximum size: 30 MB' : 'Supported: JPG, PNG, WEBP, SVG, PSD, PDF • Max 30 MB'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  placeholder={fileType === 'video' ? 'https://.../video.mp4' : 'https://.../image.jpg'}
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white font-mono outline-none focus:border-violet-500"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">Quick Samples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileType('video');
                      setFileUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                      setTitle('Campaign_Reel_V1.mp4');
                      setFileSizeStr('18.4 MB');
                    }}
                    className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Sample MP4 Reel
                  </button>
                  <span className="text-zinc-400">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileType('image');
                      setFileUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');
                      setTitle('Brand_Asset_V1.jpg');
                      setFileSizeStr('4.2 MB');
                    }}
                    className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Sample 4K Artwork
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filename & Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Deliverable Title / Filename *
            </label>
            <input
              type="text"
              placeholder={fileType === 'video' ? 'e.g. Hero_Reel_RoughCut_V1.mp4' : 'e.g. Campaign_Banner_V1.jpg'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-violet-500"
            />
          </div>

          {/* Version Release Notes */}
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
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Protection &amp; Download Controls
            </span>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs text-zinc-800 dark:text-zinc-300">
                  Overlay Studio Watermark ("DRAFT PREVIEW")
                </span>
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
                <span className="text-xs text-zinc-800 dark:text-zinc-300">
                  Allow Master File Download Before Payment
                </span>
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
                <span>Chunked Encoding &amp; Uploading...</span>
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

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
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

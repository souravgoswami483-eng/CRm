'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Download,
  Lock,
  Layers,
  Sparkles,
  SplitSquareVertical,
  Plus,
  Send,
  Eye,
  Sliders,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CreativeFile, FileComment, FileVersion, UserRole } from '@/types';

interface FileReviewStudioProps {
  file: CreativeFile;
  currentUserRole: UserRole;
  currentUserName: string;
  onRefreshFile: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
}

export default function FileReviewStudio({
  file,
  currentUserRole,
  currentUserName,
  onRefreshFile,
  onApprove,
  onRequestChanges,
}: FileReviewStudioProps) {
  const [selectedVersion, setSelectedVersion] = useState<number>(file.currentVersion || 1);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareVersionNumber, setCompareVersionNumber] = useState<number>(
    file.versions && file.versions.length > 1 ? file.versions[0].versionNumber : 1
  );

  // Zoom & Pan for image viewer
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pinCoordinates, setPinCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activePinComment, setActivePinComment] = useState<FileComment | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [celebrateApproved, setCelebrateApproved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Find active version file object
  const activeVersion =
    file.versions?.find((v) => v.versionNumber === selectedVersion) ||
    file.versions?.[file.versions.length - 1] || {
      versionNumber: file.currentVersion || 1,
      fileUrl: file.fileUrl,
      thumbnailUrl: file.thumbnailUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: '',
    };

  const compareVersion =
    file.versions?.find((v) => v.versionNumber === compareVersionNumber) || activeVersion;

  // Handle image click to place a pin comment
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPinCoordinates({
      x: Math.max(2, Math.min(98, Math.round(x))),
      y: Math.max(2, Math.min(98, Math.round(y))),
    });
    setActivePinComment(null);
  };

  // Submit comment
  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;
    setSubmittingComment(true);

    try {
      const payload: any = {
        userName: currentUserName,
        userRole: currentUserRole,
        content: newCommentText.trim(),
      };

      if (pinCoordinates) {
        payload.pinCoordinates = pinCoordinates;
      } else if (file.fileType === 'video') {
        payload.timestampSeconds = Math.round(videoCurrentTime);
      }

      const res = await fetch(`/api/files/${file.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewCommentText('');
        setPinCoordinates(null);
        onRefreshFile();
      }
    } catch (e) {
      console.error('Error posting comment', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle approve
  const handleApproveClick = async () => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Approved',
          approvedBy: currentUserName,
        }),
      });
      if (res.ok) {
        setCelebrateApproved(true);
        setTimeout(() => setCelebrateApproved(false), 4000);
        onRefreshFile();
        if (onApprove) onApprove();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle request changes
  const handleRequestChangesClick = async () => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Changes Requested',
          approvedBy: currentUserName,
        }),
      });
      if (res.ok) {
        onRefreshFile();
        if (onRequestChanges) onRequestChanges();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Watermark toggle
  const handleToggleWatermark = async () => {
    try {
      await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWatermarked: !file.isWatermarked }),
      });
      onRefreshFile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDownload = async () => {
    try {
      await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadAllowed: !file.downloadAllowed }),
      });
      onRefreshFile();
    } catch (e) {
      console.error(e);
    }
  };

  // Video helpers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToVideoTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">
      {/* LEFT: Viewer Canvas */}
      <div className="flex-1 flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 lg:p-6 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Celebration banner */}
        {celebrateApproved && (
          <div className="absolute inset-x-0 top-0 z-30 bg-emerald-600 text-white py-2 px-4 text-center font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
            <Sparkles className="h-4 w-4" />
            <span>Creative Approved Successfully! Client sign-off logged to audit trail.</span>
          </div>
        )}

        {/* Top Control Bar: Version selector, side-by-side compare, zoom */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            {/* Version dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Version:</span>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="bg-transparent text-zinc-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                {file.versions?.map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    V{v.versionNumber} {v.versionNumber === file.currentVersion ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Compare side-by-side button */}
            {file.versions && file.versions.length > 1 && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  compareMode
                    ? 'bg-violet-600 border-violet-500 text-white shadow'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <SplitSquareVertical className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Side-by-Side Compare</span>
              </button>
            )}

            {/* File status badge */}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                file.status === 'Approved'
                  ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : file.status === 'Changes Requested'
                  ? 'bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-violet-100 dark:bg-violet-950 border border-violet-300 dark:border-violet-500/40 text-violet-800 dark:text-violet-300'
              }`}
            >
              {file.status}
            </span>
          </div>

          {/* Right Action Tools: Zoom & Admin Controls */}
          <div className="flex items-center gap-2">
            {file.fileType !== 'video' && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-1 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Admin watermark and download toggles */}
            {currentUserRole === 'ADMIN' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleWatermark}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    file.isWatermarked
                      ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Toggle Watermark Protection"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>{file.isWatermarked ? 'Watermarked' : 'No Watermark'}</span>
                </button>

                <button
                  onClick={handleToggleDownload}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    file.downloadAllowed
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title="Toggle Client Download Permission"
                >
                  {file.downloadAllowed ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{file.downloadAllowed ? 'Download ON' : 'Download Locked'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="mt-4 flex-1 flex items-center justify-center min-h-[460px] bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl relative overflow-hidden border border-zinc-200 dark:border-zinc-800/60 select-none">
          {/* Watermark Overlay */}
          {file.isWatermarked && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden opacity-30 dark:opacity-25">
              <div className="transform -rotate-45 text-4xl sm:text-6xl font-black uppercase tracking-widest text-zinc-900/40 dark:text-white/50 text-center select-none border-y-4 border-dashed border-zinc-500/40 dark:border-white/40 py-4 px-12">
                DRAFT PREVIEW • VORTEX STUDIO • NOT FINAL
              </div>
            </div>
          )}

          {/* VIEW: VIDEO */}
          {file.fileType === 'video' ? (
            <div className="w-full flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  src={activeVersion.fileUrl}
                  className="w-full aspect-video object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                />

                {/* Video controls bar */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2">
                  <div className="relative w-full flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 100}
                      value={videoCurrentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVideoCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />

                    {/* Timestamp markers from comments */}
                    {file.comments
                      ?.filter((c) => c.timestampSeconds !== undefined)
                      .map((comm) => {
                        const leftPercent = videoDuration
                          ? Math.min(100, Math.max(0, (comm.timestampSeconds! / videoDuration) * 100))
                          : 0;
                        return (
                          <button
                            key={comm.id}
                            onClick={() => jumpToVideoTime(comm.timestampSeconds!)}
                            title={`${comm.userName} at ${formatTime(comm.timestampSeconds!)}: ${comm.content}`}
                            style={{ left: `${leftPercent}%` }}
                            className="absolute -top-1 h-3.5 w-3.5 -ml-1.5 rounded-full bg-amber-400 border border-zinc-900 shadow hover:scale-125 transition-transform"
                          />
                        );
                      })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                      </button>
                      <span className="font-mono text-[11px] text-zinc-300">
                        {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }}
                        className="p-1 text-zinc-300 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (videoRef.current?.requestFullscreen) {
                            videoRef.current.requestFullscreen();
                          }
                        }}
                        className="p-1 text-zinc-300 hover:text-white"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : compareMode ? (
            /* VIEW: SIDE-BY-SIDE COMPARISON */
            <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                  V{compareVersion.versionNumber} (Comparison Reference)
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
                  <img
                    src={compareVersion.fileUrl}
                    alt={`V${compareVersion.versionNumber}`}
                    className="max-h-[420px] object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-2">
                  V{activeVersion.versionNumber} (Current Active Version)
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-violet-400 dark:border-violet-500/40 bg-white dark:bg-zinc-950 shadow-md">
                  <img
                    src={activeVersion.fileUrl}
                    alt={`V${activeVersion.versionNumber}`}
                    className="max-h-[420px] object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* VIEW: IMAGE WITH CLICK-TO-PIN */
            <div
              ref={imageContainerRef}
              onClick={handleImageClick}
              style={{ transform: `scale(${zoomLevel})` }}
              className="relative cursor-crosshair transition-transform duration-150 ease-out max-w-full"
            >
              <img
                src={activeVersion.fileUrl}
                alt={file.title}
                className="max-h-[500px] w-auto object-contain rounded-2xl shadow-xl pointer-events-none"
              />

              {/* Existing Pinned Comments */}
              {file.comments
                ?.filter((c) => c.pinCoordinates)
                .map((comm, idx) => (
                  <div
                    key={comm.id}
                    style={{ left: `${comm.pinCoordinates!.x}%`, top: `${comm.pinCoordinates!.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinComment(comm);
                    }}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-[10px] shadow-lg ring-2 ring-white hover:scale-125 transition-transform cursor-pointer animate-pulse">
                      {idx + 1}
                    </div>

                    {/* Popover on hover/click */}
                    <div className="absolute left-7 top-0 hidden group-hover:block w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs shadow-2xl z-30 pointer-events-auto">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold text-zinc-900 dark:text-zinc-200">{comm.userName}</span>
                        <span className="text-[10px] text-zinc-400">#{idx + 1}</span>
                      </div>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Temporary Pin being placed */}
              {pinCoordinates && (
                <div
                  style={{ left: `${pinCoordinates.x}%`, top: `${pinCoordinates.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-zinc-950 font-bold text-xs ring-4 ring-cyan-500/30 animate-bounce">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Buttons: Approve / Request Changes */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {file.fileType === 'video' ? (
              <span>Tip: Pause video at any second to add a timestamped revision note.</span>
            ) : (
              <span>Tip: Click anywhere on the artwork to drop an exact coordinate pin comment.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {file.downloadAllowed ? (
              <a
                href={`/api/files/${file.id}/access?action=download`}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download High-Res</span>
              </a>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-400 cursor-not-allowed">
                <Lock className="h-3.5 w-3.5" />
                <span>Download Locked (Post-Payment)</span>
              </div>
            )}

            <button
              onClick={handleRequestChangesClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:scale-[1.02] transition-all shadow-sm"
            >
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Request Changes</span>
            </button>

            <button
              disabled={file.status === 'Changes Requested'}
              onClick={handleApproveClick}
              title={
                file.status === 'Changes Requested'
                  ? 'Approve is locked while changes are requested. A new version must be uploaded or changes resolved.'
                  : 'Approve Artwork'
              }
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all ${
                file.status === 'Changes Requested'
                  ? 'bg-zinc-400 dark:bg-zinc-700 opacity-60 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-500 hover:scale-[1.02]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{file.status === 'Changes Requested' ? 'Approval Locked (Changes Open)' : 'Approve Artwork'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Collaboration & Comments Thread Panel */}
      <div className="w-full xl:w-96 flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 p-5 shadow-sm dark:shadow-2xl backdrop-blur transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Feedback & Revisions</h3>
          </div>
          <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 px-2 py-0.5 rounded-full">
            {file.comments?.length || 0}
          </span>
        </div>

        {/* Comment Entry Input Box */}
        <div className="mt-4 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          {pinCoordinates ? (
            <div className="flex items-center justify-between text-[11px] text-cyan-700 dark:text-cyan-400 font-bold mb-2">
              <span>📍 Pinning feedback at ({pinCoordinates.x}%, {pinCoordinates.y}%)</span>
              <button
                onClick={() => setPinCoordinates(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancel pin
              </button>
            </div>
          ) : file.fileType === 'video' ? (
            <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-bold mb-2">
              <span>⏱️ Attaching feedback to {formatTime(videoCurrentTime)}</span>
            </div>
          ) : null}

          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              pinCoordinates
                ? 'Type feedback for this pinned spot...'
                : file.fileType === 'video'
                ? `Type feedback for timestamp ${formatTime(videoCurrentTime)}...`
                : 'Click artwork to place pin, or write general revision feedback...'
            }
            rows={3}
            className="w-full bg-white dark:bg-zinc-950 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none border border-zinc-200 dark:border-zinc-800 focus:border-violet-500 transition-colors resize-none"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Posting as {currentUserName}</span>
            <button
              disabled={!newCommentText.trim() || submittingComment}
              onClick={handlePostComment}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3 w-3" />
              <span>{submittingComment ? 'Sending...' : 'Post Comment'}</span>
            </button>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="mt-4 flex-1 overflow-y-auto max-h-[480px] space-y-3 pr-1">
          {(!file.comments || file.comments.length === 0) ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No comments yet on this creative.
              <p className="mt-1 text-[11px]">Click on the image or pause the video to leave the first note!</p>
            </div>
          ) : (
            file.comments.map((comm, idx) => (
              <div
                key={comm.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  comm.resolved
                    ? 'border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        comm.userRole === 'ADMIN' ? 'bg-violet-500' : 'bg-cyan-500'
                      }`}
                    />
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-200">{comm.userName}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">
                      {comm.userRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{comm.createdAt}</span>
                </div>

                {/* Pin badge or Timestamp badge */}
                {comm.pinCoordinates && (
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 px-2 py-0.5 rounded">
                    <span>📍 Pin #{idx + 1} at ({comm.pinCoordinates.x}%, {comm.pinCoordinates.y}%)</span>
                  </div>
                )}
                {comm.timestampSeconds !== undefined && (
                  <button
                    onClick={() => jumpToVideoTime(comm.timestampSeconds!)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                  >
                    <span>⏱️ Jump to {formatTime(comm.timestampSeconds)}</span>
                  </button>
                )}

                <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {comm.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

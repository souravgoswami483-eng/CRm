'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  Layers,
  Video,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Star,
  ExternalLink,
  Lock,
  Eye,
  FileCheck2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { user, theme, toggleTheme } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-violet-600 selection:text-white transition-colors duration-200 overflow-hidden">
      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white dark:bg-zinc-950">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-zinc-900 dark:text-white">VORTEX</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Creative Studio
              </span>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            <a href="#services" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Disciplines
            </a>
            <a href="#portal-features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Collaboration Studio
            </a>
            <a href="#reviews" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Workflow
            </a>
          </div>

          {/* Controls & Unified Login */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>

            {user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin' : '/portal'}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Unified Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Multi-layered Parallax */}
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        {/* Layer 1: Parallax Glowing Orb Background */}
        <div
          style={{ transform: `translateY(${scrollY * 0.35}px)` }}
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-violet-600/20 via-indigo-600/15 to-transparent blur-[120px] -z-10"
        />

        {/* Layer 2: Geometric mesh patterns */}
        <div
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          className="pointer-events-none absolute top-20 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[90px] -z-10"
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          {/* Studio Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-100 dark:bg-violet-950/40 px-4 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 backdrop-blur-md mb-8 shadow-inner animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>DIRECTOR-LEVEL VISUAL IDENTITY & CINEMATIC MOTION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-5xl mx-auto leading-[1.1]">
            We craft <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 dark:from-violet-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">high-octane visuals</span> that define global brands.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The private portfolio and client collaboration CRM for Sourav Roy — Graphic Designer & Video Editor. 
            Real-time timestamped video reviews, point-and-click pin comments, and streamlined invoices.
          </p>

          {/* Unified Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Sign In with ID or Email</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/90 px-7 py-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <Eye className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Preview Admin Studio</span>
            </Link>

            <Link
              href="/portal"
              className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/90 px-7 py-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Preview Client Hub</span>
            </Link>
          </div>

          {/* Layer 3: Floating Creative Mockup Card */}
          <div
            style={{ transform: `translateY(${scrollY * -0.08}px)` }}
            className="mt-16 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-xl relative max-w-5xl mx-auto ring-1 ring-zinc-900/5 dark:ring-white/10"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-zinc-900 group">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&auto=format&fit=crop&q=80"
                alt="Studio Keyframe Reel"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex items-end justify-between p-6 sm:p-10">
                <div className="text-left">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
                    Featured Deliverable
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    Zenith SaaS 2.0 Product Keynote & 3D Motion Graphics
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    90s Launch Keynote • Kinetic Typography • 4K Master Delivered
                  </p>
                </div>

                <Link
                  href="/admin/files?id=file_1"
                  className="flex items-center gap-2 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white px-4 py-2 text-xs font-bold backdrop-blur shadow-lg transition-transform hover:scale-105"
                >
                  <Eye className="h-4 w-4" />
                  <span>Inspect Review Studio</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Creative Disciplines */}
      <section id="services" className="py-24 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Disciplines & Expertise
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
              End-to-end creative production tailored for modern brands.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-7 hover:border-violet-500/40 transition-all group shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">Video Editing & Shortform</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Viral 9:16 Instagram Reels, YouTube documentary pacing, sound design, and Hollywood color grading in DaVinci Resolve & Premiere Pro.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-7 hover:border-cyan-500/40 transition-all group shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Palette className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">3D Motion Graphics & VFX</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Cinema4D & After Effects fluid simulations, product reveals, futuristic HUD UI overlays, and punchy commercial title stingers.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-7 hover:border-indigo-500/40 transition-all group shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">Brand Identity Systems</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Full visual language guidelines, vector emblems, typographic pairings, packaging design, and multi-channel campaign collateral.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Review Portal Feature Spotlight */}
      <section id="portal-features" className="py-24 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Frictionless Client Collaboration
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
                No messy emails or WhatsApp lost links. Review creatives in one place.
              </h2>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every client gets their unique ID (e.g. <strong className="text-cyan-600 dark:text-cyan-300 font-mono">CL-2026-0042</strong>) with real-time feedback pins, video timestamp markers, and 1-click approvals.
              </p>

              <div className="mt-6 space-y-3.5 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span><strong>Click-to-Pin Comments:</strong> Click anywhere on the artwork to point out precise edits.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span><strong>Timestamped Video Revisions:</strong> Pause at 00:42 and leave instant frame-exact notes.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span><strong>Version Control (V1, V2, V3):</strong> Compare changes side-by-side before giving final sign-off.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span><strong>Instant Invoices & PDF Receipts:</strong> Settle via UPI QR, bank transfer or cards seamlessly.</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign In with Client ID</span>
                </Link>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <span>Preview Client Hub</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-2xl relative">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"
                alt="Client Review Studio"
                className="rounded-xl w-full object-cover max-h-96"
              />
              <div className="absolute top-10 left-10 rounded-xl bg-white/95 dark:bg-zinc-900/90 border border-violet-500/40 p-3 shadow-2xl backdrop-blur text-xs max-w-xs animate-parallax-float">
                <div className="flex items-center gap-2 font-bold text-violet-600 dark:text-violet-400 text-[11px]">
                  <span>📍 Pin #1 by Alex Rivers (Zenith)</span>
                </div>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                  "Boost the contrast on this metrics card by 12% so it stands out against dark background."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-12 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            © 2026 Vortex Creative Labs. All rights reserved. Directed by Sourav Roy.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Unified Login</Link>
            <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Studio Admin</Link>
            <Link href="/portal" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Client Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

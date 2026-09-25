'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Layers, Activity, Database, ExternalLink } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'AI Prompt', href: '/', icon: Sparkles },
    { name: 'Candidate Matches', href: '/matches', icon: Layers },
    { name: 'Ingestion Pipeline', href: '/ingestion', icon: Database },
    { name: 'OTel Telemetry', href: '/telemetry', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 font-bold text-black shadow-md shadow-emerald-500/20">
            ⚡
          </div>
          <div>
            <span className="font-semibold tracking-tight text-white text-base">
              ai-job-matching-engine
            </span>
            <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              v1.0 Local AI
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface text-emerald-400 border border-border shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <a
            href="http://localhost:4000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 ml-3 pl-3 border-l border-border transition-colors"
          >
            <span>Swagger API</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>
      </div>
    </header>
  );
}

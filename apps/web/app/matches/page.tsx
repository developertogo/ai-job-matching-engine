'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMatches } from '../../lib/hooks/useIngestion';
import { MatchCard } from '../../components/MatchCard';
import { Users, Filter, Sparkles, RefreshCw, ChevronDown, Check } from 'lucide-react';

const CANDIDATES = [
  { id: 'cand-alex-chen', name: 'Alex Chen', role: 'Full Stack & AI Systems (6 yrs)' },
  { id: 'cand-maya-lin', name: 'Maya Lin', role: 'ML & AI Pipeline Engineer (5 yrs)' },
  { id: 'cand-david-kim', name: 'David Kim', role: 'Principal Backend Engineer (7 yrs)' },
];

export default function MatchesFeedPage() {
  const [selectedCandidate, setSelectedCandidate] = useState('cand-alex-chen');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCandidate =
    CANDIDATES.find((c) => c.id === selectedCandidate) || CANDIDATES[0];

  const { data: matches = [], isLoading, refetch, isFetching } = useMatches(selectedCandidate);

  const filteredMatches = matches.filter((m) => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Header & Candidate Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Candidate Matching Feed
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time hybrid rankings evaluated against Turso DB vector embeddings & recursive CTE ontology.
          </p>
        </div>

        {/* Custom Dark Themed Candidate Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/90 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-200 transition hover:border-emerald-500/40 hover:bg-surface focus:outline-none focus:ring-1 focus:ring-emerald-500/50 shadow-md shadow-black/20"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white leading-tight">
                  {currentCandidate.name}
                </span>
                <span className="text-[11px] text-gray-400 font-normal leading-tight">
                  {currentCandidate.role}
                </span>
              </div>
              <ChevronDown
                className={`ml-1.5 h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-[#111827]/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-border/50">
                  Select Candidate Profile
                </div>
                <div className="mt-1 space-y-1">
                  {CANDIDATES.map((c) => {
                    const isSelected = c.id === selectedCandidate;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(c.id);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold shadow-sm'
                            : 'text-gray-300 hover:bg-background/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={isSelected ? 'text-emerald-300 font-semibold' : 'text-gray-200 font-medium'}>
                            {c.name}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-0.5">
                            {c.role}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-gray-300 hover:text-emerald-400 hover:border-emerald-500/30 transition shadow-md shadow-black/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'saved', 'applied', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              filterStatus === status
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-surface/60 text-gray-400 hover:text-gray-200 border border-border'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 rounded-2xl border border-border bg-surface/40 animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border bg-surface/40 text-center">
          <Sparkles className="h-8 w-8 text-gray-500 mb-2" />
          <p className="text-base font-medium text-gray-300">No matches found for this status.</p>
          <p className="text-xs text-gray-500 mt-1">Try selecting a different filter or candidate.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

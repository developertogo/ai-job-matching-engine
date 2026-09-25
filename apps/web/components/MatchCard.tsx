'use client';

import React from 'react';
import { ScoreBadge } from './ScoreBadge';
import { MatchItem, useUpdateMatchStatus } from '../lib/hooks/useIngestion';
import { Building2, MapPin, DollarSign, Bookmark, CheckCircle2, XCircle, Brain, GitFork } from 'lucide-react';

interface MatchCardProps {
  match: MatchItem;
}

export function MatchCard({ match }: MatchCardProps) {
  const updateStatus = useUpdateMatchStatus();

  const handleStatusChange = (newStatus: 'saved' | 'applied' | 'dismissed') => {
    updateStatus.mutate({ matchId: match.id, status: newStatus });
  };

  const skills: string[] = Array.isArray(match.jobSkillsRequired)
    ? match.jobSkillsRequired
    : [];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5">
      <div>
        {/* Top Header: Title, Company, Score */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-white">{match.jobTitle}</h3>
              <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-brand-500/20 capitalize">
                {match.jobRemoteType}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                {match.jobCompany}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                {match.jobLocation}
              </span>
            </div>
          </div>
          <ScoreBadge score={match.score} size="md" />
        </div>

        {/* Salary & Equity */}
        {(match.jobSalaryMin || match.jobSalaryMax) && (
          <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gray-200">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>
              ${match.jobSalaryMin?.toLocaleString()} – ${match.jobSalaryMax?.toLocaleString()} base
            </span>
          </div>
        )}

        {/* AI Match Rationale Breakdown */}
        <div className="mt-4 rounded-xl border border-border/80 bg-background/60 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4" />
              <span>AI Match Rationale</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-normal text-gray-400">
              <span title="Dense nomic-embed-text cosine similarity">
                Vectors: <strong className="text-gray-200">{Math.round(match.denseSimilarity * 100)}%</strong>
              </span>
              <span title="Knowledge graph ontology traversal score">
                Graph: <strong className="text-gray-200">{Math.round(match.graphSkillScore * 100)}%</strong>
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-300">
            {match.aiRationale || 'Optimal hybrid alignment across core technologies and technical experience.'}
          </p>
        </div>

        {/* Required & Overlapping Skills */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Required Technical Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-gray-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="text-xs text-gray-400">
          Status:{' '}
          <span className="font-medium text-emerald-400 capitalize">
            {match.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange('dismissed')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Dismiss</span>
          </button>
          <button
            onClick={() => handleStatusChange('saved')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => handleStatusChange('applied')}
            disabled={updateStatus.isPending}
            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 shadow-sm shadow-emerald-500/30"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Quick Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

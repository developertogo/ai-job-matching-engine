'use client';

import React from 'react';
import { IngestionLogItem } from '../lib/hooks/useIngestion';
import { CheckCircle, Clock, AlertTriangle, Cpu } from 'lucide-react';

interface IngestionLogProps {
  logs: IngestionLogItem[];
  isLoading?: boolean;
}

export function IngestionLogTable({ logs, isLoading }: IngestionLogProps) {
  if (isLoading && logs.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface/50">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Polling ingestion telemetry...</span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface/50 text-sm text-gray-400">
        No ingestion batches recorded yet. Click "Trigger Daily Crawl" to start.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface/60">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="border-b border-border bg-background/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-4 py-3">Batch ID</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Jobs Parsed</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">OTel Trace ID</th>
            <th className="px-4 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 font-mono text-xs">
          {logs.map((log) => {
            let statusBadge = (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            );
            if (log.status === 'in_progress') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-400 border border-amber-500/20 animate-pulse">
                  <Clock className="h-3 w-3" />
                  In Progress
                </span>
              );
            } else if (log.status === 'failed') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-red-400 border border-red-500/20">
                  <AlertTriangle className="h-3 w-3" />
                  Failed
                </span>
              );
            }

            return (
              <tr key={log.id} className="hover:bg-background/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{log.batchId}</td>
                <td className="px-4 py-3">{statusBadge}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">{log.jobsParsed} jobs</td>
                <td className="px-4 py-3 text-gray-400">{log.durationMs ? `${log.durationMs}ms` : '—'}</td>
                <td className="px-4 py-3">
                  {log.traceId ? (
                    <span
                      title={log.traceId}
                      className="rounded bg-background px-1.5 py-0.5 text-gray-300 border border-border"
                    >
                      {log.traceId.slice(0, 16)}...
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

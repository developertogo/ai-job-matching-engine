'use client';

import React from 'react';
import { useIngestionLogs, useTriggerIngest } from '../../lib/hooks/useIngestion';
import { IngestionLogTable } from '../../components/IngestionLog';
import { Play, Database, Cpu, CheckCircle, Clock, Zap, ShieldCheck } from 'lucide-react';

export default function IngestionDashboardPage() {
  const { data: logs = [], isLoading, refetch } = useIngestionLogs();
  const triggerIngest = useTriggerIngest();

  const handleTrigger = () => {
    triggerIngest.mutate();
  };

  const totalJobsParsed = logs.reduce((acc, log) => acc + (log.jobsParsed || 0), 0);
  const latestLog = logs[0];
  const isRunning = triggerIngest.isPending || latestLog?.status === 'in_progress';

  return (
    <div className="space-y-8">
      {/* Top Banner & Trigger Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Daily AI Ingestion Pipeline
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Automated batch ingestion streaming raw job descriptions through Ollama (llama3.2:3b), nomic-embed-text, and Turso DB.
          </p>
        </div>

        <button
          onClick={handleTrigger}
          disabled={isRunning}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-lg ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed'
              : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Clock className="h-4 w-4 animate-spin text-amber-300" />
              <span>Pipeline Running...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Trigger Batch Ingest</span>
            </>
          )}
        </button>
      </div>

      {/* Execution Alert / Banner if trigger is running */}
      {triggerIngest.isSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Batch execution completed: {triggerIngest.data?.message || 'Ingestion finished'}</span>
        </div>
      )}

      {triggerIngest.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Pipeline execution error: {triggerIngest.error?.message}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Jobs Ingested</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{totalJobsParsed}</div>
          <div className="mt-1 text-xs text-gray-500">Across {logs.length} logged batches</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Local AI Engine</span>
            <Cpu className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white">llama3.2:3b</div>
          <div className="mt-1 text-xs text-gray-500">Apple Silicon M3 Metal GPU</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Embeddings Model</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white">nomic-embed-text</div>
          <div className="mt-1 text-xs text-gray-500">768-dim float32 BLOB</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest Duration</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {latestLog?.durationMs ? `${latestLog.durationMs}ms` : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Batch {latestLog?.batchId || 'N/A'}</div>
        </div>
      </div>

      {/* Batch History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">Recent Ingestion Batches</h2>
          <span className="text-xs text-gray-400">Auto-polls every 2s during execution</span>
        </div>

        <IngestionLogTable logs={logs} isLoading={isLoading} />
      </div>
    </div>
  );
}

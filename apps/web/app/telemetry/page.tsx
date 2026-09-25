'use client';

import React from 'react';
import { useTelemetry } from '../../lib/hooks/useIngestion';
import { Activity, ShieldCheck, Zap, Clock, Server, CheckCircle2 } from 'lucide-react';

export default function TelemetryDashboardPage() {
  const { data: telemetry, isLoading, refetch } = useTelemetry();

  const traces: any[] = telemetry?.recentTraces || [];
  const stats = telemetry?.stats || { totalRecordedRequests: 0, avgLatencyMs: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            OpenTelemetry Live Tracing
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Distributed Observability & Tracing
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Auto-instrumented NodeSDK spans tracking HTTP requests, Drizzle ORM queries, and AI pipeline extraction latency.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Service Name</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {telemetry?.serviceName || 'job-matching-backend'}
          </div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active OTel NodeSDK</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Latency</span>
            <Clock className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {stats.avgLatencyMs} <span className="text-sm font-normal text-gray-400">ms</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">End-to-end request turnaround</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 p-5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Instrumented Requests</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {stats.totalRecordedRequests}
          </div>
          <div className="mt-1 text-xs text-gray-500">Live recorded trace ring buffer</div>
        </div>
      </div>

      {/* Traces Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Active Trace Spans (X-Trace-Id)
          </h2>
          <span className="text-xs text-gray-400">Updated in real-time</span>
        </div>

        {traces.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface/50 text-sm text-gray-400">
            No traces captured yet. Make API requests or run ingestion to generate trace spans.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-border bg-background/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3">Trace ID</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Route / Endpoint</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Span ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {traces.map((trace, idx) => (
                  <tr key={idx} className="hover:bg-background/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      <span className="rounded bg-background px-2 py-0.5 border border-border text-gray-200">
                        {trace.traceId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface px-1.5 py-0.5 font-bold text-gray-300 border border-border">
                        {trace.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{trace.url}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          trace.statusCode < 300
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {trace.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cyan-300 font-bold">{trace.durationMs}ms</td>
                    <td className="px-4 py-3 text-gray-400">{trace.spanId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

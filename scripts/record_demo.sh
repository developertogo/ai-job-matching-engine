#!/usr/bin/env bash
set -e

echo "🎬 ========================================================"
echo "   ai-job-matching-engine — UI Demo Recording Helper"
echo "========================================================"

# Check if ports 4000 and 3000 are already running
if ! lsof -i :4000 > /dev/null 2>&1; then
  echo "🚀 Starting Fastify Backend on port 4000..."
  (cd "$(dirname "$0")/../apps/api" && pnpm dev) &
  API_PID=$!
  trap "kill $API_PID 2>/dev/null || true" EXIT
else
  echo "✅ Fastify Backend is already running on port 4000."
fi

if ! lsof -i :3000 > /dev/null 2>&1; then
  echo "🚀 Starting Next.js Frontend on port 3000..."
  (cd "$(dirname "$0")/../apps/web" && pnpm dev) &
  WEB_PID=$!
  trap "kill $API_PID $WEB_PID 2>/dev/null || true" EXIT
else
  echo "✅ Next.js Frontend is already running on port 3000."
fi

echo "⏳ Waiting 3 seconds for services to initialize..."
sleep 3

# Open web app in default browser
open "http://localhost:3000"

echo ""
echo "🎥 Recording Instructions (macOS):"
echo "   1. Press [Cmd + Shift + 5] to open the macOS screen recorder."
echo "   2. Select 'Record Selected Portion' or 'Record Entire Screen'."
echo "   3. Click 'Record'."
echo ""
echo "📋 Recommended Demo Flow (60 - 90 seconds):"
echo "   • Step 1: Prompt Landing Page (http://localhost:3000)"
echo "             Type: 'Founding Full Stack Engineer with TypeScript, Next.js, and Fastify seeking remote role'"
echo "             Notice: Live skill detection pills automatically appear as you type."
echo "   • Step 2: Candidate Matches Feed (http://localhost:3000/matches)"
echo "             Switch profiles (Alex Chen -> Maya Lin -> David Kim)."
echo "             Highlight: AI Match Rationale, 50% Vector + 50% Graph breakdown, Quick Apply."
echo "   • Step 3: Ingestion Pipeline Dashboard (http://localhost:3000/ingestion)"
echo "             Click: 'Trigger Batch Ingest'."
echo "             Notice: Auto-polls every 2s, updates parsed count and OTel Trace ID."
echo "   • Step 4: Telemetry Viewer (http://localhost:3000/telemetry)"
echo "             Inspect: Live X-Trace-Id spans, latency, and click Swagger API link."
echo ""
echo "🛑 Press Ctrl+C when finished to stop background servers."
wait

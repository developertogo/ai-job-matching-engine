'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { rolePromptAtom, userEmailAtom, detectedSkillsAtom } from '../lib/atoms/promptAtoms';
import { useMatches } from '../lib/hooks/useIngestion';
import { MatchCard } from '../components/MatchCard';
import { Sparkles, Send, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PromptLandingPage() {
  const [prompt, setPrompt] = useAtom(rolePromptAtom);
  const [email, setEmail] = useAtom(userEmailAtom);
  const [detectedSkills] = useAtom(detectedSkillsAtom);
  const [subscribed, setSubscribed] = useState(false);

  const { data: sampleMatches = [], isLoading } = useMatches('cand-alex-chen');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  const handleSamplePrompt = (sampleText: string) => {
    setPrompt(sampleText);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Local Ollama + Turso Vector + SQLite Recursive CTE Graph</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Find your next role with <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Hybrid AI Matching
          </span>
        </h1>
        <p className="text-base text-gray-400 max-w-2xl mx-auto">
          Type your desired role or technical preferences in plain English. Our engine uses real-time
          atomic skill extraction, 768-dim semantic vectors, and graph ontology traversal to match you
          with founding opportunities.
        </p>
      </div>

      {/* Interactive Prompt & Live Skill Detection Card */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Natural Language Career Query
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. I am a Founding Full Stack Engineer looking for a remote role with TypeScript, Next.js, and Fastify backend. I have 5 years experience and need $180k+ salary..."
          className="w-full rounded-xl border border-border bg-background/80 p-4 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
        />

        {/* Real-time Detected Skill Pills (Jotai Derived Atom) */}
        <div className="mt-3 min-h-[32px]">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Skill & Attribute Detection:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedSkills.length > 0 ? (
              detectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300 animate-fadeIn"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">
                Type technologies like "TypeScript", "Fastify", "Python", "Remote", or "Founding" to see live detection...
              </span>
            )}
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>Try quick template:</span>
          <button
            onClick={() =>
              handleSamplePrompt(
                'Founding Full Stack Engineer with TypeScript, Next.js, React, and Fastify. Seeking remote role with $170k+ salary.'
              )
            }
            className="rounded-lg bg-background px-2.5 py-1 text-gray-300 hover:text-emerald-400 border border-border transition"
          >
            Full Stack Lead
          </button>
          <button
            onClick={() =>
              handleSamplePrompt(
                'Founding AI Engineer specializing in Python, PyTorch, Ollama, vector search, and Pydantic data pipelines.'
              )
            }
            className="rounded-lg bg-background px-2.5 py-1 text-gray-300 hover:text-emerald-400 border border-border transition"
          >
            AI / ML Engineer
          </button>
          <button
            onClick={() =>
              handleSamplePrompt(
                'Founding Backend Software Engineer with Fastify, SQLite, Turso, Docker, and OpenTelemetry tracing.'
              )
            }
            className="rounded-lg bg-background px-2.5 py-1 text-gray-300 hover:text-emerald-400 border border-border transition"
          >
            Backend & Systems
          </button>
        </div>

        {/* Subscribe / Notification Input */}
        <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for daily curated match alerts"
            className="flex-1 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            {subscribed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Subscribed!</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Get Daily Matches</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sample Live Matches Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Instant Matches for Your Profile
            </h2>
            <p className="text-sm text-gray-400">
              Scored using 50% dense nomic-embed-text vector similarity + 50% knowledge graph skill credit.
            </p>
          </div>
          <Link
            href="/matches"
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            <span>View Full Feed</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl border border-border bg-surface/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {sampleMatches.slice(0, 2).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

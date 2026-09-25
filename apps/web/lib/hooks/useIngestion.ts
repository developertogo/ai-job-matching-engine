import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface IngestionLogItem {
  id: string;
  batchId: string;
  status: 'in_progress' | 'completed' | 'failed' | 'completed_with_errors';
  jobsParsed: number;
  durationMs: number | null;
  traceId: string | null;
  createdAt: number;
}

export interface MatchItem {
  id: string;
  jobId: string;
  candidateId: string;
  score: number;
  denseSimilarity: number;
  graphSkillScore: number;
  aiRationale: string;
  status: 'pending' | 'saved' | 'applied' | 'dismissed';
  createdAt: number;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  jobRemoteType: string;
  jobSalaryMin: number;
  jobSalaryMax: number;
  jobSkillsRequired: string[];
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  roleLevel: string;
  location: string;
  remoteType: string;
  rawDescription: string;
  skillsRequired: string[];
  salaryMin: number;
  salaryMax: number;
  experienceMin: number;
}

export function useIngestionLogs() {
  return useQuery<IngestionLogItem[]>({
    queryKey: ['ingestion-logs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/ingest/status`);
      if (!res.ok) throw new Error('Failed to fetch ingestion logs');
      const json = await res.json();
      return json.data || [];
    },
    // Auto-poll every 2 seconds if any batch is in_progress
    refetchInterval: (query) => {
      const logs = query.state.data;
      const hasActive = logs?.some((l) => l.status === 'in_progress');
      return hasActive ? 2000 : 5000;
    },
  });
}

export function useTriggerIngest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/ingest/trigger`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to trigger ingestion pipeline');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-logs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useMatches(candidateId: string = 'cand-alex-chen') {
  return useQuery<MatchItem[]>({
    queryKey: ['matches', candidateId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/candidates/${candidateId}/matches`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      const json = await res.json();
      return json.data || [];
    },
  });
}

export function useJobs(filters?: { role?: string; remoteType?: string }) {
  return useQuery<JobItem[]>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.set('role', filters.role);
      if (filters?.remoteType) params.set('remoteType', filters.remoteType);

      const res = await fetch(`${API_BASE}/api/v1/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const json = await res.json();
      return json.data || [];
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      const res = await fetch(`${API_BASE}/api/v1/matches/${matchId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useTelemetry() {
  return useQuery({
    queryKey: ['telemetry-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/telemetry/stats`);
      if (!res.ok) throw new Error('Failed to fetch telemetry stats');
      return res.json();
    },
    refetchInterval: 3000,
  });
}

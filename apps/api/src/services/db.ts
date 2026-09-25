import { db, schema, libsqlClient } from '@job-engine/db';
import { eq, desc } from 'drizzle-orm';

export { db, schema, libsqlClient };

export async function getAllJobs(filters?: {
  role?: string;
  remoteType?: string;
  minSalary?: number;
}) {
  const allJobs = await db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt));
  
  if (!filters) return allJobs;

  return allJobs.filter((j) => {
    if (filters.remoteType && j.remoteType !== filters.remoteType) return false;
    if (filters.minSalary && (j.salaryMax || 0) < filters.minSalary) return false;
    if (filters.role && !j.title.toLowerCase().includes(filters.role.toLowerCase())) return false;
    return true;
  });
}

export async function getJobById(id: string) {
  const result = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id)).limit(1);
  return result[0] || null;
}

export async function getCandidateMatches(candidateId: string) {
  const result = await libsqlClient.execute({
    sql: `
      SELECT 
        m.id,
        m.job_id as jobId,
        m.candidate_id as candidateId,
        m.score,
        m.dense_similarity as denseSimilarity,
        m.graph_skill_score as graphSkillScore,
        m.ai_rationale as aiRationale,
        m.status,
        m.created_at as createdAt,
        j.title as jobTitle,
        j.company as jobCompany,
        j.location as jobLocation,
        j.remote_type as jobRemoteType,
        j.salary_min as jobSalaryMin,
        j.salary_max as jobSalaryMax,
        j.skills_required as jobSkillsRequired
      FROM matches m
      JOIN jobs j ON m.job_id = j.id
      WHERE m.candidate_id = ?
      ORDER BY m.score DESC
    `,
    args: [candidateId],
  });

  return result.rows.map((row) => ({
    ...row,
    jobSkillsRequired: typeof row.jobSkillsRequired === 'string' ? JSON.parse(row.jobSkillsRequired) : row.jobSkillsRequired,
  }));
}

export async function updateMatchStatus(matchId: string, status: string) {
  await db
    .update(schema.matches)
    .set({ status })
    .where(eq(schema.matches.id, matchId));
  return { id: matchId, status };
}

export async function getRecentIngestionLogs() {
  return db
    .select()
    .from(schema.ingestionLogs)
    .orderBy(desc(schema.ingestionLogs.createdAt))
    .limit(20);
}

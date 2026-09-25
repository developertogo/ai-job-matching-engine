import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  roleLevel: text('role_level'),
  location: text('location'),
  remoteType: text('remote_type'), // 'remote' | 'hybrid' | 'onsite'
  rawDescription: text('raw_description').notNull(),
  skillsRequired: text('skills_required', { mode: 'json' }).$type<string[]>(),
  experienceMin: integer('experience_min'),
  experienceMax: integer('experience_max'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: text('currency').default('USD'),
  embedding: blob('embedding'), // float32 vector for cosine similarity
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),
  bio: text('bio'),
  skills: text('skills', { mode: 'json' }).$type<string[]>(),
  yearsOfExperience: integer('years_of_experience'),
  desiredSalaryMin: integer('desired_salary_min'),
  remotePreference: text('remote_preference'), // 'remote' | 'hybrid' | 'onsite'
  embedding: blob('embedding'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
});

export const skillEdges = sqliteTable('skill_edges', {
  sourceSkillId: text('source_skill_id').notNull().references(() => skills.id),
  targetSkillId: text('target_skill_id').notNull().references(() => skills.id),
  relationship: text('relationship').notNull(), // 'sub_skill_of' | 'alternative_to' | 'co_occurs_with'
  weight: real('weight').notNull().default(1.0),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  score: real('score').notNull(),
  denseSimilarity: real('dense_similarity').notNull(),
  graphSkillScore: real('graph_skill_score').notNull(),
  aiRationale: text('ai_rationale'),
  status: text('status').default('pending'), // 'pending' | 'saved' | 'applied' | 'dismissed'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const ingestionLogs = sqliteTable('ingestion_logs', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').notNull(),
  status: text('status').notNull(), // 'in_progress' | 'completed' | 'failed'
  jobsParsed: integer('jobs_parsed').default(0),
  durationMs: integer('duration_ms'),
  traceId: text('trace_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type SkillEdge = typeof skillEdges.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type IngestionLog = typeof ingestionLogs.$inferSelect;

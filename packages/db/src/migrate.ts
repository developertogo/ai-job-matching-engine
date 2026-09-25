import { libsqlClient } from './client';

export async function migrate() {
  console.log('🔄 Applying database migrations...');

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      role_level TEXT,
      location TEXT,
      remote_type TEXT,
      raw_description TEXT NOT NULL,
      skills_required TEXT,
      experience_min INTEGER,
      experience_max INTEGER,
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT DEFAULT 'USD',
      embedding BLOB,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      headline TEXT NOT NULL,
      bio TEXT,
      skills TEXT,
      years_of_experience INTEGER,
      desired_salary_min INTEGER,
      remote_preference TEXT,
      embedding BLOB,
      created_at INTEGER NOT NULL
    );
  `);

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS skill_edges (
      source_skill_id TEXT NOT NULL REFERENCES skills(id),
      target_skill_id TEXT NOT NULL REFERENCES skills(id),
      relationship TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 1.0,
      PRIMARY KEY (source_skill_id, target_skill_id)
    );
  `);

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      candidate_id TEXT NOT NULL REFERENCES candidates(id),
      score REAL NOT NULL,
      dense_similarity REAL NOT NULL,
      graph_skill_score REAL NOT NULL,
      ai_rationale TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
  `);

  await libsqlClient.execute(`
    CREATE TABLE IF NOT EXISTS ingestion_logs (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      status TEXT NOT NULL,
      jobs_parsed INTEGER DEFAULT 0,
      duration_ms INTEGER,
      trace_id TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  console.log('✅ Migrations applied successfully.');
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}

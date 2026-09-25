import { libsqlClient } from './client';
import { migrate } from './migrate';

// Helper to generate a normalized 768-dim float32 vector buffer
function generateDeterministicEmbedding(seedStr: string): Buffer {
  const dim = 768;
  const floatArray = new Float32Array(dim);
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) {
    const val = Math.sin(hash + i * 13.37);
    floatArray[i] = val;
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) {
    floatArray[i] /= norm;
  }

  return Buffer.from(floatArray.buffer);
}

export async function seed() {
  await migrate();
  console.log('🌱 Seeding database...');

  const now = new Date();

  // 1. Seed Skills (Knowledge Graph Vertices)
  const skillList = [
    { id: 'typescript', name: 'TypeScript', category: 'language' },
    { id: 'javascript', name: 'JavaScript', category: 'language' },
    { id: 'python', name: 'Python', category: 'language' },
    { id: 'node', name: 'Node.js', category: 'backend' },
    { id: 'fastify', name: 'Fastify', category: 'backend' },
    { id: 'express', name: 'Express', category: 'backend' },
    { id: 'react', name: 'React', category: 'frontend' },
    { id: 'nextjs', name: 'Next.js', category: 'frontend' },
    { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend' },
    { id: 'sqlite', name: 'SQLite', category: 'database' },
    { id: 'libsql', name: 'libSQL', category: 'database' },
    { id: 'turso', name: 'Turso', category: 'database' },
    { id: 'pytorch', name: 'PyTorch', category: 'ai_ml' },
    { id: 'mlx', name: 'MLX', category: 'ai_ml' },
    { id: 'ollama', name: 'Ollama', category: 'ai_ml' },
    { id: 'embeddings', name: 'Embeddings', category: 'ai_ml' },
    { id: 'pydantic', name: 'Pydantic', category: 'ai_ml' },
    { id: 'opentelemetry', name: 'OpenTelemetry', category: 'infrastructure' },
    { id: 'docker', name: 'Docker', category: 'infrastructure' },
  ];

  for (const s of skillList) {
    await libsqlClient.execute({
      sql: `INSERT OR REPLACE INTO skills (id, name, category) VALUES (?, ?, ?)`,
      args: [s.id, s.name, s.category],
    });
  }

  // 2. Seed Skill Edges (Weighted Directed Graph Links)
  const edgeList = [
    { source: 'fastify', target: 'node', rel: 'sub_skill_of', weight: 0.9 },
    { source: 'express', target: 'fastify', rel: 'alternative_to', weight: 0.8 },
    { source: 'fastify', target: 'express', rel: 'alternative_to', weight: 0.8 },
    { source: 'express', target: 'node', rel: 'sub_skill_of', weight: 0.9 },
    { source: 'nextjs', target: 'react', rel: 'sub_skill_of', weight: 0.95 },
    { source: 'typescript', target: 'javascript', rel: 'alternative_to', weight: 0.85 },
    { source: 'pytorch', target: 'python', rel: 'sub_skill_of', weight: 0.9 },
    { source: 'mlx', target: 'pytorch', rel: 'alternative_to', weight: 0.75 },
    { source: 'libsql', target: 'sqlite', rel: 'sub_skill_of', weight: 0.95 },
    { source: 'turso', target: 'libsql', rel: 'sub_skill_of', weight: 0.95 },
    { source: 'pydantic', target: 'python', rel: 'sub_skill_of', weight: 0.9 },
    { source: 'ollama', target: 'embeddings', rel: 'co_occurs_with', weight: 0.8 },
    { source: 'node', target: 'typescript', rel: 'co_occurs_with', weight: 0.85 },
    { source: 'fastify', target: 'opentelemetry', rel: 'co_occurs_with', weight: 0.7 },
  ];

  for (const e of edgeList) {
    await libsqlClient.execute({
      sql: `INSERT OR REPLACE INTO skill_edges (source_skill_id, target_skill_id, relationship, weight) VALUES (?, ?, ?, ?)`,
      args: [e.source, e.target, e.rel, e.weight],
    });
  }

  // 3. Seed The 3 Founding JDs
  const jobList = [
    {
      id: 'job-founding-full-stack',
      title: 'Founding Full Stack Engineer',
      company: 'Matcha AI',
      roleLevel: 'Founding',
      location: 'San Francisco, CA / Remote',
      remoteType: 'remote',
      rawDescription: `Matcha AI is looking for a Founding Full Stack Engineer to lead front-of-house engineering and end-to-end product delivery.
You will architect our Next.js frontend, build high-performance Fastify backend microservices, integrate Turso/libSQL vector search, and instrument OpenTelemetry traces.
Requirements:
- 4+ years building production TypeScript web applications.
- Strong proficiency with Next.js, React, Tailwind CSS, Fastify, and Node.js.
- Experience with embedded databases (SQLite, libSQL, Turso) and Drizzle ORM.
- Familiarity with vector embeddings, LLM inference APIs, and distributed tracing.
Compensation: $160,000 - $220,000 base salary + 1.0% - 2.5% equity.`,
      skillsRequired: JSON.stringify(['TypeScript', 'Next.js', 'React', 'Node.js', 'Fastify', 'Tailwind CSS', 'Turso', 'SQLite', 'OpenTelemetry']),
      experienceMin: 4,
      experienceMax: 8,
      salaryMin: 160000,
      salaryMax: 220000,
      currency: 'USD',
      embedding: generateDeterministicEmbedding('Founding Full Stack Engineer TypeScript Next.js Fastify Turso'),
    },
    {
      id: 'job-founding-ai-engineer',
      title: 'Founding AI Engineer (ML/Data)',
      company: 'Matcha AI',
      roleLevel: 'Founding',
      location: 'Remote (US / Global)',
      remoteType: 'remote',
      rawDescription: `We are hiring our Founding AI Engineer to design and scale the machine learning and data pipelines powering our job matching engine.
You will build local LLM extraction pipelines with Ollama and Instructor, generate 768-dim vector embeddings with nomic-embed-text, implement recursive CTE graph matchers, and establish evaluation benchmarks.
Requirements:
- Strong Python and SQL fundamentals with production pipeline experience.
- Deep expertise with PyTorch, Pydantic v2, Instructor, and local LLM runtime acceleration (Metal/Apple Silicon).
- Experience with vector search, semantic embeddings, and knowledge graphs.
- Track record of building automated evaluation suites for LLM extraction accuracy.
Compensation: $175,000 - $240,000 base salary + 1.2% - 3.0% equity.`,
      skillsRequired: JSON.stringify(['Python', 'PyTorch', 'Ollama', 'Embeddings', 'Vector Search', 'SQL', 'Data Pipelines', 'Pydantic', 'MLX']),
      experienceMin: 4,
      experienceMax: 9,
      salaryMin: 175000,
      salaryMax: 240000,
      currency: 'USD',
      embedding: generateDeterministicEmbedding('Founding AI Engineer ML Data Python PyTorch Ollama Embeddings Vector Search'),
    },
    {
      id: 'job-founding-backend-engineer',
      title: 'Founding Backend Software Engineer',
      company: 'Matcha AI',
      roleLevel: 'Founding',
      location: 'San Francisco, CA / Hybrid',
      remoteType: 'hybrid',
      rawDescription: `Join Matcha AI as our Founding Backend Software Engineer to own the core API architecture, ingestion pipeline coordination, and distributed tracing.
You will design low-latency Fastify REST endpoints, maintain Drizzle ORM schemas and Turso DB migrations, optimize SQLite recursive CTEs for skill ontology lookups, and ensure 100% observability with OpenTelemetry.
Requirements:
- 5+ years building backend systems in TypeScript/Node.js or Go/Python.
- Production experience with Fastify or Express, schema validation, and SQL optimization.
- Strong knowledge of SQLite/libSQL, database indexing, and graph traversal queries.
- Hands-on experience with OpenTelemetry auto-instrumentation and OTLP exporters.
Compensation: $165,000 - $230,000 base salary + 1.0% - 2.5% equity.`,
      skillsRequired: JSON.stringify(['Node.js', 'Fastify', 'TypeScript', 'SQLite', 'Turso', 'Drizzle ORM', 'REST API', 'OpenTelemetry', 'Docker']),
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 165000,
      salaryMax: 230000,
      currency: 'USD',
      embedding: generateDeterministicEmbedding('Founding Backend Software Engineer Fastify TypeScript Turso SQLite OpenTelemetry'),
    },
  ];

  for (const j of jobList) {
    await libsqlClient.execute({
      sql: `INSERT OR REPLACE INTO jobs (
        id, title, company, role_level, location, remote_type, raw_description,
        skills_required, experience_min, experience_max, salary_min, salary_max,
        currency, embedding, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        j.id, j.title, j.company, j.roleLevel, j.location, j.remoteType, j.rawDescription,
        j.skillsRequired, j.experienceMin, j.experienceMax, j.salaryMin, j.salaryMax,
        j.currency, j.embedding, now.getTime(), now.getTime(),
      ],
    });
  }

  // 4. Seed Candidates
  const candidateList = [
    {
      id: 'cand-alex-chen',
      name: 'Alex Chen',
      headline: 'Staff Full Stack & AI Systems Engineer',
      bio: 'Passionate about building fast, responsive user interfaces and robust distributed systems. 6+ years shipping Next.js, Fastify, and AI integrations.',
      skills: JSON.stringify(['TypeScript', 'Next.js', 'React', 'Node.js', 'Fastify', 'Python', 'SQLite', 'Turso', 'OpenTelemetry']),
      yearsOfExperience: 6,
      desiredSalaryMin: 170000,
      remotePreference: 'remote',
      embedding: generateDeterministicEmbedding('Staff Full Stack AI Engineer TypeScript Next.js Fastify Turso'),
    },
    {
      id: 'cand-maya-lin',
      name: 'Maya Lin',
      headline: 'Founding ML & AI Pipeline Engineer',
      bio: 'Ex-AI researcher specializing in structured LLM extraction, vector search, Apple Silicon Metal optimization, and automated evaluation pipelines.',
      skills: JSON.stringify(['Python', 'PyTorch', 'Ollama', 'Embeddings', 'Vector Search', 'SQL', 'Pydantic', 'MLX']),
      yearsOfExperience: 5,
      desiredSalaryMin: 180000,
      remotePreference: 'remote',
      embedding: generateDeterministicEmbedding('Founding ML AI Engineer Python PyTorch Ollama Embeddings Vector Search'),
    },
    {
      id: 'cand-david-kim',
      name: 'David Kim',
      headline: 'Principal Backend & Distributed Systems Engineer',
      bio: 'Specialist in high-throughput API gateways, SQLite embedded engines, and end-to-end OpenTelemetry distributed tracing.',
      skills: JSON.stringify(['Node.js', 'Fastify', 'Express', 'TypeScript', 'SQLite', 'Turso', 'OpenTelemetry', 'Docker']),
      yearsOfExperience: 7,
      desiredSalaryMin: 175000,
      remotePreference: 'hybrid',
      embedding: generateDeterministicEmbedding('Principal Backend Engineer Fastify TypeScript Turso SQLite OpenTelemetry'),
    },
  ];

  for (const c of candidateList) {
    await libsqlClient.execute({
      sql: `INSERT OR REPLACE INTO candidates (
        id, name, headline, bio, skills, years_of_experience, desired_salary_min,
        remote_preference, embedding, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c.id, c.name, c.headline, c.bio, c.skills, c.yearsOfExperience, c.desiredSalaryMin,
        c.remotePreference, c.embedding, now.getTime(),
      ],
    });
  }

  // 5. Seed Matches for Demonstration
  const sampleMatches = [
    {
      id: 'match-1',
      jobId: 'job-founding-full-stack',
      candidateId: 'cand-alex-chen',
      score: 94.5,
      denseSimilarity: 0.93,
      graphSkillScore: 0.96,
      aiRationale: 'Exceptional alignment across Next.js, Fastify, TypeScript, and Turso DB. Candidate has 6 years experience matching Founding requirement.',
      status: 'saved',
    },
    {
      id: 'match-2',
      jobId: 'job-founding-ai-engineer',
      candidateId: 'cand-maya-lin',
      score: 96.0,
      denseSimilarity: 0.95,
      graphSkillScore: 0.97,
      aiRationale: 'Direct match for Python, Ollama, PyTorch, and vector search. Strong experience with structured Pydantic extraction on Apple Silicon.',
      status: 'applied',
    },
    {
      id: 'match-3',
      jobId: 'job-founding-backend-engineer',
      candidateId: 'cand-david-kim',
      score: 91.8,
      denseSimilarity: 0.89,
      graphSkillScore: 0.94,
      aiRationale: 'Deep expertise in Fastify, Turso/libSQL, and OpenTelemetry auto-instrumentation. Hybrid location preference matches job requirements.',
      status: 'pending',
    },
  ];

  for (const m of sampleMatches) {
    await libsqlClient.execute({
      sql: `INSERT OR REPLACE INTO matches (
        id, job_id, candidate_id, score, dense_similarity, graph_skill_score,
        ai_rationale, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [m.id, m.jobId, m.candidateId, m.score, m.denseSimilarity, m.graphSkillScore, m.aiRationale, m.status, now.getTime()],
    });
  }

  // 6. Seed Ingestion Log
  await libsqlClient.execute({
    sql: `INSERT OR REPLACE INTO ingestion_logs (
      id, batch_id, status, jobs_parsed, duration_ms, trace_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['log-init-batch', 'batch-20260925-01', 'completed', 3, 1240, '4bf92f3577b34da6a3ce929d0e0e4736', now.getTime()],
  });

  console.log('✅ Database seeded successfully with 3 Founding JDs, skills ontology, and sample candidates.');
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

# Comprehensive Testing Guide & Test Matrix — ai-job-matching-engine

**Document**: Multi-Layer Test Strategy, Implementation Details & Execution Guide  
**Location**: `/Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/TESTING_GUIDE.md`  
**Date**: September 25, 2026  

---

## 1. Overview & Test Philosophy

The **ai-job-matching-engine** employs a multi-tiered test strategy verifying correctness, data integrity, and performance across all 4 monorepo layers:
- **Zero-Dependency Native Runners**: Node.js built-in test runner (`node --test` via `tsx`) for TypeScript services and Pytest for Python.
- **In-Memory Fastify Route Injection**: Route handlers and OpenTelemetry headers are tested via `app.inject()` without port collisions.
- **SQLite CTE Graph Traversal Verification**: Real recursive query execution testing ontology credit decay.
- **Deterministic AI Fallback Tests**: Vector shape, cosine similarity properties, and schema parsing verified in offline/isolated environments.

---

## 2. Test Coverage Matrix (27 Tests / 100% Passed)

| Layer | Package / App | Test File | Test Runner | Tests Passed | Coverage Highlights |
|---|---|---|---|---|---|
| **1. Database** | `packages/db` | [`tests/db.test.ts`](file:///Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/packages/db/tests/db.test.ts) | Node.js Test (`tsx`) | **5 / 5** | Tables, 768-dim float32 BLOBs, skills ontology edges, match updates |
| **2. Backend API** | `apps/api` | [`tests/api.test.ts`](file:///Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/apps/api/tests/api.test.ts) | Node.js Test (`tsx`) | **9 / 9** | `/health`, `/jobs`, `/matches`, `/ingest/status`, `/telemetry/stats`, `X-Trace-Id` headers |
| **3. Frontend UI** | `apps/web` | [`tests/atoms.test.ts`](file:///Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/apps/web/tests/atoms.test.ts) | Node.js Test (`tsx`) | **5 / 5** | Jotai atomic state, real-time live keyword detection, case-insensitivity |
| **4. AI Pipeline** | `apps/ai-pipeline` | [`tests/test_parser.py`](file:///Users/chung/sandbox/matcha.fm/full-stack-engineer/ai-job-matching-engine/apps/ai-pipeline/tests/test_parser.py) | Pytest (Python 3.12) | **8 / 8** | 3 Founding JDs parsing, `nomic-embed-text` vectors, SQLite recursive CTE, batch runner |
| **Total** | **Monorepo** | **`pnpm test`** | **Unified** | **27 / 27** | **100% Pass across all layers** |

---

## 3. Test Implementations by Layer

### 3.1 Database Layer (`packages/db/tests/db.test.ts`)
- **Schema & Connectivity**: Verifies Drizzle ORM connecting to libSQL / SQLite engine and reading seeded `skills` vertices.
- **Ontology Graph Links**: Verifies `Express` $\rightarrow$ `Fastify` relationship (`alternative_to`, weight: 0.8).
- **Vector Embedding BLOB Storage**: Validates that 768-dimensional float32 embeddings occupy exactly 3,072 bytes ($768 \times 4$ bytes) in SQLite storage.
- **Match Status Transitions**: Verifies candidate match status updates (`pending` $\rightarrow$ `saved` $\rightarrow$ `applied`).
- **Ingestion Log Tracking**: Ensures batch runs record batch ID, duration, and trace metadata.

### 3.2 Fastify Backend API (`apps/api/tests/api.test.ts`)
- **`GET /health`**: Validates 200 response, uptime metrics, and service identity.
- **`GET /api/v1/jobs`**: Validates pagination, job schema properties, and presence of the `X-Trace-Id` response header.
- **`GET /api/v1/jobs/:id`**: Tests both successful lookup of the Founding Full Stack JD and 404 response on unknown IDs.
- **`GET /api/v1/candidates/:id/matches`**: Verifies candidate match score calculation, dense similarity, and AI rationale generation.
- **`POST /api/v1/matches/:id/status`**: Tests state mutations for match cards.
- **`GET /api/v1/ingest/status`**: Verifies retrieval of recent batch ingestion runs.
- **`GET /api/v1/telemetry/stats`**: Validates OTel trace span ring buffer telemetry.
- **`GET /docs`**: Tests OpenAPI / Swagger UI endpoint accessibility.

### 3.3 Frontend Client State (`apps/web/tests/atoms.test.ts`)
- **Atom Defaults**: Verifies `rolePromptAtom` and `userEmailAtom` initialize empty with `'idle'` status.
- **Real-Time Keyword Detection**: Validates that typing `"I am a Founding Full Stack Engineer with TypeScript, Next.js, and Fastify seeking remote role"` accurately flags `['TypeScript', 'Next.js', 'Fastify', 'Remote', 'Founding']`.
- **AI & ML Terminology Detection**: Verifies detection of `['Python', 'PyTorch', 'Ollama', 'Embeddings', 'Turso', 'SQLite']` with case-insensitivity.
- **False-Positive Guard**: Ensures arbitrary or unrelated text produces no phantom skill pills.

### 3.4 Python AI & Ingestion Engine (`apps/ai-pipeline/tests/test_parser.py`)
- **3 Founding JDs Structured Extraction**:
  - Founding Full Stack Engineer ($160k - $220k, 1.0% - 2.5% equity, Next.js, TypeScript, Fastify).
  - Founding AI Engineer ($175k - $240k, 1.2% - 3.0% equity, Python, PyTorch, Ollama, Vector Search).
  - Founding Backend Engineer ($165k - $230k, 1.0% - 2.5% equity, Fastify, SQLite, Turso, OTel).
- **Dense Vector Embeddings**: Validates 768-dim float representation and cosine similarity range $[0.0, 1.0]$.
- **SQLite Recursive CTE Traversal**: Verifies transferable credit calculation for adjacent ontology skills.
- **Hard Constraint Screening**: Asserts 0% score when salary cap, remote type, or years of experience are violated.
- **Batch Ingest Runner**: Verifies reading `data/raw_jobs.json`, streaming extraction, embedding storage, and OTel trace ID generation.

---

## 4. How to Run Tests

### Run All 27 Tests Across the Entire Monorepo
```bash
# In the ai-job-matching-engine directory:
pnpm test
```

### Run Layer-Specific Test Suites
```bash
# 1. Database layer tests (5 tests)
pnpm test:db

# 2. Fastify API integration tests (9 tests)
pnpm test:api

# 3. Next.js Jotai atomic state tests (5 tests)
pnpm test:web

# 4. Python AI pipeline tests (8 tests)
pnpm test:pipeline
```

import json
import os
import time
import sqlite3
import uuid
from typing import Optional
from pipeline.schemas import BatchIngestResult
from pipeline.extractor import extract_job_details
from pipeline.embeddings import generate_embedding, vector_to_blob

try:
    from opentelemetry import trace
    tracer = trace.getTracer("ai-pipeline-ingest")
except Exception:
    tracer = None

RAW_JOBS_FILE = os.path.join(os.path.dirname(__file__), "../data/raw_jobs.json")
DB_PATH = os.getenv("TURSO_DATABASE_URL", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../local.db"))).replace("file:", "")

def generate_trace_id() -> str:
    if tracer:
        current_span = trace.get_current_span()
        if current_span and current_span.get_span_context().is_valid:
            return format(current_span.get_span_context().trace_id, "032x")
    return uuid.uuid4().hex

def run_batch_ingest(raw_file: str = RAW_JOBS_FILE, db_path: str = DB_PATH) -> BatchIngestResult:
    """
    Executes batch ingestion:
    1. Reads unparsed JDs from raw_jobs.json
    2. Streams each through the AI extractor to produce structured schemas
    3. Generates 768-dim vector embeddings
    4. Upserts records into the SQLite / Turso DB
    5. Records completion status & duration in ingestion_logs with OpenTelemetry trace ID
    """
    start_time = time.time()
    batch_id = f"batch-{int(start_time)}"
    trace_id = generate_trace_id()
    errors = []
    jobs_parsed = 0

    if not os.path.exists(raw_file):
        raise FileNotFoundError(f"Raw feed not found: {raw_file}")

    with open(raw_file, "r") as f:
        raw_items = json.load(f)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Ensure tables exist
    cursor.execute("""
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
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingestion_logs (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            status TEXT NOT NULL,
            jobs_parsed INTEGER DEFAULT 0,
            duration_ms INTEGER,
            trace_id TEXT,
            created_at INTEGER NOT NULL
        )
    """)

    # Insert in-progress log
    log_id = f"log-{uuid.uuid4().hex[:8]}"
    now_ms = int(time.time() * 1000)
    cursor.execute(
        "INSERT INTO ingestion_logs (id, batch_id, status, jobs_parsed, duration_ms, trace_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (log_id, batch_id, "in_progress", 0, 0, trace_id, now_ms)
    )
    conn.commit()

    for item in raw_items:
        try:
            raw_id = item.get("id", f"job-{uuid.uuid4().hex[:8]}")
            raw_text = item.get("raw_text", "")
            if not raw_text:
                continue

            parsed = extract_job_details(raw_text)

            # Generate semantic vector
            embed_text = f"{parsed.title} at {parsed.company}. Skills: {', '.join(parsed.required_skills)}. {parsed.searchable_summary}"
            vec = generate_embedding(embed_text)
            blob = vector_to_blob(vec)

            cursor.execute("""
                INSERT OR REPLACE INTO jobs (
                    id, title, company, role_level, location, remote_type,
                    raw_description, skills_required, experience_min, experience_max,
                    salary_min, salary_max, currency, embedding, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                raw_id,
                parsed.title,
                parsed.company,
                parsed.role_level,
                parsed.location,
                parsed.remote_type,
                raw_text,
                json.dumps(parsed.required_skills),
                parsed.experience_years_min,
                parsed.experience_years_max,
                parsed.salary_min,
                parsed.salary_max,
                "USD",
                blob,
                now_ms,
                now_ms
            ))
            conn.commit()
            jobs_parsed += 1
        except Exception as e:
            errors.append(f"Error processing {item.get('id')}: {str(e)}")

    duration_ms = int((time.time() - start_time) * 1000)
    final_status = "completed" if not errors else ("completed_with_errors" if jobs_parsed > 0 else "failed")

    # Update log entry
    cursor.execute("""
        UPDATE ingestion_logs
        SET status = ?, jobs_parsed = ?, duration_ms = ?
        WHERE id = ?
    """, (final_status, jobs_parsed, duration_ms, log_id))
    conn.commit()
    conn.close()

    return BatchIngestResult(
        batch_id=batch_id,
        status="completed" if final_status != "failed" else "failed",
        jobs_parsed=jobs_parsed,
        duration_ms=duration_ms,
        trace_id=trace_id,
        errors=errors
    )

if __name__ == "__main__":
    result = run_batch_ingest()
    print(f"Ingestion finished: {result.jobs_parsed} jobs parsed in {result.duration_ms}ms (Trace: {result.trace_id})")

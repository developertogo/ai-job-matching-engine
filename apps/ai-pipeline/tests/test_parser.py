import json
import os
import pytest
from pipeline.schemas import ParsedJobDescription, CandidateProfile
from pipeline.extractor import extract_job_details
from pipeline.embeddings import generate_embedding, cosine_similarity, EMBEDDING_DIM
from pipeline.matcher import compute_hybrid_match, get_graph_skill_score_with_cte, evaluate_hard_filters
from pipeline.ingestion import run_batch_ingest

DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/raw_jobs.json")
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../local.db"))

def test_extract_founding_full_stack():
    with open(DATA_FILE) as f:
        raw_jobs = json.load(f)

    job_data = raw_jobs[0]["raw_text"]
    parsed = extract_job_details(job_data)

    assert "Full Stack" in parsed.title
    assert parsed.company == "Matcha AI"
    assert parsed.role_level == "Founding"
    assert parsed.remote_type == "remote"
    assert parsed.salary_min == 160000
    assert parsed.salary_max == 220000
    assert parsed.equity_min == 1.0
    assert parsed.equity_max == 2.5
    assert parsed.experience_years_min == 4
    assert any("Next.js" in s or "TypeScript" in s for s in parsed.required_skills)

def test_extract_founding_ai_engineer():
    with open(DATA_FILE) as f:
        raw_jobs = json.load(f)

    job_data = raw_jobs[1]["raw_text"]
    parsed = extract_job_details(job_data)

    assert "AI" in parsed.title
    assert parsed.role_level == "Founding"
    assert parsed.remote_type == "remote"
    assert parsed.salary_min == 175000
    assert parsed.salary_max == 240000
    assert parsed.equity_min == 1.2
    assert parsed.equity_max == 3.0
    assert parsed.experience_years_min == 4
    assert any("Python" in s or "PyTorch" in s for s in parsed.required_skills)

def test_extract_founding_backend_engineer():
    with open(DATA_FILE) as f:
        raw_jobs = json.load(f)

    job_data = raw_jobs[2]["raw_text"]
    parsed = extract_job_details(job_data)

    assert "Backend" in parsed.title
    assert parsed.role_level == "Founding"
    assert parsed.remote_type == "hybrid"
    assert parsed.salary_min == 165000
    assert parsed.salary_max == 230000
    assert parsed.experience_years_min == 5
    assert any("Fastify" in s or "Node.js" in s for s in parsed.required_skills)

def test_vector_embeddings_and_cosine_similarity():
    text1 = "Senior Full Stack Engineer TypeScript Next.js Fastify"
    text2 = "Frontend Developer React Next.js TypeScript"
    text3 = "Biomedical Clinical Research Nurse Hospital"

    vec1 = generate_embedding(text1)
    vec2 = generate_embedding(text2)
    vec3 = generate_embedding(text3)

    assert len(vec1) == EMBEDDING_DIM
    assert len(vec2) == EMBEDDING_DIM
    assert len(vec3) == EMBEDDING_DIM

    sim_related = cosine_similarity(vec1, vec2)
    sim_unrelated = cosine_similarity(vec1, vec3)

    assert 0.0 <= sim_related <= 1.0
    assert 0.0 <= sim_unrelated <= 1.0
    # Identity cosine similarity
    assert cosine_similarity(vec1, vec1) >= 0.999

def test_graph_skill_score_with_cte():
    candidate_skills = ["Express", "Node.js", "JavaScript"]
    job_skills = ["Fastify", "Node.js"]

    score, direct, adjacent = get_graph_skill_score_with_cte(DB_PATH, candidate_skills, job_skills)
    assert score > 0.5  # Direct match for Node.js + adjacent match for Express -> Fastify
    assert "Node.js" in direct

def test_hard_filters_screening():
    candidate = CandidateProfile(
        id="c1",
        name="Junior Dev",
        headline="Entry level",
        skills=["HTML"],
        years_of_experience=1,
        desired_salary_min=190000,
        remote_preference="remote"
    )

    job = ParsedJobDescription(
        title="Founding Backend Engineer",
        company="Matcha AI",
        role_level="Founding",
        location="SF",
        remote_type="onsite",
        salary_max=150000,
        experience_years_min=5,
        required_skills=["Fastify", "TypeScript"]
    )

    passed, reason = evaluate_hard_filters(candidate, job)
    assert not passed
    assert "onsite" in reason

def test_hybrid_matching_execution():
    candidate = CandidateProfile(
        id="cand-maya-lin",
        name="Maya Lin",
        headline="Founding ML / AI Pipeline Engineer",
        skills=["Python", "PyTorch", "Ollama", "Embeddings", "Vector Search", "SQL", "Pydantic"],
        years_of_experience=5,
        desired_salary_min=180000,
        remote_preference="remote"
    )

    job = ParsedJobDescription(
        title="Founding AI Engineer (ML/Data)",
        company="Matcha AI",
        role_level="Founding",
        location="Remote",
        remote_type="remote",
        salary_min=175000,
        salary_max=240000,
        experience_years_min=4,
        required_skills=["Python", "PyTorch", "Ollama", "Embeddings", "Vector Search", "SQL", "Data Pipelines"],
        searchable_summary="Founding AI Engineer building LLM extraction and vector search."
    )

    match = compute_hybrid_match(candidate, job, db_path=DB_PATH)
    assert match.score >= 80.0
    assert match.dense_similarity > 0.7
    assert match.graph_skill_score > 0.8
    assert "Strong direct skill alignment" in match.ai_rationale

def test_batch_ingest_runner():
    res = run_batch_ingest(raw_file=DATA_FILE, db_path=DB_PATH)
    assert res.jobs_parsed >= 3
    assert res.status in ["completed", "completed_with_errors"]
    assert len(res.trace_id) == 32

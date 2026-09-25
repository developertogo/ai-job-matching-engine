import sqlite3
import os
from typing import List, Dict, Tuple, Optional
from pipeline.schemas import ParsedJobDescription, CandidateProfile, MatchResult
from pipeline.embeddings import cosine_similarity, generate_embedding

# Default path to local SQLite database in workspace root
DB_PATH = os.getenv("TURSO_DATABASE_URL", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../local.db"))).replace("file:", "")

def get_graph_skill_score_with_cte(
    db_path: str,
    candidate_skills: List[str],
    job_skills: List[str]
) -> Tuple[float, List[str], List[Dict[str, any]]]:
    """
    Executes a SQLite Recursive CTE to traverse skills and skill_edges.
    Computes graph-based skill credit where exact matches yield 1.0, and 1-hop / 2-hop
    ontology relationships (e.g. alternative_to, sub_skill_of) yield decayed partial credit.
    """
    if not job_skills:
        return 1.0, [], []

    # Normalize skill names
    cand_norm = {s.lower().replace(" ", "").replace(".", ""): s for s in candidate_skills}
    job_norm = {s.lower().replace(" ", "").replace(".", ""): s for s in job_skills}

    if not os.path.exists(db_path):
        # Fallback if DB file is not yet initialized: direct Jaccard overlap
        direct = set(cand_norm.keys()) & set(job_norm.keys())
        ratio = len(direct) / max(len(job_norm), 1)
        return ratio, [cand_norm[k] for k in direct], []

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Query graph adjacency with Recursive CTE (up to 2 hops)
    cte_query = """
    WITH RECURSIVE skill_reach(source_id, reached_id, depth, accumulated_weight) AS (
        SELECT id AS source_id, id AS reached_id, 0 AS depth, 1.0 AS accumulated_weight
        FROM skills
        UNION
        SELECT sr.source_id, se.target_skill_id, sr.depth + 1, sr.accumulated_weight * se.weight
        FROM skill_reach sr
        JOIN skill_edges se ON sr.reached_id = se.source_skill_id
        WHERE sr.depth < 2
    )
    SELECT source_id, reached_id, MAX(accumulated_weight) as max_weight
    FROM skill_reach
    GROUP BY source_id, reached_id;
    """

    reach_map: Dict[str, Dict[str, float]] = {}
    try:
        cursor.execute(cte_query)
        for src, dest, weight in cursor.fetchall():
            s_key = src.lower().replace(" ", "").replace(".", "")
            d_key = dest.lower().replace(" ", "").replace(".", "")
            if s_key not in reach_map:
                reach_map[s_key] = {}
            reach_map[s_key][d_key] = max(reach_map[s_key].get(d_key, 0.0), float(weight))
    except Exception:
        pass
    finally:
        conn.close()

    total_credit = 0.0
    direct_matches: List[str] = []
    adjacent_matches: List[Dict[str, any]] = []

    for j_key, orig_j in job_norm.items():
        best_credit = 0.0
        best_source = None
        for c_key, orig_c in cand_norm.items():
            if c_key == j_key:
                best_credit = 1.0
                best_source = orig_c
                break
            # Check CTE graph traversal reach
            reach_weight = reach_map.get(c_key, {}).get(j_key, 0.0)
            if reach_weight > best_credit:
                best_credit = reach_weight
                best_source = orig_c

        total_credit += best_credit
        if best_credit == 1.0:
            direct_matches.append(best_source)
        elif best_credit > 0.0:
            adjacent_matches.append({
                "job_skill": orig_j,
                "candidate_skill": best_source,
                "weight": round(best_credit, 2)
            })

    graph_score = min(1.0, total_credit / max(len(job_skills), 1))
    return graph_score, direct_matches, adjacent_matches

def evaluate_hard_filters(candidate: CandidateProfile, job: ParsedJobDescription) -> Tuple[bool, str]:
    """Applies strict screening constraints: remote type, salary minimum, and years of experience."""
    if job.remote_type == "onsite" and candidate.remote_preference == "remote":
        return False, "Candidate requires remote work but position is onsite."

    if job.salary_max is not None and candidate.desired_salary_min > job.salary_max:
        return False, f"Candidate desired salary (${candidate.desired_salary_min:,}) exceeds job maximum (${job.salary_max:,})."

    if job.experience_years_min is not None and candidate.years_of_experience < job.experience_years_min:
        return False, f"Candidate experience ({candidate.years_of_experience} yrs) is below role minimum ({job.experience_years_min} yrs)."

    return True, "Passed hard constraints."

def compute_hybrid_match(
    candidate: CandidateProfile,
    job: ParsedJobDescription,
    cand_embedding: Optional[List[float]] = None,
    job_embedding: Optional[List[float]] = None,
    db_path: str = DB_PATH
) -> MatchResult:
    """
    Computes calibrated hybrid match score combining:
    - 50% Dense Vector Cosine Similarity
    - 50% Knowledge Graph Skill Traversal Score
    - Strict screening filters
    """
    passed, filter_msg = evaluate_hard_filters(candidate, job)
    if not passed:
        return MatchResult(
            job_id=job.title,
            candidate_id=candidate.id,
            score=0.0,
            dense_similarity=0.0,
            graph_skill_score=0.0,
            ai_rationale=f"Filter excluded: {filter_msg}",
            status="dismissed"
        )

    # 1. Dense Vector Semantic Similarity
    if cand_embedding is None:
        cand_text = f"{candidate.headline}. Skills: {', '.join(candidate.skills)}. {candidate.bio or ''}"
        cand_embedding = generate_embedding(cand_text)

    if job_embedding is None:
        job_text = f"{job.title} at {job.company}. Level: {job.role_level}. Skills: {', '.join(job.required_skills)}. {job.searchable_summary}"
        job_embedding = generate_embedding(job_text)

    dense_sim = cosine_similarity(cand_embedding, job_embedding)

    # 2. Knowledge Graph Skill Score via SQLite Recursive CTE
    graph_score, direct_matches, adjacent_matches = get_graph_skill_score_with_cte(
        db_path=db_path,
        candidate_skills=candidate.skills,
        job_skills=job.required_skills
    )

    # 3. Hybrid Weighted Composite Formula: 50% Vector + 50% Graph Ontology
    final_score = (0.50 * dense_sim) + (0.50 * graph_score)
    final_score_scaled = round(final_score * 100, 2)

    # 4. Generate AI Rationale
    rationale_parts = []
    if direct_matches:
        rationale_parts.append(f"Strong direct skill alignment in {', '.join(direct_matches[:4])}.")
    if adjacent_matches:
        adj_desc = ", ".join([f"{a['candidate_skill']} -> {a['job_skill']} ({int(a['weight']*100)}% credit)" for a in adjacent_matches[:2]])
        rationale_parts.append(f"Ontology graph credits transferable skills: {adj_desc}.")
    rationale_parts.append(f"Semantic profile similarity is {int(dense_sim * 100)}% with {candidate.years_of_experience} years of relevant experience.")

    ai_rationale = " ".join(rationale_parts)

    return MatchResult(
        job_id=job.title,
        candidate_id=candidate.id,
        score=final_score_scaled,
        dense_similarity=round(dense_sim, 4),
        graph_skill_score=round(graph_score, 4),
        ai_rationale=ai_rationale,
        status="pending"
    )

import re
import os
import httpx
from typing import Optional
from pipeline.schemas import ParsedJobDescription

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

def is_ollama_available() -> bool:
    try:
        res = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=1.0)
        return res.status_code == 200
    except Exception:
        return False

def fallback_regex_extractor(raw_jd_text: str) -> ParsedJobDescription:
    """
    Deterministic rule-based fallback extractor in case Ollama is offline.
    Extracts core signals from raw JD text.
    """
    title_match = re.search(
        r"((?:Founding|Staff|Senior|Principal|Lead)\s+[A-Za-z0-9\s/()-]+?(?:Engineer|Developer|Architect|Scientist))",
        raw_jd_text,
        re.IGNORECASE
    )
    title = title_match.group(1).strip() if title_match else "Software Engineer"

    company_match = re.search(r"([\w\s]+?)\s+(?:is looking for|is hiring|seeks)", raw_jd_text, re.IGNORECASE)
    company = company_match.group(1).strip() if company_match else "Matcha AI"

    # Remote detection
    remote_type = "remote"
    if "hybrid" in raw_jd_text.lower():
        remote_type = "hybrid"
    elif "onsite" in raw_jd_text.lower():
        remote_type = "onsite"

    # Salary detection e.g. $160,000 - $220,000
    salaries = [int(s.replace(",", "")) for s in re.findall(r"\$(\d{2,3}(?:,\d{3})+)", raw_jd_text)]
    salary_min = min(salaries) if salaries else None
    salary_max = max(salaries) if salaries else None

    # Equity detection e.g. 1.0% - 2.5%
    equities = [float(e) for e in re.findall(r"(\d+(?:\.\d+)?)\s*%", raw_jd_text)]
    equity_min = min(equities) if equities else None
    equity_max = max(equities) if equities else None

    # Experience detection e.g. 4+ years, 5+ years
    exp_match = re.search(r"(\d+)\+?\s*years", raw_jd_text, re.IGNORECASE)
    exp_min = int(exp_match.group(1)) if exp_match else None

    # Skill detection from known tech keywords
    known_tech = [
        "TypeScript", "JavaScript", "Python", "Node.js", "Fastify", "Express",
        "React", "Next.js", "Tailwind CSS", "SQLite", "libSQL", "Turso",
        "Drizzle ORM", "OpenTelemetry", "Docker", "Kubernetes", "PyTorch",
        "MLX", "Ollama", "Embeddings", "Vector Search", "SQL", "Pydantic", "Data Pipelines"
    ]
    detected_skills = [tech for tech in known_tech if re.search(r"\b" + re.escape(tech) + r"\b", raw_jd_text, re.IGNORECASE)]

    return ParsedJobDescription(
        title=title,
        company=company,
        role_level="Founding" if "founding" in raw_jd_text.lower() else "Senior",
        location="San Francisco, CA" if "san francisco" in raw_jd_text.lower() else "Remote",
        remote_type=remote_type,
        salary_min=salary_min,
        salary_max=salary_max,
        equity_min=equity_min,
        equity_max=equity_max,
        experience_years_min=exp_min,
        required_skills=detected_skills,
        responsibilities=[line.strip("- *") for line in raw_jd_text.splitlines() if line.strip().startswith(("-", "*"))],
        searchable_summary=f"{title} at {company} specializing in {', '.join(detected_skills[:5])}."
    )

def extract_job_details(raw_jd_text: str) -> ParsedJobDescription:
    """
    Parses unstructured job description text into a structured ParsedJobDescription.
    Uses local Ollama with Instructor when available, falling back to deterministic extraction.
    """
    if is_ollama_available():
        try:
            import instructor
            from openai import OpenAI
            client = instructor.from_openai(
                OpenAI(
                    base_url=f"{OLLAMA_BASE_URL}/v1",
                    api_key="ollama",
                ),
                mode=instructor.Mode.JSON,
            )
            return client.chat.completions.create(
                model=OLLAMA_MODEL,
                response_model=ParsedJobDescription,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert technical recruiting AI that parses raw job descriptions into structured schema.",
                    },
                    {"role": "user", "content": raw_jd_text},
                ],
            )
        except Exception:
            return fallback_regex_extractor(raw_jd_text)

    return fallback_regex_extractor(raw_jd_text)

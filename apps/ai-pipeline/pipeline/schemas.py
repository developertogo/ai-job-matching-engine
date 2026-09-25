from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class ParsedJobDescription(BaseModel):
    title: str = Field(description="Normalized job title")
    company: str = Field(description="Company name")
    role_level: str = Field(default="Founding", description="e.g. Founding, Staff, Senior, Mid, Junior")
    location: str = Field(default="Remote", description="Location or Global")
    remote_type: Literal["remote", "hybrid", "onsite"] = Field(default="remote")
    allowed_locations: List[str] = Field(default_factory=list)
    salary_min: Optional[int] = Field(None, description="Annual base salary lower bound in USD")
    salary_max: Optional[int] = Field(None, description="Annual base salary upper bound in USD")
    equity_min: Optional[float] = Field(None, description="Percentage equity lower bound e.g. 1.0")
    equity_max: Optional[float] = Field(None, description="Percentage equity upper bound e.g. 3.0")
    experience_years_min: Optional[int] = Field(None, description="Minimum years of required experience")
    experience_years_max: Optional[int] = Field(None, description="Maximum years of required experience")
    required_skills: List[str] = Field(default_factory=list, description="Core technical skills and technologies")
    responsibilities: List[str] = Field(default_factory=list, description="Key duties and responsibilities")
    searchable_summary: str = Field(default="", description="1-sentence dense summary for semantic embedding")

class CandidateProfile(BaseModel):
    id: str
    name: str
    headline: str
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    years_of_experience: int = 0
    desired_salary_min: int = 0
    remote_preference: Literal["remote", "hybrid", "onsite"] = "remote"

class MatchResult(BaseModel):
    job_id: str
    candidate_id: str
    score: float = Field(ge=0.0, le=100.0, description="Hybrid match score between 0 and 100")
    dense_similarity: float = Field(ge=0.0, le=1.0, description="Semantic embedding cosine similarity")
    graph_skill_score: float = Field(ge=0.0, le=1.0, description="Knowledge graph skill overlap score")
    ai_rationale: str = Field(description="Clear explanation of why candidate matches this role")
    status: Literal["pending", "saved", "applied", "dismissed"] = "pending"

class BatchIngestResult(BaseModel):
    batch_id: str
    status: Literal["in_progress", "completed", "failed"]
    jobs_parsed: int
    duration_ms: int
    trace_id: str
    errors: List[str] = Field(default_factory=list)

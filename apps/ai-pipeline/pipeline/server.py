from fastapi import FastAPI, HTTPException
from pipeline.schemas import ParsedJobDescription, CandidateProfile, MatchResult, BatchIngestResult
from pipeline.extractor import extract_job_details
from pipeline.embeddings import generate_embedding
from pipeline.matcher import compute_hybrid_match
from pipeline.ingestion import run_batch_ingest
from pydantic import BaseModel

app = FastAPI(title="ai-job-matching-engine AI Pipeline", version="0.1.0")

class ParseRequest(BaseModel):
    raw_text: str

class MatchRequest(BaseModel):
    candidate: CandidateProfile
    job: ParsedJobDescription

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-pipeline"}

@app.post("/extract", response_model=ParsedJobDescription)
def extract_endpoint(req: ParseRequest):
    try:
        return extract_job_details(req.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match", response_model=MatchResult)
def match_endpoint(req: MatchRequest):
    try:
        return compute_hybrid_match(req.candidate, req.job)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest", response_model=BatchIngestResult)
def ingest_endpoint():
    try:
        return run_batch_ingest()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("pipeline.server:app", host="0.0.0.0", port=8000, reload=True)

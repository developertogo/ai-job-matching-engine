import os
import struct
import numpy as np
import httpx
import re
from typing import List

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
EMBEDDING_DIM = 768

def vector_to_blob(vec: List[float]) -> bytes:
    """Converts a float vector list to a binary float32 buffer for SQLite BLOB."""
    return struct.pack(f"{len(vec)}f", *vec)

def blob_to_vector(blob_data: bytes) -> List[float]:
    """Converts a binary float32 SQLite BLOB buffer back to a float vector list."""
    count = len(blob_data) // 4
    return list(struct.unpack(f"{count}f", blob_data))

def generate_fallback_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Generates a deterministic semantic representation using token-hash vector summation.
    Produces high cosine similarity for texts sharing semantic keywords and near-zero
    for orthogonal/unrelated texts.
    """
    words = re.findall(r"\b\w+\b", text.lower())
    if not words:
        words = ["empty"]

    accum_vec = np.zeros(dim, dtype=np.float32)
    for word in words:
        w_hash = sum(ord(c) * (37 ** (i % 7)) for i, c in enumerate(word))
        rng = np.random.RandomState(w_hash % (2**31 - 1))
        accum_vec += rng.randn(dim).astype(np.float32)

    norm = np.linalg.norm(accum_vec)
    if norm > 0:
        accum_vec = accum_vec / norm
    return accum_vec.tolist()

def generate_embedding(text: str) -> List[float]:
    """
    Generates a 768-dimensional float embedding using Ollama nomic-embed-text.
    Falls back to token-hash semantic embedding if Ollama is unavailable.
    """
    try:
        res = httpx.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": EMBEDDING_MODEL, "prompt": text},
            timeout=3.0,
        )
        if res.status_code == 200:
            data = res.json()
            embedding = data.get("embedding", [])
            if len(embedding) == EMBEDDING_DIM:
                vec = np.array(embedding, dtype=np.float32)
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                return vec.tolist()
    except Exception:
        pass

    return generate_fallback_embedding(text, dim=EMBEDDING_DIM)

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two float vectors, returning a value between 0.0 and 1.0."""
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    sim = float(np.dot(a, b) / (norm_a * norm_b))
    # Normalize [-1, 1] to [0, 1]
    return max(0.0, min(1.0, (sim + 1.0) / 2.0))

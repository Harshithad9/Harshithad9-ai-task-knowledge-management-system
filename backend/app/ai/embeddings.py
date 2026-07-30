"""
Wraps fastembed (ONNX Runtime backend, no CUDA/GPU required) to turn text
into dense vectors for semantic search.

The model (BAAI/bge-small-en-v1.5, 384-dim) is downloaded once on first
use and cached in ~/.cache/fastembed. No external API calls are made at
query time — all inference runs locally.
"""
import threading
from functools import lru_cache

import numpy as np
from fastembed import TextEmbedding

from app.config import settings

_model_lock = threading.Lock()

# fastembed model names: use bge-small (compatible with sentence-transformers)
_DEFAULT_MODEL = "BAAI/bge-small-en-v1.5"


@lru_cache(maxsize=1)
def get_embedding_model() -> TextEmbedding:
    with _model_lock:
        model_name = getattr(settings, "EMBEDDING_MODEL_NAME", _DEFAULT_MODEL)
        # fastembed only knows its own model names; map the ST name if needed
        if "/" not in model_name:
            model_name = _DEFAULT_MODEL
        return TextEmbedding(model_name=model_name)


def embed_texts(texts: list[str]) -> np.ndarray:
    """Returns an (n, dim) float32 array of L2-normalised embeddings."""
    if not texts:
        return np.zeros((0, get_embedding_dim()), dtype="float32")
    model = get_embedding_model()
    vectors = list(model.embed(texts))
    arr = np.array(vectors, dtype="float32")
    # fastembed already normalises, but enforce it explicitly
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return arr / norms


def embed_query(query: str) -> np.ndarray:
    return embed_texts([query])[0]


def get_embedding_dim() -> int:
    return 384  # bge-small-en-v1.5 output dimension

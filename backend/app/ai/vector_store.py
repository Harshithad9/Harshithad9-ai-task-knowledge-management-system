"""
Persistent FAISS vector store.

- Vectors live in a FAISS IndexIDMap(IndexFlatIP) index (cosine similarity,
  since embeddings are L2-normalized -> inner product == cosine similarity).
- Each vector's id maps to {document_id, filename, chunk_text} in a JSON
  sidecar file, because FAISS itself only stores raw vectors.
- The whole store is a simple singleton guarded by a lock so concurrent
  requests don't corrupt the on-disk index.
"""
import json
import os
import threading

import faiss
import numpy as np

from app.config import settings
from app.ai.embeddings import get_embedding_dim

_lock = threading.Lock()

_INDEX_PATH = os.path.join(settings.VECTOR_INDEX_DIR, "index.faiss")
_META_PATH = os.path.join(settings.VECTOR_INDEX_DIR, "metadata.json")

_index = None
_metadata: dict[str, dict] = {}
_next_id = 0


def _ensure_dirs():
    os.makedirs(settings.VECTOR_INDEX_DIR, exist_ok=True)


def _load():
    global _index, _metadata, _next_id
    _ensure_dirs()
    dim = get_embedding_dim()

    if os.path.exists(_INDEX_PATH) and os.path.exists(_META_PATH):
        _index = faiss.read_index(_INDEX_PATH)
        with open(_META_PATH, "r", encoding="utf-8") as f:
            saved = json.load(f)
        _metadata = saved.get("metadata", {})
        _next_id = saved.get("next_id", 0)
    else:
        base = faiss.IndexFlatIP(dim)
        _index = faiss.IndexIDMap(base)
        _metadata = {}
        _next_id = 0


def _save():
    _ensure_dirs()
    faiss.write_index(_index, _INDEX_PATH)
    with open(_META_PATH, "w", encoding="utf-8") as f:
        json.dump({"metadata": _metadata, "next_id": _next_id}, f)


def _get_state():
    global _index
    if _index is None:
        _load()
    return _index


def add_chunks(document_id: int, filename: str, chunks: list[str], vectors: np.ndarray) -> list[int]:
    """Adds chunk vectors to the index, returns the assigned vector ids."""
    global _next_id
    with _lock:
        _get_state()
        ids = []
        for chunk in chunks:
            vid = _next_id
            _next_id += 1
            ids.append(vid)
            _metadata[str(vid)] = {
                "document_id": document_id,
                "filename": filename,
                "chunk_text": chunk,
            }
        if vectors.shape[0] > 0:
            id_array = np.array(ids, dtype="int64")
            _index.add_with_ids(vectors, id_array)
        _save()
        return ids


def search(query_vector: np.ndarray, top_k: int = 5) -> list[dict]:
    with _lock:
        _get_state()
        if _index.ntotal == 0:
            return []
        query_vector = query_vector.reshape(1, -1)
        scores, ids = _index.search(query_vector, min(top_k, _index.ntotal))
        results = []
        for score, vid in zip(scores[0], ids[0]):
            if vid == -1:
                continue
            meta = _metadata.get(str(int(vid)))
            if not meta:
                continue
            results.append(
                {
                    "document_id": meta["document_id"],
                    "filename": meta["filename"],
                    "chunk_text": meta["chunk_text"],
                    "score": float(score),
                }
            )
        return results


def remove_document(document_id: int, vector_ids: list[int]):
    """Removes a document's vectors from the index (used if a document is deleted)."""
    with _lock:
        _get_state()
        if vector_ids:
            id_array = np.array(vector_ids, dtype="int64")
            _index.remove_ids(id_array)
            for vid in vector_ids:
                _metadata.pop(str(vid), None)
            _save()

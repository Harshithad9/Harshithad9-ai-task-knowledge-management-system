import React, { useState } from 'react';
import { semanticSearch } from '../api/search';
import Sidebar from '../components/Sidebar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await semanticSearch(query.trim(), topK);
      setResults(res.data.results);
      setSearched(query.trim());
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const words = q.split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: '#fef08a', borderRadius: 2 }}>{part}</mark>
        : part
    );
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Semantic Search</div>
            <div className="page-subtitle">AI-powered search across your knowledge base using local FAISS embeddings</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Search Query</label>
                <div className="search-bar">
                  <span className="search-icon">🔍</span>
                  <input
                    className="form-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about your documents…"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
              <div style={{ width: 120 }}>
                <label className="form-label">Results</label>
                <select
                  className="form-select"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                >
                  {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !query.trim()}
                style={{ marginBottom: 0 }}
              >
                {loading ? <span className="spinner" /> : 'Search'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 12, fontSize: '.8rem', color: 'var(--gray-500)' }}>
            💡 Tip: Search uses BAAI/bge-small-en-v1.5 embeddings via ONNX Runtime — no external API calls at query time.
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span className="spinner" />
            <p className="text-muted" style={{ marginTop: 12 }}>Embedding query and searching…</p>
          </div>
        )}

        {results !== null && !loading && (
          <>
            <div style={{ marginBottom: 16, fontSize: '.875rem', color: 'var(--gray-500)' }}>
              {results.length === 0
                ? 'No results found. Try uploading some documents first.'
                : `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${searched}"`}
            </div>

            <div className="search-results">
              {results.map((r, i) => (
                <div key={i} className="result-card">
                  <div className="result-card-header">
                    <div className="result-filename">
                      📄 {r.filename}
                      <span className="text-muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                        Doc #{r.document_id}
                      </span>
                    </div>
                    <span className="result-score">
                      Score: {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="result-chunk">
                    {highlight(r.chunk_text, searched)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {results === null && !loading && !error && (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">
              Enter a query above to search your knowledge base.<br />
              Results are ranked by semantic similarity — not just keyword matching.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../api/analytics';
import Sidebar from '../components/Sidebar';

function ProgressBar({ value, max, color = 'var(--primary)' }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ background: 'var(--gray-100)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .5s ease' }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalytics()
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" />
      </main>
    </div>
  );

  if (error) return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="alert alert-error">{error}</div>
      </main>
    </div>
  );

  const completionRate = data.total_tasks === 0 ? 0 : Math.round((data.completed_tasks / data.total_tasks) * 100);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Analytics Dashboard</div>
            <div className="page-subtitle">System-wide statistics and usage insights</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>

        {/* Top-level stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-value">{data.total_tasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{data.pending_tasks}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{data.completed_tasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.total_documents}</div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.total_users}</div>
            <div className="stat-label">Users</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 24 }}>
          {/* Task completion breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Task Completion Rate</h3>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: completionRate >= 75 ? 'var(--success)' : completionRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                {completionRate}%
              </div>
              <div className="text-muted">of tasks completed</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.85rem' }}>
                  <span>✅ Completed</span>
                  <span style={{ fontWeight: 600 }}>{data.completed_tasks}</span>
                </div>
                <ProgressBar value={data.completed_tasks} max={data.total_tasks} color="var(--success)" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.85rem' }}>
                  <span>⏳ Pending</span>
                  <span style={{ fontWeight: 600 }}>{data.pending_tasks}</span>
                </div>
                <ProgressBar value={data.pending_tasks} max={data.total_tasks} color="var(--warning)" />
              </div>
            </div>
          </div>

          {/* Most searched queries */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Most Searched Queries</h3>
            {data.most_searched_queries.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-text">No searches recorded yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.most_searched_queries.map((q, i) => {
                  const maxCount = data.most_searched_queries[0].count;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.85rem' }}>
                        <span style={{ fontWeight: 500 }}>
                          <span className="text-muted" style={{ marginRight: 8 }}>#{i + 1}</span>
                          "{q.query}"
                        </span>
                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {q.count}×
                        </span>
                      </div>
                      <ProgressBar value={q.count} max={maxCount} color="var(--primary)" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Summary card */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>System Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Knowledge base size', value: `${data.total_documents} document${data.total_documents !== 1 ? 's' : ''}` },
              { label: 'Active users', value: `${data.total_users} registered` },
              { label: 'Task workload', value: `${data.pending_tasks} pending / ${data.total_tasks} total` },
              { label: 'Unique queries', value: `${data.most_searched_queries.length} tracked` },
            ].map((item) => (
              <div key={item.label} style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div className="text-muted" style={{ marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

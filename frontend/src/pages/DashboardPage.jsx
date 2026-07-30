import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../api/tasks';
import { getDocuments } from '../api/documents';
import Sidebar from '../components/Sidebar';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTasks(), getDocuments()])
      .then(([t, d]) => { setTasks(t.data); setDocs(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Welcome, {user?.username} 👋</div>
            <div className="page-subtitle">Here's what's happening today</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{tasks.length}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>{completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{docs.length}</div>
                <div className="stat-label">Documents</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Recent Tasks</h3>
                {tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <div className="empty-state-text">No tasks yet</div>
                  </div>
                ) : (
                  tasks.slice(0, 5).map((task) => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ fontSize: '.875rem' }}>{task.title}</span>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </div>
                  ))
                )}
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/tasks')}>
                  View all tasks →
                </button>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Recent Documents</h3>
                {docs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <div className="empty-state-text">No documents uploaded yet</div>
                  </div>
                ) : (
                  docs.slice(0, 5).map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ fontSize: '1.2rem' }}>{doc.file_type === 'pdf' ? '📕' : '📝'}</span>
                      <div>
                        <div style={{ fontSize: '.875rem', fontWeight: 500 }}>{doc.filename}</div>
                        <div className="text-muted">{doc.file_type.toUpperCase()}</div>
                      </div>
                    </div>
                  ))
                )}
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/documents')}>
                  View all documents →
                </button>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate('/search')}>🔍 Search Knowledge Base</button>
                {user?.role === 'admin' && (
                  <>
                    <button className="btn btn-outline" onClick={() => navigate('/documents')}>📤 Upload Document</button>
                    <button className="btn btn-outline" onClick={() => navigate('/tasks')}>➕ Create Task</button>
                    <button className="btn btn-outline" onClick={() => navigate('/analytics')}>📈 View Analytics</button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

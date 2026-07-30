import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTaskStatus } from '../api/tasks';
import { listUsers } from '../api/auth';
import Sidebar from '../components/Sidebar';

function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsers().then((r) => setUsers(r.data)).catch(console.error);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assigned_to) { setError('Please select a user to assign'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createTask({ ...form, assigned_to: Number(form.assigned_to) });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Create New Task</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" type="text" value={form.title} onChange={set('title')} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={set('description')} placeholder="Optional description" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Assign To *</label>
            <select className="form-select" value={form.assigned_to} onChange={set('assigned_to')} required>
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      const res = await getTasks(params);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    setUpdating(task.id);
    try {
      const res = await updateTaskStatus(task.id, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{isAdmin ? 'Task Management' : 'My Tasks'}</div>
            <div className="page-subtitle">{isAdmin ? 'Create and manage tasks for users' : 'View and complete your assigned tasks'}</div>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ New Task
            </button>
          )}
        </div>

        {/* Dynamic Filtering */}
        <div className="filter-bar">
          <span style={{ fontSize: '.85rem', color: 'var(--gray-500)', alignSelf: 'center' }}>Filter:</span>
          {['', 'pending', 'completed'].map((s) => (
            <button
              key={s || 'all'}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No tasks found{statusFilter ? ` with status "${statusFilter}"` : ''}</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    {isAdmin && <th>Assigned To</th>}
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="text-muted">{task.id}</td>
                      <td style={{ fontWeight: 500 }}>{task.title}</td>
                      <td className="text-muted">{task.description || '—'}</td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      {isAdmin && <td className="text-muted">User #{task.assigned_to}</td>}
                      <td className="text-muted">{new Date(task.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${task.status === 'pending' ? 'btn-success' : 'btn-outline'}`}
                          onClick={() => toggleStatus(task)}
                          disabled={updating === task.id}
                        >
                          {updating === task.id
                            ? <span className="spinner" />
                            : task.status === 'pending' ? '✓ Complete' : '↩ Reopen'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <CreateTaskModal
            onClose={() => setShowModal(false)}
            onCreated={(t) => setTasks((prev) => [t, ...prev])}
          />
        )}
      </main>
    </div>
  );
}

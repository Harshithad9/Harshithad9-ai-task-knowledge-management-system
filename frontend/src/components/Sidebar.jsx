import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS_ADMIN = [
  { path: '/dashboard', label: '📊 Dashboard', key: 'dashboard' },
  { path: '/tasks', label: '✅ Tasks', key: 'tasks' },
  { path: '/documents', label: '📄 Documents', key: 'documents' },
  { path: '/search', label: '🔍 Search', key: 'search' },
  { path: '/analytics', label: '📈 Analytics', key: 'analytics' },
];

const NAV_ITEMS_USER = [
  { path: '/dashboard', label: '📊 Dashboard', key: 'dashboard' },
  { path: '/tasks', label: '✅ My Tasks', key: 'tasks' },
  { path: '/documents', label: '📄 Documents', key: 'documents' },
  { path: '/search', label: '🔍 Search', key: 'search' },
];

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === 'admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_USER;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        🤖 AI Task &amp;<br />Knowledge Manager
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          Logged in as
        </div>
        <div className="sidebar-username">{user?.username}</div>
        <span className={`badge badge-${user?.role}`} style={{ marginTop: 4 }}>{user?.role}</span>
        <br />
        <button
          className="btn btn-outline btn-sm"
          style={{ marginTop: 10, width: '100%' }}
          onClick={logoutUser}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

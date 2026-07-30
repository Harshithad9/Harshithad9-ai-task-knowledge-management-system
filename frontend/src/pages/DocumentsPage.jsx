import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, uploadDocument } from '../api/documents';
import Sidebar from '../components/Sidebar';

export default function DocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    getDocuments()
      .then((r) => setDocs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'pdf'].includes(ext)) {
      setError('Only .txt and .pdf files are supported');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const res = await uploadDocument(file);
      setDocs((prev) => [res.data, ...prev]);
      setSuccess(`"${file.name}" uploaded and indexed successfully!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Knowledge Base</div>
            <div className="page-subtitle">Browse uploaded documents; admins can upload new files</div>
          </div>
        </div>

        {isAdmin && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Upload Document</h3>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {uploading ? (
                <>
                  <div className="upload-zone-icon">⏳</div>
                  <div className="upload-zone-text">Uploading and indexing… this may take a moment</div>
                  <div style={{ marginTop: 12 }}><span className="spinner" /></div>
                </>
              ) : (
                <>
                  <div className="upload-zone-icon">📤</div>
                  <div className="upload-zone-text">
                    <strong>Click to upload</strong> or drag and drop a file here
                    <br />
                    <span style={{ fontSize: '.8rem', color: 'var(--gray-500)' }}>Supported: .txt, .pdf</span>
                  </div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".txt,.pdf" style={{ display: 'none' }} onChange={onFileChange} />
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Documents ({docs.length})</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <div className="empty-state-text">No documents uploaded yet</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="text-muted">{doc.id}</td>
                      <td>
                        <span style={{ marginRight: 8 }}>{doc.file_type === 'pdf' ? '📕' : '📝'}</span>
                        <span style={{ fontWeight: 500 }}>{doc.filename}</span>
                      </td>
                      <td><span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}>{doc.file_type.toUpperCase()}</span></td>
                      <td className="text-muted">User #{doc.uploaded_by}</td>
                      <td className="text-muted">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

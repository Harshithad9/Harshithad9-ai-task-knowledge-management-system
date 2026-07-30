import client from "./client";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return client.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const register = (payload) => client.post("/auth/register", payload);
export const getMe = () => client.get("/auth/me");
export const getUsers = () => client.get("/auth/users");

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const getTasks = (params = {}) => client.get("/tasks", { params });
export const createTask = (payload) => client.post("/tasks", payload);
export const updateTaskStatus = (taskId, status) =>
  client.patch(`/tasks/${taskId}/status`, { status });

// ── Documents ─────────────────────────────────────────────────────────────────
export const getDocuments = () => client.get("/documents");
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return client.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Search ────────────────────────────────────────────────────────────────────
export const semanticSearch = (query, top_k = 5) =>
  client.post("/search", { query, top_k });

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalytics = () => client.get("/analytics");

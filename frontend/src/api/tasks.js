import client from './client';
export const getTasks = (params = {}) => client.get('/tasks', { params });
export const createTask = (data) => client.post('/tasks', data);
export const updateTaskStatus = (id, status) => client.patch(`/tasks/${id}/status`, { status });

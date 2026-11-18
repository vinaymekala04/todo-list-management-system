import api from './axios.js';

// Task endpoints from the project spec (Section 5).
// Task shape: { id, title, description, dueDate, priority: 'HIGH'|'MEDIUM'|'LOW',
//   status: 'TODO'|'IN_PROGRESS'|'COMPLETED', createdAt, updatedAt }
export const tasksApi = {
  // GET /api/tasks — all tasks of the logged-in user.
  getAll: () => api.get('/tasks'),

  // GET /api/tasks/{id}
  getById: (id) => api.get(`/tasks/${id}`),

  // POST /api/tasks — body: { title, description, dueDate, priority, status }
  create: (data) => api.post('/tasks', data),

  // PUT /api/tasks/{id}
  update: (id, data) => api.put(`/tasks/${id}`, data),

  // DELETE /api/tasks/{id}
  remove: (id) => api.delete(`/tasks/${id}`),

  // PATCH /api/tasks/{id}/complete — mark a task as completed.
  complete: (id) => api.patch(`/tasks/${id}/complete`),
};

export default tasksApi;

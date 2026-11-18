import api from './axios.js';

// Dashboard endpoint from the project spec (Section 5).
// GET /api/dashboard/summary returns (field names may vary by backend):
// { totalTasks, completedTasks, pendingTasks, inProgressTasks,
//   overdueTasks, completionPercentage }
// This module normalises the response so the Dashboard page always
// receives the same shape.
export const dashboardApi = {
  getSummary: async () => {
    const { data } = await api.get('/dashboard/summary');
    const total = data.totalTasks ?? data.total ?? 0;
    const completed = data.completedTasks ?? data.completed ?? 0;
    const pending = data.pendingTasks ?? data.pending ?? 0;
    const inProgress = data.inProgressTasks ?? data.in_progress ?? data.inProgress ?? 0;
    const overdue = data.overdueTasks ?? data.overdue ?? 0;
    const completionPercentage =
      data.completionPercentage ??
      data.completionRate ??
      (total > 0 ? Math.round((completed / total) * 100) : 0);
    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      completionPercentage,
    };
  },
};

export default dashboardApi;

import api from './axios.js';

// Alerts endpoint (in-app only).
// GET /api/alerts/summary returns:
// { overdueCount, dueTodayCount, dueTomorrowCount,
//   overdueTasks: [...], dueTodayTasks: [...], dueTomorrowTasks: [...] }
// with task objects in the same TaskResponse shape as the tasks API
// (id, title, description, dueDate, priority, status, createdAt, updatedAt).
//
// NOTE: POST /api/alerts/send-reminders is intentionally not called from the
// UI — it is a backend-only endpoint for testing via Postman/curl.
// In production, email reminders are sent by the backend's daily job.
export const alertsApi = {
  getAlertSummary: async () => {
    const { data } = await api.get('/alerts/summary');
    const overdueTasks = data.overdueTasks ?? data.overdue ?? [];
    const dueTodayTasks = data.dueTodayTasks ?? data.dueToday ?? [];
    const dueTomorrowTasks = data.dueTomorrowTasks ?? data.dueTomorrow ?? [];
    return {
      overdueCount: data.overdueCount ?? overdueTasks.length,
      dueTodayCount: data.dueTodayCount ?? dueTodayTasks.length,
      dueTomorrowCount: data.dueTomorrowCount ?? dueTomorrowTasks.length,
      overdueTasks,
      dueTodayTasks,
      dueTomorrowTasks,
    };
  },
};

export default alertsApi;

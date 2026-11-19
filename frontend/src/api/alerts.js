import api from './axios.js';

// Alerts endpoints (in-app + email reminders).
// GET /api/alerts/summary returns:
// { overdueCount, dueTodayCount, dueTomorrowCount,
//   overdueTasks: [...], dueTodayTasks: [...], dueTomorrowTasks: [...] }
// with task objects in the same TaskResponse shape as the tasks API
// (id, title, description, dueDate, priority, status, createdAt, updatedAt).
// POST /api/alerts/send-reminders returns { sent, failed, message }.
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

  // Triggers the backend to send due-date email reminders now.
  // Returns { sent, failed, message }. Fails with a readable error
  // when mail is not configured on the backend.
  sendReminders: async () => {
    const { data } = await api.post('/alerts/send-reminders');
    return {
      sent: data.sent ?? 0,
      failed: data.failed ?? 0,
      message: data.message ?? '',
    };
  },
};

export default alertsApi;

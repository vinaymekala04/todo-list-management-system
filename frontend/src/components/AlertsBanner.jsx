import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alertsApi } from '../api/alerts.js';
import { getErrorMessage } from '../api/axios.js';

const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function formatDate(value) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function AlertTaskList({ tasks }) {
  return (
    <ul className="alerts-task-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link to={`/tasks/${task.id}/edit`}>{task.title}</Link>
          <span className="alerts-task-meta">
            Due: {formatDate(task.dueDate)} · {PRIORITY_LABELS[task.priority] || task.priority || 'Medium'} priority
          </span>
        </li>
      ))}
    </ul>
  );
}

// In-app alerts banner for the Dashboard. Fetches GET /api/alerts/summary
// on mount and shows nothing when there is nothing due — overdue, due
// today, or due tomorrow. The "Send test email reminder" button calls
// POST /api/alerts/send-reminders and reports the result; if mail is not
// configured on the backend the API error is shown instead.
export default function AlertsBanner() {
  const [summary, setSummary] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await alertsApi.getAlertSummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Alerts are a bonus on top of the dashboard — a failed fetch
        // must not break the page, so show nothing instead.
        if (!cancelled) setSummary(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendReminders() {
    setSending(true);
    setSendResult(null);
    setSendError('');
    try {
      const result = await alertsApi.sendReminders();
      setSendResult(result);
    } catch (err) {
      setSendError(
        getErrorMessage(err, 'Could not send email reminders. Mail may not be configured on the backend.')
      );
    } finally {
      setSending(false);
    }
  }

  if (!summary) return null;
  const hasAlerts =
    summary.overdueCount > 0 || summary.dueTodayCount > 0 || summary.dueTomorrowCount > 0;
  if (!hasAlerts) return null;

  return (
    <section className="alerts-banner" aria-label="Task alerts">
      <div className="alerts-banner-header">
        <h2>⚠ Task Alerts</h2>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleSendReminders}
          disabled={sending}
        >
          {sending ? 'Sending…' : 'Send test email reminder'}
        </button>
      </div>

      {sendResult && (
        <div className="alert alert-success">
          {sendResult.message || `Email reminders sent: ${sendResult.sent} sent, ${sendResult.failed} failed.`}
        </div>
      )}
      {sendError && <div className="alert alert-error">{sendError}</div>}

      <div className="alerts-sections">
        {summary.overdueCount > 0 && (
          <div className="alerts-section alerts-section-overdue">
            <h3>Overdue ({summary.overdueCount})</h3>
            <AlertTaskList tasks={summary.overdueTasks} />
          </div>
        )}
        {summary.dueTodayCount > 0 && (
          <div className="alerts-section alerts-section-due-today">
            <h3>Due today ({summary.dueTodayCount})</h3>
            <AlertTaskList tasks={summary.dueTodayTasks} />
          </div>
        )}
        {summary.dueTomorrowCount > 0 && (
          <div className="alerts-section alerts-section-due-tomorrow">
            <h3>Due tomorrow ({summary.dueTomorrowCount})</h3>
            <AlertTaskList tasks={summary.dueTomorrowTasks} />
          </div>
        )}
      </div>
    </section>
  );
}

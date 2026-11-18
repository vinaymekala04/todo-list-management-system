import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.js';
import { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

// Dashboard (spec Module 6 + Section 6 example):
// Total 25 | Completed 15 | Pending 7 | Overdue 3 — plus in-progress
// tasks and the completion percentage.
export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await dashboardApi.getSummary();
        setSummary(data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load dashboard statistics.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            {user?.name ? `Hello, ${user.name} — ` : ''}here is an overview of your tasks.
          </p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          + New Task
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">{summary.totalTasks}</span>
            </div>
            <div className="stat-card stat-completed">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{summary.completedTasks}</span>
            </div>
            <div className="stat-card stat-pending">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{summary.pendingTasks}</span>
            </div>
            <div className="stat-card stat-progress">
              <span className="stat-label">In Progress</span>
              <span className="stat-value">{summary.inProgressTasks}</span>
            </div>
            <div className="stat-card stat-overdue">
              <span className="stat-label">Overdue</span>
              <span className="stat-value">{summary.overdueTasks}</span>
            </div>
            <div className="stat-card stat-percent">
              <span className="stat-label">Completion</span>
              <span className="stat-value">{summary.completionPercentage}%</span>
            </div>
          </div>

          <div className="card progress-card">
            <div className="progress-header">
              <h2>Task Completion</h2>
              <span>
                {summary.completedTasks} of {summary.totalTasks} tasks completed
              </span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={summary.completionPercentage} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-fill" style={{ width: `${summary.completionPercentage}%` }} />
            </div>
            <p className="progress-text">{summary.completionPercentage}% complete</p>
          </div>
        </>
      )}

      <div className="dashboard-links">
        <Link to="/tasks" className="btn btn-outline">
          View My Tasks →
        </Link>
      </div>
    </div>
  );
}

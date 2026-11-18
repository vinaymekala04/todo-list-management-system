import { Link } from 'react-router-dom';

const PRIORITY_LABELS = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

function formatDate(value) {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === 'COMPLETED') return false;
  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export default function TaskCard({ task, onComplete, onDelete, completing, deleting }) {
  const overdue = isOverdue(task);
  const completed = task.status === 'COMPLETED';

  return (
    <article className={`task-card ${completed ? 'task-card-completed' : ''} ${overdue ? 'task-card-overdue' : ''}`}>
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <span className={`badge badge-priority-${(task.priority || 'MEDIUM').toLowerCase()}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-meta">
        <span className={`badge badge-status-${(task.status || 'TODO').toLowerCase()}`}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
        <span className={overdue ? 'task-due-overdue' : ''}>
          📅 Due: {formatDate(task.dueDate)}
          {overdue ? ' (Overdue)' : ''}
        </span>
        {task.createdAt && <span>Created: {formatDate(task.createdAt)}</span>}
      </div>

      <div className="task-card-actions">
        {!completed && (
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() => onComplete(task)}
            disabled={completing}
          >
            {completing ? 'Completing…' : '✓ Complete'}
          </button>
        )}
        <Link to={`/tasks/${task.id}/edit`} className="btn btn-outline btn-sm">
          Edit
        </Link>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(task)}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  );
}

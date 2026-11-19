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

// Calendar-day difference between the task's due date and today.
// null when there is no due date or the task is completed.
function dueDayDiff(task) {
  if (!task.dueDate || task.status === 'COMPLETED') return null;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startOf(due) - startOf(today)) / (24 * 60 * 60 * 1000));
}

export function isDueToday(task) {
  return dueDayDiff(task) === 0;
}

export function isDueTomorrow(task) {
  return dueDayDiff(task) === 1;
}

export default function TaskCard({ task, onComplete, onDelete, completing, deleting }) {
  const overdue = isOverdue(task);
  const dueToday = !overdue && isDueToday(task);
  const dueTomorrow = !overdue && isDueTomorrow(task);
  const completed = task.status === 'COMPLETED';

  return (
    <article
      className={`task-card ${completed ? 'task-card-completed' : ''} ${overdue ? 'task-card-overdue' : ''} ${dueToday ? 'task-card-due-today' : ''} ${dueTomorrow ? 'task-card-due-tomorrow' : ''}`}
    >
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
        <span className={overdue ? 'task-due-overdue' : dueToday ? 'task-due-today' : dueTomorrow ? 'task-due-tomorrow' : ''}>
          📅 Due: {formatDate(task.dueDate)}
          {overdue ? ' (Overdue)' : ''}
        </span>
        {dueToday && <span className="badge badge-due-today">Due today</span>}
        {dueTomorrow && <span className="badge badge-due-tomorrow">Due tomorrow</span>}
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

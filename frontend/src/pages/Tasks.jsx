import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks.js';
import { getErrorMessage } from '../api/axios.js';
import TaskCard from '../components/TaskCard.jsx';
import SearchFilter from '../components/SearchFilter.jsx';

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const { data } = await tasksApi.getAll();
      // Backend may return an array directly or a paged { content: [...] }.
      setTasks(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your tasks.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // Search by title + filter by status / priority / due date, then sort
  // (spec Module 5). Done client-side over the fetched list.
  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (query && !(task.title || '').toLowerCase().includes(query)) return false;
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (dueDateFilter && String(task.dueDate || '').slice(0, 10) !== dueDateFilter) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'createdAt-asc':
        sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'dueDate-asc':
        sorted.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
        break;
      case 'dueDate-desc':
        sorted.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));
        break;
      case 'priority':
        sorted.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1));
        break;
      case 'title-asc':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'createdAt-desc':
      default:
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }
    return sorted;
  }, [tasks, search, statusFilter, priorityFilter, dueDateFilter, sortBy]);

  function clearFilters() {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setDueDateFilter('');
    setSortBy('createdAt-desc');
  }

  async function handleComplete(task) {
    setActionId(task.id);
    setActionType('complete');
    setNotice('');
    try {
      await tasksApi.complete(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: 'COMPLETED' } : t)));
      setNotice(`"${task.title}" marked as completed.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not complete the task.'));
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setActionId(task.id);
    setActionType('delete');
    setNotice('');
    try {
      await tasksApi.remove(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setNotice(`"${task.title}" deleted.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the task.'));
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  if (loading) return <div className="page-loading">Loading tasks…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="page-subtitle">
            {visibleTasks.length} of {tasks.length} task{tasks.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          + New Task
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        dueDateFilter={dueDateFilter}
        onDueDateChange={setDueDateFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClear={clearFilters}
      />

      {visibleTasks.length === 0 ? (
        <div className="empty-state">
          <p>{tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your search or filters.'}</p>
          {tasks.length === 0 ? (
            <Link to="/tasks/new" className="btn btn-primary">
              Create a Task
            </Link>
          ) : (
            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="task-list">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onDelete={handleDelete}
              completing={actionId === task.id && actionType === 'complete'}
              deleting={actionId === task.id && actionType === 'delete'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../api/tasks.js';
import { getErrorMessage } from '../api/axios.js';
import TaskForm from '../components/TaskForm.jsx';

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await tasksApi.getById(id);
        setTask(data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load this task.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data) {
    setError('');
    setSubmitting(true);
    try {
      await tasksApi.update(id, data);
      navigate('/tasks');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the task.'));
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading task…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Task</h1>
          <p className="page-subtitle">Update the details of this task.</p>
        </div>
        <Link to="/tasks" className="btn btn-outline">
          ← Back to Tasks
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {task ? (
        <div className="card">
          <TaskForm initialData={task} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Task" />
        </div>
      ) : (
        !error && <p className="empty-state">Task not found.</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasks.js';
import { getErrorMessage } from '../api/axios.js';
import TaskForm from '../components/TaskForm.jsx';

export default function CreateTask() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data) {
    setError('');
    setSubmitting(true);
    try {
      await tasksApi.create(data);
      navigate('/tasks');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the task.'));
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create Task</h1>
          <p className="page-subtitle">Add a new task to your list.</p>
        </div>
        <Link to="/tasks" className="btn btn-outline">
          ← Back to Tasks
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <TaskForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create Task" />
      </div>
    </div>
  );
}

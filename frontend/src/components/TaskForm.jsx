// Shared create/edit form. Used by CreateTask and EditTask pages.
// Fields per spec: title, description, due date, priority, status.
export default function TaskForm({ initialData = {}, onSubmit, submitting, submitLabel = 'Save Task' }) {
  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    onSubmit({
      title: form.get('title').trim(),
      description: form.get('description').trim(),
      dueDate: form.get('dueDate') || null,
      priority: form.get('priority'),
      status: form.get('status'),
    });
  }

  // Normalise a backend date (ISO datetime or date string) to yyyy-mm-dd
  // for the <input type="date"> value.
  const dueDateValue = initialData.dueDate ? String(initialData.dueDate).slice(0, 10) : '';

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={initialData.title || ''}
          placeholder="e.g. Complete project report"
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData.description || ''}
          placeholder="Add details about the task…"
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="dueDate">Due Date</label>
          <input id="dueDate" name="dueDate" type="date" defaultValue={dueDateValue} />
        </div>

        <div className="form-field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" defaultValue={initialData.priority || 'MEDIUM'}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initialData.status || 'TODO'}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

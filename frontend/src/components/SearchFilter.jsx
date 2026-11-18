// Search + filter + sort controls (spec Module 5).
// Filtering/sorting is done client-side in Tasks.jsx over the fetched
// task list, so it works even if the backend does not support query params.
export default function SearchFilter({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  dueDateFilter,
  onDueDateChange,
  sortBy,
  onSortChange,
  onClear,
}) {
  return (
    <div className="search-filter">
      <input
        type="search"
        className="search-input"
        placeholder="🔍 Search tasks by title…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search tasks by title"
      />

      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} aria-label="Filter by status">
        <option value="ALL">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>

      <select value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value)} aria-label="Filter by priority">
        <option value="ALL">All Priorities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      <input
        type="date"
        value={dueDateFilter}
        onChange={(e) => onDueDateChange(e.target.value)}
        aria-label="Filter by due date"
        title="Filter by due date"
      />

      <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} aria-label="Sort tasks">
        <option value="createdAt-desc">Newest first</option>
        <option value="createdAt-asc">Oldest first</option>
        <option value="dueDate-asc">Due date (earliest)</option>
        <option value="dueDate-desc">Due date (latest)</option>
        <option value="priority">Priority (High → Low)</option>
        <option value="title-asc">Title (A–Z)</option>
      </select>

      <button type="button" className="btn btn-outline btn-sm" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

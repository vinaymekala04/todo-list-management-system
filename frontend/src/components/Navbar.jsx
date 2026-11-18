import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        ✅ Todo List
      </Link>
      <nav className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
          My Tasks
        </NavLink>
        <NavLink to="/tasks/new" className={({ isActive }) => (isActive ? 'active' : '')}>
          + New Task
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          Profile
        </NavLink>
      </nav>
      <div className="navbar-user">
        <span className="navbar-user-name">{user?.name || user?.email || 'User'}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

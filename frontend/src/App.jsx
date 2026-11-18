import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import CreateTask from './pages/CreateTask.jsx';
import EditTask from './pages/EditTask.jsx';
import Profile from './pages/Profile.jsx';
import './App.css';

// Redirect to /login when there is no JWT token.
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Keep logged-in users out of the login/register pages.
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateTask />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditTask />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

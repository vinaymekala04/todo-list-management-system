import { useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // GET /api/users/profile — always refresh from the backend on mount.
  useEffect(() => {
    async function load() {
      try {
        const { data } = await authApi.getProfile();
        setProfile(data);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load your profile.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setUser]);

  async function handleChangePassword(event) {
    event.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(getErrorMessage(err, 'Could not change your password. Check your current password.'));
    } finally {
      setPwLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  if (loading) return <div className="page-loading">Loading profile…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="page-subtitle">View your account details and change your password.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {profile && (
        <div className="card profile-card">
          <h2>Account Details</h2>
          <dl className="profile-details">
            <div>
              <dt>Name</dt>
              <dd>{profile.name || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email || '—'}</dd>
            </div>
            {profile.createdAt && (
              <div>
                <dt>Member since</dt>
                <dd>{formatDate(profile.createdAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="card">
        <h2>Change Password</h2>
        {pwError && <div className="alert alert-error">{pwError}</div>}
        {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
        <form className="form" onSubmit={handleChangePassword}>
          <div className="form-field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="form-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwLoading}>
            {pwLoading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

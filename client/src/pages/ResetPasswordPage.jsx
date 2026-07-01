import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError(true);
      setMessage('Invalid reset link');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(true);
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError(true);
      setMessage('Password must be at least 6 characters');
      return;
    }
    try {
      await authAPI.resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || 'Reset failed');
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">My Music</h1>
          <div className="auth-message success">Password reset successful! Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">My Music</h1>
        <p className="auth-subtitle">Set a New Password</p>
        {!token ? (
          <div className="auth-message error">Invalid or missing reset token.</div>
        ) : (
          <form id="resetForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            {message && <div className={`auth-message ${error ? 'error' : 'success'}`}>{message}</div>}
            <button type="submit" className="btn-primary">Reset Password</button>
          </form>
        )}
        <div className="auth-footer"><Link to="/">Back to Login</Link></div>
      </div>
    </div>
  );
}

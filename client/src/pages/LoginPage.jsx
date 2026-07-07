import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await authAPI.login(email, password);
      login(res.data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || 'Connection error. Check if server is running.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">My Music</h1>
        <p className="auth-subtitle">Your Music, Your Playlists</p>
        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input id="loginPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {message && (
            <div className={`auth-message ${error ? 'error' : 'success'}`}>{message}</div>
          )}
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
        <div className="auth-footer">
          <Link to="/register">Create Account</Link>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}

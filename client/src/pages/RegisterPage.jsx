import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', petName: '', favoriteColor: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError(true);
      setMessage('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError(true);
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      await authAPI.register(form);
      setSuccess(true);
      setError(false);
      setMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">My Music</h1>
          <div className="auth-message success">{message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">My Music</h1>
        <p className="auth-subtitle">Create Your Account</p>
        <form id="registerForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" value={form.fullName} onChange={update('fullName')} required />
          </div>
          <div className="form-group">
            <label htmlFor="registerEmail">Email</label>
            <input id="registerEmail" type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div className="form-group">
            <label htmlFor="registerPassword">Password (min 6 chars)</label>
            <input id="registerPassword" type="password" value={form.password} onChange={update('password')} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required />
          </div>
          <div className="form-group">
            <label htmlFor="petName">What is your pet&apos;s name? (Security)</label>
            <input id="petName" type="text" value={form.petName} onChange={update('petName')} required />
          </div>
          <div className="form-group">
            <label htmlFor="favoriteColor">What is your favorite color? (Security)</label>
            <input id="favoriteColor" type="text" value={form.favoriteColor} onChange={update('favoriteColor')} required />
          </div>
          {message && <div className={`auth-message ${error ? 'error' : 'success'}`}>{message}</div>}
          <button type="submit" className="btn-primary">Create Account</button>
        </form>
        <div className="auth-footer">
          <Link to="/">Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}

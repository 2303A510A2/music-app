import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [favoriteColor, setFavoriteColor] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleGetQuestions = async (e) => {
    e.preventDefault();
    try {
      await authAPI.getSecurityQuestions(email);
      setStep(2);
      setMessage('');
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || 'Email not found');
    }
  };

  const handleVerifySecurity = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.verifySecurity(email, petName, favoriteColor);
      setResetToken(res.data.token);
      setStep(3);
      setMessage('');
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || 'Security answers do not match');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
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
      await authAPI.resetPassword(resetToken, newPassword, confirmPassword);
      setSuccess(true);
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
          <div className="auth-message success">Password reset successful!</div>
          <div className="auth-footer"><Link to="/">Go to Login</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h1 className="auth-title">My Music</h1>
        <p className="auth-subtitle">Reset Your Password</p>

        <div className="steps">
          {[1, 2, 3].map(s => (
            <span key={s} className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleGetQuestions}>
            <div className="form-group">
              <label htmlFor="forgotEmail">Email</label>
              <input id="forgotEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {message && <div className={`auth-message ${error ? 'error' : 'success'}`}>{message}</div>}
            <button type="submit" className="btn-primary">Next</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifySecurity}>
            <p style={{ color: '#b3b3b3', marginBottom: 16 }}>For: {email}</p>
            <div className="form-group">
              <label>What is your pet&apos;s name?</label>
              <input type="text" value={petName} onChange={e => setPetName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>What is your favorite color?</label>
              <input type="text" value={favoriteColor} onChange={e => setFavoriteColor(e.target.value)} required />
            </div>
            {message && <div className={`auth-message ${error ? 'error' : 'success'}`}>{message}</div>}
            <button type="submit" className="btn-primary">Verify</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
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

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authAPI } from '../services/api';

const COLOR_THEMES = [
  { color: '#1db954', label: 'Green' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#ef4444', label: 'Red' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#f97316', label: 'Orange' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#eab308', label: 'Yellow' }
];

const FONT_SIZES = [
  { key: 'small', label: 'Small', preview: 'Aa', className: 'font-size-preview-small' },
  { key: 'medium', label: 'Medium', preview: 'Aa', className: 'font-size-preview-medium' },
  { key: 'big', label: 'Big', preview: 'Aa', className: 'font-size-preview-big' }
];

export default function SettingsModal({ onClose }) {
  const { user } = useAuth();
  const { settings, updateSetting } = useSettings();
  const [view, setView] = useState('main');
  const [message, setMessage] = useState('');

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '90%', maxHeight: '85vh' }}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        {message && <div className="admin-toast">{message}</div>}
        {view === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="settings-item" onClick={() => setView('appearance')}>
              <span className="settings-item-icon">🎨</span>
              <span className="settings-item-label">Appearance</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="settings-item" onClick={() => setView('account')}>
              <span className="settings-item-icon">👤</span>
              <span className="settings-item-label">Account & Privacy</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="settings-item" onClick={() => setView('playback')}>
              <span className="settings-item-icon">▶️</span>
              <span className="settings-item-label">Playback</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="settings-item" onClick={() => setView('about')}>
              <span className="settings-item-icon">ℹ️</span>
              <span className="settings-item-label">About</span>
              <span className="settings-item-arrow">›</span>
            </div>
          </div>
        )}
        {view === 'appearance' && (
          <div>
            <div className="settings-back" onClick={() => setView('main')}>← Back</div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em' }}>Appearance</h4>
            <p className="settings-section-desc">Customize the look and feel of the app.</p>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 10 }}>MODE</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className={`settings-item ${settings.themeMode === 'dark' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => updateSetting('themeMode', 'dark')}>
                  <span style={{ fontSize: '1.2em' }}>🌙</span>
                  <span style={{ display: 'block', marginTop: 4 }}>Dark Mode</span>
                </div>
                <div className={`settings-item ${settings.themeMode === 'light' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => updateSetting('themeMode', 'light')}>
                  <span style={{ fontSize: '1.2em' }}>☀️</span>
                  <span style={{ display: 'block', marginTop: 4 }}>Light Mode</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 10 }}>THEME COLOR</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {COLOR_THEMES.map(t => (
                  <div key={t.color} className={`color-swatch ${settings.accentColor === t.color ? 'active' : ''}`} style={{ background: t.color, width: 36 }} onClick={() => updateSetting('accentColor', t.color)} title={t.label} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 10 }}>FONT SIZE</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {FONT_SIZES.map(fs => (
                  <div key={fs.key} className={`font-size-btn ${settings.fontSize === fs.key ? 'active' : ''}`} onClick={() => updateSetting('fontSize', fs.key)}>
                    <span className="font-size-label">{fs.label}</span>
                    <span className={`font-size-preview ${fs.className}`}>{fs.preview}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {view === 'account' && (
          <div>
            <div className="settings-back" onClick={() => setView('main')}>← Back</div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em' }}>Account & Privacy</h4>
            <p className="settings-section-desc">Manage your account settings.</p>
            <AccountSettings userId={user?.userId} showMsg={showMsg} />
          </div>
        )}
        {view === 'playback' && (
          <div>
            <div className="settings-back" onClick={() => setView('main')}>← Back</div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em' }}>Playback</h4>
            <p className="settings-section-desc">Audio quality and playback preferences.</p>
            <div className="settings-item" style={{ cursor: 'default', justifyContent: 'space-between' }}>
              <span className="settings-item-label">Audio Quality</span>
              <span style={{ color: '#b3b3b3' }}>High</span>
            </div>
            <div className="settings-item" style={{ cursor: 'default', justifyContent: 'space-between' }}>
              <span className="settings-item-label">Crossfade</span>
              <span style={{ color: '#b3b3b3' }}>Off</span>
            </div>
          </div>
        )}
        {view === 'about' && (
          <div>
            <div className="settings-back" onClick={() => setView('main')}>← Back</div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em' }}>About</h4>
            <p className="settings-section-desc">All about Music App.</p>
            <div className="acc-item" onClick={() => setView('help')}>
              <span className="settings-item-icon">🛠️</span>
              <span className="settings-item-label">Help & Support</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="acc-item" onClick={() => window.open('https://musicapp.example.com/rate', '_blank')}>
              <span className="settings-item-icon">⭐</span>
              <span className="settings-item-label">Rate App</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="acc-item" style={{ cursor: 'default' }}>
              <span className="settings-item-icon">📱</span>
              <span className="settings-item-label">App Version</span>
              <span style={{ color: 'var(--accent-color)', fontSize: '0.9em', fontWeight: 600 }}>1.0.0</span>
            </div>
            <div className="acc-item" onClick={() => setView('privacy')}>
              <span className="settings-item-icon">📄</span>
              <span className="settings-item-label">Privacy Policy</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="acc-item" onClick={() => setView('terms')}>
              <span className="settings-item-icon">📜</span>
              <span className="settings-item-label">Terms & Conditions</span>
              <span className="settings-item-arrow">›</span>
            </div>
            <div className="acc-item" onClick={() => setView('devInfo')}>
              <span className="settings-item-icon">👨‍💻</span>
              <span className="settings-item-label">Developer Info</span>
              <span className="settings-item-arrow">›</span>
            </div>
          </div>
        )}
        {view === 'help' && (
          <div>
            <div className="settings-back" onClick={() => setView('about')}>← Back</div>
            <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em' }}>Help & Support</h4>
            <p className="settings-section-desc">Get help with using Music App.</p>
            <div style={{ background: '#282828', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <p style={{ color: '#b3b3b3', marginBottom: 10 }}>Contact support at:</p>
              <a href="mailto:metebharath4@gmail.com" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>metebharath4@gmail.com</a>
            </div>
          </div>
        )}
        {view === 'privacy' && <PrivacyView onBack={() => setView('about')} />}
        {view === 'terms' && <TermsView onBack={() => setView('about')} />}
        {view === 'devInfo' && <DevInfoView onBack={() => setView('about')} />}
      </div>
    </div>
  );
}

function AccountSettings({ userId, showMsg }) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [panel, setPanel] = useState(null);

  const handleUpdateUsername = async () => {
    if (!username.trim()) { showMsg('Enter a username'); return; }
    try {
      await authAPI.updateUsername(userId, username.trim());
      showMsg('Username updated');
    } catch { showMsg('Failed to update username'); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { showMsg('Fill all fields'); return; }
    if (newPassword !== confirmPassword) { showMsg('Passwords do not match'); return; }
    try {
      await authAPI.changePassword(userId, currentPassword, newPassword, confirmPassword);
      showMsg('Password changed');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch { showMsg('Failed to change password'); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !emailPassword) { showMsg('Fill all fields'); return; }
    try {
      await authAPI.changeEmail(userId, newEmail.trim(), emailPassword);
      showMsg('Email changed');
      setNewEmail(''); setEmailPassword('');
    } catch { showMsg('Failed to change email'); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { showMsg('Enter your password'); return; }
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await authAPI.deleteAccount(userId, deletePassword);
      showMsg('Account deleted');
      setTimeout(() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }, 1000);
    } catch { showMsg('Failed to delete account'); }
  };

  return (
    <div>
      <div className={`acc-item ${panel === 'username' ? 'active' : ''}`} onClick={() => setPanel(panel === 'username' ? null : 'username')}>
        <span className="settings-item-icon">👤</span>
        <span className="settings-item-label">Change Username</span>
        <span className="settings-item-arrow">›</span>
      </div>
      {panel === 'username' && (
        <div style={{ padding: '12px 0' }}>
          <input className="account-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="New username" />
          <button className="timer-btn timer-custom-go" onClick={handleUpdateUsername} style={{ marginTop: 8, width: '100%' }}>Save</button>
        </div>
      )}
      <div className={`acc-item ${panel === 'password' ? 'active' : ''}`} onClick={() => setPanel(panel === 'password' ? null : 'password')}>
        <span className="settings-item-icon">🔑</span>
        <span className="settings-item-label">Change Password</span>
        <span className="settings-item-arrow">›</span>
      </div>
      {panel === 'password' && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="account-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" />
          <input className="account-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
          <input className="account-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          <button className="timer-btn timer-custom-go" onClick={handleChangePassword} style={{ width: '100%' }}>Save</button>
        </div>
      )}
      <div className={`acc-item ${panel === 'email' ? 'active' : ''}`} onClick={() => setPanel(panel === 'email' ? null : 'email')}>
        <span className="settings-item-icon">📧</span>
        <span className="settings-item-label">Change Email</span>
        <span className="settings-item-arrow">›</span>
      </div>
      {panel === 'email' && (
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="account-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email" />
          <input className="account-input" type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Current password" />
          <button className="timer-btn timer-custom-go" onClick={handleChangeEmail} style={{ width: '100%' }}>Save</button>
        </div>
      )}
      <div className={`acc-item ${panel === 'delete' ? 'active' : ''}`} onClick={() => setPanel(panel === 'delete' ? null : 'delete')} style={{ borderColor: '#ff4444' }}>
        <span className="settings-item-icon" style={{ color: '#ff4444' }}>🗑</span>
        <span className="settings-item-label" style={{ color: '#ff4444' }}>Delete Account</span>
        <span className="settings-item-arrow" style={{ color: '#ff4444' }}>›</span>
      </div>
      {panel === 'delete' && (
        <div style={{ padding: '12px 0' }}>
          <p style={{ color: '#ff4444', fontSize: '0.85em', marginBottom: 8 }}>This action is permanent and cannot be undone.</p>
          <input className="account-input" type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter password to confirm" />
          <button className="timer-btn" onClick={handleDeleteAccount} style={{ marginTop: 8, width: '100%', background: '#ff4444', color: '#fff' }}>Delete Account</button>
        </div>
      )}
    </div>
  );
}

function PrivacyView({ onBack }) {
  return (
    <div>
      <div className="settings-back" onClick={onBack}>← Back</div>
      <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em', textAlign: 'center' }}>Privacy Policy</h4>
      <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 16, textAlign: 'center' }}>Last Updated: June 2026</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: '1. Information We Collect', content: '• Name\n• Email Address\n• Profile Information' },
          { title: '2. How We Use Your Information', content: '• To create and manage your account.\n• To provide music streaming and playlist features.\n• To improve app performance and user experience.' },
          { title: '3. Data Security', content: 'We take reasonable measures to protect your personal information and account data.' },
          { title: '4. User Privacy', content: 'We do not sell, share, or misuse your personal information with third parties.' },
          { title: '5. Account Control', content: 'Users can update their profile information, change passwords, or delete their accounts at any time.' }
        ].map(section => (
          <div key={section.title} style={{ background: '#282828', borderRadius: 10, padding: '16px 20px' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8, textAlign: 'center', fontSize: '0.95em' }}>{section.title}</p>
            <p style={{ color: '#b3b3b3', fontSize: '0.85em', textAlign: 'center', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsView({ onBack }) {
  return (
    <div>
      <div className="settings-back" onClick={onBack}>← Back</div>
      <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em', textAlign: 'center' }}>Terms & Conditions</h4>
      <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 16, textAlign: 'center' }}>Last Updated: June 2026</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: '1. Acceptance of Terms', content: 'By using Music App, you agree to these terms and conditions.' },
          { title: '2. User Responsibilities', content: 'You are responsible for maintaining the confidentiality of your account and password.' },
          { title: '3. Intellectual Property', content: 'All content and materials available on Music App are protected by intellectual property laws.' },
          { title: '4. Limitation of Liability', content: 'Music App shall not be liable for any indirect, incidental, or consequential damages.' },
          { title: '5. Changes to Terms', content: 'We reserve the right to modify these terms at any time. Users will be notified of significant changes.' }
        ].map(section => (
          <div key={section.title} style={{ background: '#282828', borderRadius: 10, padding: '16px 20px' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8, textAlign: 'center', fontSize: '0.95em' }}>{section.title}</p>
            <p style={{ color: '#b3b3b3', fontSize: '0.85em', textAlign: 'center', lineHeight: 1.8 }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevInfoView({ onBack }) {
  return (
    <div>
      <div className="settings-back" onClick={onBack}>← Back</div>
      <h4 style={{ color: '#fff', marginBottom: 8, fontSize: '1.05em', textAlign: 'center' }}>Developer Info</h4>
      <div style={{ background: '#282828', borderRadius: 10, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '4em', marginBottom: 10 }}>👨‍💻</div>
        <p style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '1.1em', marginBottom: 4 }}>METE BHARATH</p>
        <p style={{ color: '#b3b3b3', fontSize: '0.9em', marginBottom: 16 }}>Full Stack Developer</p>
        <div style={{ borderTop: '1px solid #404040', paddingTop: 16 }}>
          <p style={{ color: '#b3b3b3', fontSize: '0.85em' }}>📧 metebharath4@gmail.com</p>
          <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginTop: 4 }}>Music Streaming Application v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

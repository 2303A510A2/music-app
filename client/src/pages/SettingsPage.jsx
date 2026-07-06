import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authAPI, playlistAPI } from '../services/api';

const TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 }
];

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
  { key: 'small', label: 'S' },
  { key: 'medium', label: 'M' },
  { key: 'big', label: 'L' }
];

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();

  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const [userData, setUserData] = useState(null);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('profilePic_' + (user?.userId || '')) || '');

  useEffect(() => {
    if (user?.userId) {
      authAPI.getUser(user.userId).then(res => setUserData(res.data)).catch(() => {});
    }
  }, [user]);

  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const [sleepTimer, setSleepTimer] = useState(() => parseInt(localStorage.getItem('sleepTimer') || '0'));
  const [showSleepModal, setShowSleepModal] = useState(false);
  const timerRef = useRef(null);

  const handleSetTimer = (minutes) => {
    setSleepTimer(minutes);
    localStorage.setItem('sleepTimer', minutes.toString());
    setShowSleepModal(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (minutes > 0) {
      showToast(`Sleep timer set for ${minutes} minutes`);
      timerRef.current = setTimeout(() => {
        showToast('Sleep timer ended — music stopped');
      }, minutes * 60 * 1000);
    } else {
      showToast('Sleep timer turned off');
    }
  };

  const [userPlaylists, setUserPlaylists] = useState([]);
  const [globalPlaylists, setGlobalPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renamingPlaylist, setRenamingPlaylist] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [addSongPlaylist, setAddSongPlaylist] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);

  const loadUserPlaylists = async () => {
    if (!user?.userId) return;
    try {
      const res = await playlistAPI.getUserPlaylists(user.userId);
      setUserPlaylists(res.data || []);
    } catch { setUserPlaylists([]); }
  };

  const loadGlobalPlaylists = async () => {
    try {
      const res = await playlistAPI.getGlobalPlaylists();
      setGlobalPlaylists(res.data || []);
    } catch { setGlobalPlaylists([]); }
  };

  useEffect(() => { loadUserPlaylists(); loadGlobalPlaylists(); }, [user]);

  const allSongs = [];
  const seenSongs = new Set();
  [...globalPlaylists, ...userPlaylists].forEach(pl => {
    (pl.songs || []).forEach(s => {
      if (!seenSongs.has(s.songName)) {
        seenSongs.add(s.songName);
        allSongs.push(s);
      }
    });
  });

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await playlistAPI.userCreate({ userId: user.userId, playlistName: newPlaylistName.trim() });
      setNewPlaylistName('');
      setShowCreateModal(false);
      await loadUserPlaylists();
      showToast('Playlist created');
    } catch { showToast('Failed to create playlist'); }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Delete this playlist and all its songs?')) return;
    try {
      await playlistAPI.userDelete({ userId: user.userId, playlistId });
      await loadUserPlaylists();
      setExpandedPlaylist(null);
      showToast('Playlist deleted');
    } catch { showToast('Failed to delete playlist'); }
  };

  const handleRenamePlaylist = async (playlistId, newName) => {
    if (!newName.trim()) { setRenamingPlaylist(null); return; }
    try {
      const oldPlaylist = userPlaylists.find(p => p._id === playlistId);
      if (!oldPlaylist) return;
      const createRes = await playlistAPI.userCreate({ userId: user.userId, playlistName: newName.trim() });
      const newPlaylistId = createRes.data.playlist._id;
      for (const song of oldPlaylist.songs || []) {
        try {
          await playlistAPI.userAddSong({
            userId: user.userId,
            playlistId: newPlaylistId,
            songName: song.songName,
            songUrl: song.songUrl,
            songImage: song.songImage || ''
          });
        } catch {}
      }
      await playlistAPI.userDelete({ userId: user.userId, playlistId });
      setRenamingPlaylist(null);
      await loadUserPlaylists();
      showToast('Playlist renamed');
    } catch { showToast('Failed to rename playlist'); }
  };

  const handleAddSong = async () => {
    if (!selectedSong || !addSongPlaylist) return;
    try {
      await playlistAPI.userAddSong({
        userId: user.userId,
        playlistId: addSongPlaylist._id,
        songName: selectedSong.songName,
        songUrl: selectedSong.songUrl,
        songImage: selectedSong.songImage || ''
      });
      setShowAddSongModal(false);
      setSelectedSong(null);
      setAddSongPlaylist(null);
      await loadUserPlaylists();
      showToast(`"${selectedSong.songName}" added`);
    } catch { showToast('Failed to add song'); }
  };

  const handleRemoveSong = async (playlistId, songName) => {
    if (!confirm(`Remove "${songName}" from this playlist?`)) return;
    try {
      await playlistAPI.userRemoveSong({ userId: user.userId, playlistId, songName });
      await loadUserPlaylists();
      showToast(`"${songName}" removed`);
    } catch { showToast('Failed to remove song'); }
  };

  const handleDeleteAllPlaylists = async () => {
    if (!confirm('Delete ALL your personal playlists? This cannot be undone.')) return;
    if (!confirm('Are you sure? All playlists and songs will be permanently deleted.')) return;
    try {
      for (const pl of userPlaylists) {
        await playlistAPI.userDelete({ userId: user.userId, playlistId: pl._id });
      }
      await loadUserPlaylists();
      showToast('All personal playlists deleted');
    } catch { showToast('Failed to delete playlists'); }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [showProfilePicPicker, setShowProfilePicPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePic(dataUrl);
      localStorage.setItem('profilePic_' + user.userId, dataUrl);
      setShowProfilePicPicker(false);
      showToast('Profile picture updated');
    };
    reader.readAsDataURL(file);
  };

  const accountSections = [
    {
      key: 'password',
      icon: '🔑',
      label: 'Change Password',
      render: () => {
        const [current, setCurrent] = useState('');
        const [newPwd, setNewPwd] = useState('');
        const [confirm, setConfirm] = useState('');
        const handleSubmit = async () => {
          if (!current || !newPwd || !confirm) { showToast('Fill all fields'); return; }
          if (newPwd !== confirm) { showToast('Passwords do not match'); return; }
          try {
            await authAPI.changePassword(user.userId, current, newPwd, confirm);
            showToast('Password changed');
            setCurrent(''); setNewPwd(''); setConfirm('');
          } catch { showToast('Failed to change password'); }
        };
        return (
          <div className="st-acc-form">
            <input className="st-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current password" />
            <input className="st-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password" />
            <input className="st-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" />
            <button className="st-btn st-btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        );
      }
    },
    {
      key: 'profilepic',
      icon: '🖼️',
      label: 'Change Profile Picture',
      render: () => (
        <div className="st-acc-form">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: 'none' }} />
          <button className="st-btn st-btn-primary" onClick={() => fileInputRef.current?.click()}>Choose Image</button>
          {profilePic && <button className="st-btn st-btn-danger" onClick={() => { setProfilePic(''); localStorage.removeItem('profilePic_' + user.userId); showToast('Profile picture removed'); }} style={{ marginTop: 8 }}>Remove</button>}
        </div>
      )
    },
    {
      key: 'username',
      icon: '👤',
      label: 'Change Username',
      render: () => {
        const [name, setName] = useState(user?.fullName || '');
        const handleSubmit = async () => {
          if (!name.trim()) { showToast('Enter a username'); return; }
          try {
            const res = await authAPI.updateUsername(user.userId, name.trim());
            updateProfile({ fullName: res.data.fullName || name.trim() });
            showToast('Username updated');
          } catch { showToast('Failed to update username'); }
        };
        return (
          <div className="st-acc-form">
            <input className="st-input" value={name} onChange={e => setName(e.target.value)} placeholder="New username" />
            <button className="st-btn st-btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        );
      }
    },
    {
      key: 'email',
      icon: '📧',
      label: 'Update Email',
      render: () => {
        const [newEmail, setNewEmail] = useState('');
        const [emailPwd, setEmailPwd] = useState('');
        const handleSubmit = async () => {
          if (!newEmail.trim() || !emailPwd) { showToast('Fill all fields'); return; }
          try {
            const res = await authAPI.changeEmail(user.userId, newEmail.trim(), emailPwd);
            updateProfile({ email: res.data.email || newEmail.trim() });
            showToast('Email updated');
            setNewEmail(''); setEmailPwd('');
          } catch { showToast('Failed to update email'); }
        };
        return (
          <div className="st-acc-form">
            <input className="st-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email" />
            <input className="st-input" type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} placeholder="Current password" />
            <button className="st-btn st-btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        );
      }
    }
  ];

  const [expandedAcc, setExpandedAcc] = useState(null);

  const handleHelpSupport = () => {
    window.location.href = 'mailto:metebharath4@gmail.com';
  };

  const handleRateApp = () => {
    window.open('https://musicapp.example.com/rate', '_blank');
  };

  if (!user) return null;

  return (
    <div className="st-page">
      <div className="st-header">
        <button className="st-back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1 className="st-heading">⚙️ Settings</h1>
      </div>

      <div className="st-content">
        {/* Profile Card */}
        <div className="st-profile-card">
          <div className="st-profile-avatar-wrapper">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="st-profile-avatar" />
            ) : (
              <div className="st-profile-avatar st-profile-avatar-default">👤</div>
            )}
          </div>
          <div className="st-profile-info">
            <h2 className="st-profile-name">{user?.fullName || 'User'}</h2>
            <p className="st-profile-email">{user?.email || ''}</p>
            {joinedDate && <p className="st-profile-joined">Joined {joinedDate}</p>}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="st-sections">
          {/* Sleep Timer */}
          <div className="st-section">
            <div className="st-section-header" onClick={() => setShowSleepModal(true)}>
              <span className="st-section-icon">⏰</span>
              <div className="st-section-header-text">
                <span className="st-section-title">Sleep Timer</span>
                <span className="st-section-subtitle">{sleepTimer === 0 ? 'Off' : `${sleepTimer} minutes`}</span>
              </div>
              <span className="st-section-arrow">›</span>
            </div>
          </div>

          {/* Playlist Management */}
          <div className="st-section">
            <div className="st-section-header" onClick={() => setActiveSection(activeSection === 'playlists' ? null : 'playlists')}>
              <span className="st-section-icon">🎵</span>
              <div className="st-section-header-text">
                <span className="st-section-title">Playlist Management</span>
                <span className="st-section-subtitle">{userPlaylists.length} personal playlist{userPlaylists.length !== 1 ? 's' : ''}</span>
              </div>
              <span className={`st-section-arrow ${activeSection === 'playlists' ? 'st-arrow-open' : ''}`}>›</span>
            </div>
            {activeSection === 'playlists' && (
              <div className="st-section-body">
                <button className="st-btn st-btn-primary st-btn-block" onClick={() => setShowCreateModal(true)}>+ Create Playlist</button>
                {userPlaylists.length === 0 ? (
                  <p className="st-empty-text">No personal playlists yet.</p>
                ) : (
                  <div className="st-playlist-list">
                    {userPlaylists.map(pl => (
                      <div key={pl._id} className="st-playlist-item">
                        <div className="st-playlist-item-header">
                          {renamingPlaylist === pl._id ? (
                            <div className="st-rename-row">
                              <input className="st-input st-rename-input" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRenamePlaylist(pl._id, renameValue); if (e.key === 'Escape') setRenamingPlaylist(null); }} autoFocus />
                              <button className="st-btn st-btn-sm st-btn-primary" onClick={() => handleRenamePlaylist(pl._id, renameValue)}>Save</button>
                              <button className="st-btn st-btn-sm" onClick={() => setRenamingPlaylist(null)}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <span className="st-playlist-name">{pl.playlistName}</span>
                              <span className="st-playlist-count">{pl.songs?.length || 0} songs</span>
                            </>
                          )}
                        </div>
                        {renamingPlaylist !== pl._id && (
                          <div className="st-playlist-actions">
                            <button className="st-btn st-btn-sm" onClick={() => { setRenamingPlaylist(pl._id); setRenameValue(pl.playlistName); }}>✏️ Rename</button>
                            <button className="st-btn st-btn-sm" onClick={() => { setAddSongPlaylist(pl); setSelectedSong(null); setShowAddSongModal(true); }}>➕ Add Song</button>
                            <button className="st-btn st-btn-sm" onClick={() => setExpandedPlaylist(expandedPlaylist === pl._id ? null : pl._id)}>
                              {expandedPlaylist === pl._id ? '▲ Hide' : '▼ Show Songs'}
                            </button>
                            <button className="st-btn st-btn-sm st-btn-danger" onClick={() => handleDeletePlaylist(pl._id)}>🗑 Delete</button>
                          </div>
                        )}
                        {expandedPlaylist === pl._id && (
                          <div className="st-playlist-songs">
                            {(!pl.songs || pl.songs.length === 0) ? (
                              <p className="st-empty-text">No songs in this playlist.</p>
                            ) : (
                              pl.songs.map((s, i) => (
                                <div key={i} className="st-song-row">
                                  <span className="st-song-name">{s.songName}</span>
                                  <button className="st-btn st-btn-sm st-btn-danger" onClick={() => handleRemoveSong(pl._id, s.songName)}>✕</button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="st-section">
            <div className="st-section-header" onClick={() => setActiveSection(activeSection === 'appearance' ? null : 'appearance')}>
              <span className="st-section-icon">🎨</span>
              <div className="st-section-header-text">
                <span className="st-section-title">Appearance</span>
                <span className="st-section-subtitle">{settings.themeMode === 'dark' ? 'Dark' : settings.themeMode === 'light' ? 'Light' : 'System'} theme</span>
              </div>
              <span className={`st-section-arrow ${activeSection === 'appearance' ? 'st-arrow-open' : ''}`}>›</span>
            </div>
            {activeSection === 'appearance' && (
              <div className="st-section-body">
                <div className="st-appearance-group">
                  <p className="st-label">Theme</p>
                  <div className="st-theme-row">
                    {['dark', 'light', 'system'].map(mode => (
                      <button key={mode} className={`st-theme-btn ${settings.themeMode === mode ? 'active' : ''}`} onClick={() => updateSetting('themeMode', mode)}>
                        {mode === 'dark' ? '🌙 Dark' : mode === 'light' ? '☀️ Light' : '💻 System'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="st-appearance-group">
                  <p className="st-label">Accent Color</p>
                  <div className="st-color-row">
                    {COLOR_THEMES.map(t => (
                      <div key={t.color} className={`st-color-swatch ${settings.accentColor === t.color ? 'active' : ''}`} style={{ background: t.color }} onClick={() => updateSetting('accentColor', t.color)} title={t.label} />
                    ))}
                  </div>
                </div>
                <div className="st-appearance-group">
                  <p className="st-label">Font Size</p>
                  <div className="st-font-row">
                    {FONT_SIZES.map(fs => (
                      <button key={fs.key} className={`st-font-btn ${settings.fontSize === fs.key ? 'active' : ''}`} onClick={() => updateSetting('fontSize', fs.key)}>
                        <span className={`st-font-preview st-font-preview-${fs.key}`}>Aa</span>
                        <span className="st-font-label">{fs.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="st-appearance-group">
                  <p className="st-label">Compact Mode</p>
                  <div className="st-toggle-row">
                    <span className="st-toggle-text">Reduce spacing and padding</span>
                    <label className="st-toggle">
                      <input type="checkbox" checked={settings.compactMode} onChange={e => updateSetting('compactMode', e.target.checked)} />
                      <span className="st-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account & Privacy */}
          <div className="st-section">
            <div className="st-section-header" onClick={() => setActiveSection(activeSection === 'account' ? null : 'account')}>
              <span className="st-section-icon">🔒</span>
              <div className="st-section-header-text">
                <span className="st-section-title">Account & Privacy</span>
                <span className="st-section-subtitle">Manage your account settings</span>
              </div>
              <span className={`st-section-arrow ${activeSection === 'account' ? 'st-arrow-open' : ''}`}>›</span>
            </div>
            {activeSection === 'account' && (
              <div className="st-section-body">
                {accountSections.map(s => (
                  <div key={s.key} className="st-acc-item">
                    <div className="st-acc-item-header" onClick={() => setExpandedAcc(expandedAcc === s.key ? null : s.key)}>
                      <span className="st-acc-icon">{s.icon}</span>
                      <span className="st-acc-label">{s.label}</span>
                      <span className={`st-section-arrow ${expandedAcc === s.key ? 'st-arrow-open' : ''}`}>›</span>
                    </div>
                    {expandedAcc === s.key && <div className="st-acc-body">{s.render()}</div>}
                  </div>
                ))}
                <div className="st-acc-item">
                  <div className="st-acc-item-header" onClick={handleLogout}>
                    <span className="st-acc-icon">🚪</span>
                    <span className="st-acc-label">Logout From Current Device</span>
                    <span className="st-section-arrow">›</span>
                  </div>
                </div>
                <div className="st-acc-item" style={{ borderColor: '#ef4444' }}>
                  <div className="st-acc-item-header" onClick={handleDeleteAllPlaylists}>
                    <span className="st-acc-icon" style={{ color: '#ef4444' }}>🗑</span>
                    <span className="st-acc-label" style={{ color: '#ef4444' }}>Delete My Personal Playlists</span>
                    <span className="st-section-arrow" style={{ color: '#ef4444' }}>›</span>
                  </div>
                </div>
                <div className="st-acc-item" onClick={() => setActiveSection('privacy')}>
                  <div className="st-acc-item-header">
                    <span className="st-acc-icon">📄</span>
                    <span className="st-acc-label">Privacy Policy</span>
                    <span className="st-section-arrow">›</span>
                  </div>
                </div>
                <div className="st-acc-item" onClick={() => setActiveSection('terms')}>
                  <div className="st-acc-item-header">
                    <span className="st-acc-icon">📜</span>
                    <span className="st-acc-label">Terms & Conditions</span>
                    <span className="st-section-arrow">›</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* About */}
          <div className="st-section">
            <div className="st-section-header" onClick={() => setActiveSection(activeSection === 'about' ? null : 'about')}>
              <span className="st-section-icon">ℹ️</span>
              <div className="st-section-header-text">
                <span className="st-section-title">About</span>
                <span className="st-section-subtitle">App info and support</span>
              </div>
              <span className={`st-section-arrow ${activeSection === 'about' ? 'st-arrow-open' : ''}`}>›</span>
            </div>
            {activeSection === 'about' && (
              <div className="st-section-body">
                <div className="st-about-card">
                  <div className="st-about-row"><span className="st-about-label">App Name</span><span className="st-about-value">My Music</span></div>
                  <div className="st-about-row"><span className="st-about-label">Version</span><span className="st-about-value">1.0.0</span></div>
                  <div className="st-about-row"><span className="st-about-label">Developer</span><span className="st-about-value">METE BHARATH</span></div>
                  <div className="st-about-row"><span className="st-about-label">Email</span><span className="st-about-value">metebharath4@gmail.com</span></div>
                </div>
                <div className="st-about-card">
                  <p className="st-label">Features</p>
                  <ul className="st-feature-list">
                    <li>• Cloudinary Music Streaming</li>
                    <li>• Playlist Management</li>
                    <li>• Favorites</li>
                    <li>• Search</li>
                    <li>• Responsive UI</li>
                  </ul>
                </div>
                <div className="st-about-buttons">
                  <button className="st-btn st-btn-primary st-btn-block" onClick={handleHelpSupport}>🛠️ Help & Support</button>
                  <button className="st-btn st-btn-primary st-btn-block" onClick={handleRateApp}>⭐ Rate App</button>
                  <button className="st-btn st-btn-primary st-btn-block" onClick={() => setActiveSection('privacy')}>📄 Privacy Policy</button>
                  <button className="st-btn st-btn-primary st-btn-block" onClick={() => setActiveSection('terms')}>📜 Terms</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleep Timer Modal */}
      {showSleepModal && (
        <div className="modal-overlay" onClick={() => setShowSleepModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>⏰ Sleep Timer</h3>
              <button className="modal-close-btn" onClick={() => setShowSleepModal(false)}>×</button>
            </div>
            <p style={{ color: '#b3b3b3', fontSize: '0.9em', marginBottom: 16 }}>Automatically stop music after the selected time.</p>
            <div className="timer-presets" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIMER_OPTIONS.map(opt => (
                <button key={opt.value} className={`timer-btn ${sleepTimer === opt.value ? 'active' : ''}`} onClick={() => handleSetTimer(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Playlist</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div style={{ padding: '4px 0' }}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: 12 }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: 4, fontSize: '0.85em' }}>Playlist Name</label>
                <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()} placeholder="Enter playlist name" style={{ padding: 10, borderRadius: 6, border: '1px solid #404040', background: '#333', color: '#fff', boxSizing: 'border-box', width: '100%', fontSize: '1em' }} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="timer-btn" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button className="timer-btn timer-custom-go" onClick={handleCreatePlaylist} style={{ flex: 1, padding: 10 }}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="modal-overlay" onClick={() => { setShowAddSongModal(false); setSelectedSong(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Add Song to "{addSongPlaylist?.playlistName}"</h3>
              <button className="modal-close-btn" onClick={() => { setShowAddSongModal(false); setSelectedSong(null); }}>×</button>
            </div>
            {allSongs.length === 0 ? (
              <p className="no-results" style={{ fontSize: '1em', padding: '20px' }}>No existing songs found in the system.</p>
            ) : (
              <>
                <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 12 }}>Select a song to add:</p>
                <div className="playlist-picker-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {allSongs.map((s, i) => (
                    <div key={i} className={`playlist-picker-item ${selectedSong?.songName === s.songName ? 'active' : ''}`} onClick={() => setSelectedSong(s)}
                      style={selectedSong?.songName === s.songName ? { background: 'var(--accent-color)', color: '#000', borderColor: 'var(--accent-color)' } : {}}>
                      {s.songName}
                    </div>
                  ))}
                </div>
                <button className="timer-btn timer-custom-go" onClick={handleAddSong} style={{ width: '100%', marginTop: 12 }} disabled={!selectedSong}>
                  Add to Playlist
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Privacy Policy View */}
      {activeSection === 'privacy' && (
        <div className="modal-overlay" onClick={() => setActiveSection(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Privacy Policy</h3>
              <button className="modal-close-btn" onClick={() => setActiveSection(null)}>×</button>
            </div>
            <PrivacyContent />
          </div>
        </div>
      )}

      {/* Terms View */}
      {activeSection === 'terms' && (
        <div className="modal-overlay" onClick={() => setActiveSection(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Terms & Conditions</h3>
              <button className="modal-close-btn" onClick={() => setActiveSection(null)}>×</button>
            </div>
            <TermsContent />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function PrivacyContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 8, textAlign: 'center' }}>Last Updated: June 2026</p>
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
  );
}

function TermsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: '#b3b3b3', fontSize: '0.85em', marginBottom: 8, textAlign: 'center' }}>Last Updated: June 2026</p>
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
  );
}

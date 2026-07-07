import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, playlistAPI } from '../services/api';
import Navbar from '../components/Navbar';
import NowPlaying from '../components/Player/NowPlaying';
import ContactModal from '../components/ContactModal';
import AdminPanel from '../components/AdminPanel';
import SettingsModal from '../components/SettingsModal';

const FIXED_FIRST = ['Telugu', 'English', 'Hindi', 'Folk'];
const ALWAYS_LAST = ['Devotion', "BGM's"];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalPlaylists, setGlobalPlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isAdmin = user?.isAdmin || user?.adminStatus === 'approved' || user?.adminStatus === 'leader';

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    authAPI.getUser(user.userId)
      .then(res => setUserName(res.data.fullName))
      .catch(() => {});
    loadPlaylists();
    loadRecentSongs();
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedPlaylist) return;
    const handlePopState = () => { goHome(); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      const res = await playlistAPI.getGlobalPlaylists();
      setGlobalPlaylists(res.data || []);
    } catch { setGlobalPlaylists([]); }
    if (user) {
      try {
        const res = await playlistAPI.getUserPlaylists(user.userId);
        setUserPlaylists(res.data || []);
      } catch { setUserPlaylists([]); }
    }
  };

  const loadRecentSongs = () => {
    try {
      const key = user ? `recentSongsHistory_${user.userId}` : 'recentSongsHistory';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSongs(Array.isArray(parsed) ? parsed : []);
      }
    } catch { setRecentSongs([]); }
  };

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('adminStatus');
    localStorage.removeItem('token');
    localStorage.removeItem('recentSongsHistory');
    sessionStorage.clear();
    logout();
    navigate('/');
  };

  const openPlaylist = (playlistName) => {
    const merged = buildDisplayList();
    const pl = merged.find(p => p.playlistName === playlistName);
    setSelectedPlaylist(playlistName);
    setSongs(pl ? (pl.songs || []) : []);
  };

  const goHome = () => {
    setSelectedPlaylist(null);
    setSongs([]);
  };

  const buildDisplayList = () => {
    const map = {};
    globalPlaylists.forEach(p => { map[p.playlistName] = p; });
    userPlaylists.forEach(p => {
      if (!map[p.playlistName]) map[p.playlistName] = p;
    });
    const result = [];
    const seen = new Set();

    FIXED_FIRST.forEach(name => {
      result.push({
        ...map[name],
        playlistName: name,
        songs: map[name]?.songs || [],
        coverImage: map[name]?.coverImage || '',
        isGlobal: true
      });
      seen.add(name);
    });

    globalPlaylists.forEach(p => {
      if (!seen.has(p.playlistName) && !ALWAYS_LAST.includes(p.playlistName)) {
        result.push(p);
        seen.add(p.playlistName);
      }
    });

    ALWAYS_LAST.forEach(name => {
      result.push({
        ...map[name],
        playlistName: name,
        songs: map[name]?.songs || [],
        coverImage: map[name]?.coverImage || '',
        isGlobal: true
      });
      seen.add(name);
    });

    userPlaylists.forEach(p => {
      if (!seen.has(p.playlistName)) {
        result.push(p);
        seen.add(p.playlistName);
      }
    });
    return result;
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      if (isAdmin) {
        await playlistAPI.adminCreate({ adminEmail: user.email, playlistName: newPlaylistName.trim() });
      } else {
        await playlistAPI.userCreate({ userId: user.userId, playlistName: newPlaylistName.trim() });
      }
      setNewPlaylistName('');
      setShowCreateDialog(false);
      await loadPlaylists();
    } catch (err) {
      console.error('Failed to create playlist');
    }
  };

  if (!user) return null;

  const displayPlaylists = buildDisplayList();

  return (
    <div className="dashboard">
      <Navbar onLogout={handleLogout} userName={userName} onOpenAdmin={() => setShowAdmin(true)} onOpenSettings={() => setShowSettings(true)} />
      <div className="main-container">
        {!selectedPlaylist ? (
          <>
            <div className="welcome-section">
              <h2>Welcome, {userName || user.fullName}</h2>
            </div>

            {recentSongs.length > 0 && (
              <div className="recent-section">
                <h2>Recents</h2>
                <div className="recent-songs-queue">
                  {recentSongs.map((song, idx) => (
                    <div key={idx} className="recent-song-box" title={song}>{song}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="playlist-section">
              <h2>Songs</h2>
              <div className="playlist-container">
                {displayPlaylists.map(p => (
                  <div key={p.playlistName} className="playlist" onClick={() => openPlaylist(p.playlistName)}>
                    {p.coverImage ? (
                      <img src={p.coverImage} alt={p.playlistName} />
                    ) : (
                      <div className="custom-playlist-img">🎵</div>
                    )}
                    <div className="playlist-title">{p.playlistName}</div>
                  </div>
                ))}
                <div className="create-playlist" onClick={() => setShowCreateDialog(true)}>
                  <div className="create-playlist-content">
                    <span className="create-playlist-icon">+</span>
                    <span className="create-playlist-text">Create Playlist</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div id="songsSection">
            <div className="songs-header">
              <button className="btn-back" onClick={goHome}>← Back to Playlists</button>
              <h2>{selectedPlaylist}</h2>
            </div>
            <div className="song-list">
              {songs.length === 0 ? (
                <div className="no-results">No songs yet. Admin can add songs.</div>
              ) : (
                songs.map((song, idx) => (
                  <div key={idx} className="song-wrapper">
                    <div className="song">{song.songName}</div>
                    <button className="song-dots">⋮</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="developer-section">
          <div className="developer-card">
            <div className="dev-icon">👨‍💻</div>
            <h2>Developer Information</h2>
            <div className="dev-content">
              <p><span className="dev-label">Name</span><br /><span className="dev-value">METE BHARATH</span></p>
              <p><span className="dev-label">Role</span><br /><span className="dev-value">Full Stack Developer</span></p>
              <p><span className="dev-label">Project</span><br /><span className="dev-value">Music Streaming Application</span></p>
              <p>
                <span className="dev-label">Technologies Used</span><br />
                <span className="dev-value">
                  • React.js<br />
                  • Node.js<br />
                  • Express.js<br />
                  • MongoDB<br />
                  • HTML<br />
                  • CSS<br />
                  • JavaScript
                </span>
              </p>
              <p>
                <span className="dev-label">Features Developed</span><br />
                <span className="dev-value">
                  • User Authentication<br />
                  • Music Player<br />
                  • Playlists<br />
                  • Favorites<br />
                  • Search Songs<br />
                  • Settings Page<br />
                  • Privacy Policy<br />
                  • Terms &amp; Conditions
                </span>
              </p>
              <p><span className="dev-label">Contact</span><br /><a href="mailto:metebharath4@gmail.com" className="dev-value" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>📧 metebharath4@gmail.com</a></p>
              <p><span className="dev-label">Version</span><br /><span className="dev-value">1.0.0</span></p>
            </div>
            <div className="dev-footer">
              <p style={{ marginBottom: 12 }}>Thank you for using Music App!</p>
              <button className="btn-primary" onClick={() => setShowContact(true)} style={{ maxWidth: 250, margin: '0 auto' }}>📧 Contact Us</button>
            </div>
          </div>
        </div>
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Playlist</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateDialog(false)}>×</button>
            </div>
            <div style={{ padding: '4px 0' }}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: 12 }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: 4, fontSize: '0.85em' }}>Playlist Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Enter playlist name"
                  style={{ padding: 10, borderRadius: 6, border: '1px solid #404040', background: '#333', color: '#fff', boxSizing: 'border-box', width: '100%', fontSize: '1em' }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="timer-btn" onClick={() => setShowCreateDialog(false)} style={{ flex: 1, padding: 10 }}>Cancel</button>
                <button className="timer-btn timer-custom-go" onClick={handleCreatePlaylist} style={{ flex: 1, padding: 10 }}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      <NowPlaying />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, playlistAPI } from '../services/api';
import Navbar from '../components/Navbar';
import NowPlaying from '../components/Player/NowPlaying';
import ContactModal from '../components/ContactModal';
import AdminPanel from '../components/AdminPanel';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    authAPI.getUser(user.userId)
      .then(res => setUserName(res.data.fullName))
      .catch(() => {});
    playlistAPI.getGlobalPlaylists()
      .then(res => setPlaylists(res.data))
      .catch(() => {});
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <Navbar onLogout={handleLogout} userName={userName} onOpenAdmin={() => setShowAdmin(true)} />
      <div className="main-container">
        <div className="welcome-section">
          <h2>Welcome, {userName || user.fullName}</h2>
        </div>
        <div className="playlist-section">
          <h2>Playlists</h2>
          <div className="playlist-grid">
            {playlists.map(p => (
              <div key={p._id} className="playlist-card">
                {p.coverImage && (
                  <img
                    src={p.coverImage}
                    alt={p.playlistName}
                    className="playlist-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="playlist-info">
                  <h3>{p.playlistName}</h3>
                  <p className="playlist-songs-count">{p.songs?.length || 0} songs</p>
                  {p.createdByAdmin && <span className="admin-badge">Admin</span>}
                </div>
              </div>
            ))}
            <div className="playlist-card create-card" onClick={() => {}}>
              <span className="create-icon">+</span>
              <p>Create Playlist</p>
            </div>
          </div>
        </div>

        {/* 👨‍💻 Developer Information */}
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
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      <NowPlaying />
    </div>
  );
}

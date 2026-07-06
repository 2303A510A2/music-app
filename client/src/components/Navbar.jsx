import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ userName, onLogout, onOpenAdmin, onOpenSettings }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || (user?.adminStatus && user?.adminStatus !== 'none');

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('/dashboard')}>
        🎵 My Music
      </div>
      <div className="nav-search">
        <input
          type="text"
          id="searchInput"
          placeholder="Search songs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="nav-actions">
        <button className="nav-btn" title="Favorites">❤</button>
        <button className="nav-btn" title="Settings" onClick={onOpenSettings}>⚙</button>
        {isAdmin && <button className="nav-btn admin-btn" title="Admin Panel" onClick={onOpenAdmin}>🛠</button>}
        <button className="nav-btn" title="Logout" onClick={onLogout}>🚪</button>
      </div>
    </nav>
  );
}

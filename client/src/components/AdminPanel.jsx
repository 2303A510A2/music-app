import { useState, useEffect } from 'react';
import { playlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel({ onClose }) {
  const { user } = useAuth();
  const isLeader = user?.adminStatus === 'leader';

  const [playlists, setPlaylists] = useState([]);

  const [view, setView] = useState('menu');

  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [songName, setSongName] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [songImage, setSongImage] = useState('');
  const [useFile, setUseFile] = useState(false);

  const [removeSongName, setRemoveSongName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const res = await playlistAPI.getGlobalPlaylists();
      setPlaylists(res.data);
    } catch {
      setPlaylists([]);
    }
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) { showMsg('Enter a playlist name'); return; }
    try {
      await playlistAPI.adminCreate({ adminEmail: user.email, playlistName: newPlaylistName.trim() });
      showMsg('Playlist created');
      setNewPlaylistName('');
      await loadPlaylists();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await playlistAPI.adminDelete({ adminEmail: user.email, playlistId });
      showMsg('Playlist deleted');
      await loadPlaylists();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddSongUrl = async () => {
    if (!selectedPlaylist || !songName.trim()) { showMsg('Select playlist and enter song name'); return; }
    if (!songUrl.trim()) { showMsg('Enter a song URL'); return; }
    try {
      await playlistAPI.adminAddSongUrl({
        adminEmail: user.email,
        playlistId: selectedPlaylist,
        songName: songName.trim(),
        songUrl: songUrl.trim(),
        songImage: songImage.trim() || undefined
      });
      showMsg('Song added');
      setSongName(''); setSongUrl(''); setSongImage('');
      await loadPlaylists();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add song');
    }
  };

  const handleAddSongFile = async () => {
    if (!selectedPlaylist || !songName.trim()) { showMsg('Select playlist and enter song name'); return; }
    if (!songFile) { showMsg('Select an MP3 file'); return; }
    const formData = new FormData();
    formData.append('adminEmail', user.email);
    formData.append('playlistId', selectedPlaylist);
    formData.append('songName', songName.trim());
    formData.append('file', songFile);
    if (songImage.trim()) formData.append('songImage', songImage.trim());
    try {
      await playlistAPI.adminAddSong(formData);
      showMsg('Song added');
      setSongName(''); setSongUrl(''); setSongFile(null); setSongImage('');
      await loadPlaylists();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add song');
    }
  };

  const handleRemoveSong = async () => {
    if (!selectedPlaylist || !removeSongName) { showMsg('Select playlist and song'); return; }
    try {
      await playlistAPI.adminRemoveSong({
        adminEmail: user.email,
        playlistId: selectedPlaylist,
        songName: removeSongName
      });
      showMsg('Song removed');
      setRemoveSongName('');
      await loadPlaylists();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to remove');
    }
  };

  const selectedPlaylistData = playlists.find(p => p._id === selectedPlaylist);

  if (!user?.isAdmin && user?.adminStatus === 'none') {
    return <div className="admin-panel"><p style={{ color: '#b3b3b3' }}>Admin access required.</p></div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button className="admin-close-btn" onClick={onClose}>✕</button>
      </div>

      {message && <div className="admin-toast">{message}</div>}

      {view === 'menu' && (
        <div className="admin-menu">
          <button className="admin-menu-btn" onClick={() => setView('create')}>+ Create Playlist</button>
          <button className="admin-menu-btn" onClick={() => { setView('add'); loadPlaylists(); }}>Add Song</button>
          <button className="admin-menu-btn" onClick={() => { setView('remove'); loadPlaylists(); }}>Remove Song</button>
          <button className="admin-menu-btn" onClick={() => { setView('manage'); loadPlaylists(); }}>Manage Playlists</button>
        </div>
      )}

      {view === 'create' && (
        <div className="admin-form">
          <h3>Create Global Playlist</h3>
          <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="Playlist name" />
          <div className="admin-form-actions">
            <button className="admin-btn" onClick={handleCreatePlaylist}>Create</button>
            <button className="admin-btn secondary" onClick={() => setView('menu')}>Back</button>
          </div>
        </div>
      )}

      {view === 'add' && (
        <div className="admin-form">
          <h3>Add Song to Playlist</h3>
          <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)}>
            <option value="">Select playlist</option>
            {playlists.map(p => <option key={p._id} value={p._id}>{p.playlistName}</option>)}
          </select>
          <input value={songName} onChange={e => setSongName(e.target.value)} placeholder="Song name" />
          <div className="admin-toggle">
            <button className={`admin-toggle-btn ${!useFile ? 'active' : ''}`} onClick={() => setUseFile(false)}>URL</button>
            <button className={`admin-toggle-btn ${useFile ? 'active' : ''}`} onClick={() => setUseFile(true)}>File</button>
          </div>
          {useFile ? (
            <input type="file" accept=".mp3" onChange={e => setSongFile(e.target.files[0])} />
          ) : (
            <input value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="Song URL (http:// or music/...)" />
          )}
          <input value={songImage} onChange={e => setSongImage(e.target.value)} placeholder="Song image URL (optional)" />
          <div className="admin-form-actions">
            <button className="admin-btn" onClick={useFile ? handleAddSongFile : handleAddSongUrl}>Add Song</button>
            <button className="admin-btn secondary" onClick={() => setView('menu')}>Back</button>
          </div>
        </div>
      )}

      {view === 'remove' && (
        <div className="admin-form">
          <h3>Remove Song from Playlist</h3>
          <select value={selectedPlaylist} onChange={e => { setSelectedPlaylist(e.target.value); setRemoveSongName(''); }}>
            <option value="">Select playlist</option>
            {playlists.map(p => <option key={p._id} value={p._id}>{p.playlistName}</option>)}
          </select>
          {selectedPlaylistData && (
            <select value={removeSongName} onChange={e => setRemoveSongName(e.target.value)}>
              <option value="">Select song</option>
              {selectedPlaylistData.songs.map(s => (
                <option key={s.songName} value={s.songName}>{s.songName}</option>
              ))}
            </select>
          )}
          <div className="admin-form-actions">
            <button className="admin-btn danger" onClick={handleRemoveSong}>Remove</button>
            <button className="admin-btn secondary" onClick={() => setView('menu')}>Back</button>
          </div>
        </div>
      )}

      {view === 'manage' && (
        <div className="admin-manage">
          <h3>Manage Playlists</h3>
          {playlists.length === 0 && <p style={{ color: '#b3b3b3' }}>No global playlists.</p>}
          {playlists.map(p => (
            <div key={p._id} className="admin-playlist-item">
              <span>{p.playlistName} ({p.songs?.length || 0} songs)</span>
              <button className="admin-btn danger small" onClick={() => handleDeletePlaylist(p._id)}>Delete</button>
            </div>
          ))}
          <button className="admin-btn secondary" onClick={() => setView('menu')} style={{ marginTop: 12 }}>Back</button>
        </div>
      )}
    </div>
  );
}
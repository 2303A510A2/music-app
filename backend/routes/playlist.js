const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const upload = require('../middleware/upload');

// Admin creates a global playlist (visible to all users)
router.post('/admin-create', async (req, res) => {
  try {
    const { adminEmail, playlistName, coverImage } = req.body;
    if (!adminEmail || !playlistName || !playlistName.trim()) {
      return res.status(400).json({ message: 'Admin email and playlist name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can create global playlists' });
    }
    const existing = await Playlist.findOne({ playlistName: playlistName.trim(), isGlobal: true });
    if (existing) {
      return res.status(409).json({ message: 'A global playlist with that name already exists' });
    }
    const playlist = new Playlist({
      userId: admin._id,
      playlistName: playlistName.trim(),
      songs: [],
      isGlobal: true,
      createdByAdmin: admin.email,
      coverImage: coverImage || ''
    });
    await playlist.save();
    res.status(201).json({ message: 'Global playlist created', playlist });
  } catch (err) {
    console.error('Error creating global playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin rename a global playlist
router.post('/admin-rename', async (req, res) => {
  try {
    const { adminEmail, playlistId, newName } = req.body;
    if (!adminEmail || !playlistId || !newName || !newName.trim()) {
      return res.status(400).json({ message: 'Admin email, playlist ID, and new name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can rename playlists' });
    }
    const existing = await Playlist.findOne({ playlistName: newName.trim(), isGlobal: true, _id: { $ne: playlistId } });
    if (existing) {
      return res.status(409).json({ message: 'A global playlist with that name already exists' });
    }
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, isGlobal: true },
      { playlistName: newName.trim() },
      { new: true }
    );
    if (!playlist) {
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    res.json({ message: 'Playlist renamed', playlist });
  } catch (err) {
    console.error('Error renaming global playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch all global playlists
router.get('/global', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isGlobal: true }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    console.error('Error fetching global playlists:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a global playlist (admin only)
router.post('/admin-delete', async (req, res) => {
  try {
    const { adminEmail, userId, playlistId } = req.body;
    if (!playlistId) {
      return res.status(400).json({ message: 'Playlist ID is required' });
    }
    let admin = null;
    if (adminEmail) {
      admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    }
    if (!admin && userId) {
      admin = await User.findOne({ _id: userId, adminStatus: { $in: ['approved', 'leader'] } });
    }
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can delete global playlists' });
    }
    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, isGlobal: true });
    if (!playlist) {
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    res.json({ message: 'Global playlist deleted' });
  } catch (err) {
    console.error('Error deleting global playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload MP3 and add song to a global playlist (admin only)
// Admin add song — URL mode (JSON, no file upload)
router.post('/admin-add-song-url', async (req, res) => {
  try {
    const { adminEmail, playlistId, songName, songUrl, songImage } = req.body;
    console.log('admin-add-song-url: received', { playlistId, songName, songUrl: songUrl?.slice(0, 50), songImage: songImage?.slice(0, 50) });

    if (!adminEmail || !playlistId || !songName || !songName.trim()) {
      return res.status(400).json({ message: 'Admin email, playlist ID, and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can add songs to global playlists' });
    }
    let playlist;
    try {
      playlist = await Playlist.findOne({ _id: playlistId, isGlobal: true });
    } catch (castErr) {
      return res.status(400).json({ message: 'Invalid playlist ID' });
    }
    if (!playlist) {
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    if (!songUrl || !songUrl.trim()) {
      return res.status(400).json({ message: 'Song URL is required' });
    }
    playlist.songs.push({ songName: songName.trim(), songUrl: songUrl.trim(), songImage: songImage || '' });
    await playlist.save();
    console.log('admin-add-song-url: saved to MongoDB —', songName);
    res.json({ message: 'Song added to global playlist', playlist });
  } catch (err) {
    console.error('Error adding song to global playlist (URL):', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin add song — File mode (accepts songUrl from body)
router.post('/admin-add-song', async (req, res) => {
  try {
    const { adminEmail, playlistId, songName, songUrl, songImage } = req.body;
    if (!adminEmail || !playlistId || !songName || !songName.trim()) {
      return res.status(400).json({ message: 'Admin email, playlist ID, and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can add songs to global playlists' });
    }
    let playlist;
    try {
      playlist = await Playlist.findOne({ _id: playlistId, isGlobal: true });
    } catch (castErr) {
      return res.status(400).json({ message: 'Invalid playlist ID' });
    }
    if (!playlist) {
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    if (!songUrl || !songUrl.trim()) {
      return res.status(400).json({ message: 'Song URL is required' });
    }
    playlist.songs.push({ songName: songName.trim(), songUrl: songUrl.trim(), songImage: songImage || '' });
    await playlist.save();
    res.json({ message: 'Song added to global playlist', playlist });
  } catch (err) {
    console.error('Error adding song to global playlist (file):', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload an MP3 file URL (for local playlists, admin only)
router.post('/upload-file', async (req, res) => {
  try {
    const { adminEmail, songUrl } = req.body;
    if (!adminEmail || !songUrl || !songUrl.trim()) {
      return res.status(400).json({ message: 'Admin email and song URL are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can upload files' });
    }
    res.json({ message: 'File uploaded', fileName: songUrl });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Upload a cover image for a playlist (admin only)
// Accepts: multipart/form-data with a file (field name "file" or "image"), or JSON with imageUrl
router.post('/upload-cover', (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart')) {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload-cover multer error:', err);
        return res.status(400).json({ message: err.message || 'Upload failed', imageUrl: '' });
      }
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { adminEmail, imageUrl } = req.body;
    if (!adminEmail) {
      return res.status(400).json({ message: 'Admin email is required', imageUrl: '' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can upload images', imageUrl: '' });
    }
    // If file was uploaded via multer, use its Cloudinary URL
    if (req.file) {
      const url = req.file.path || '';
      if (!url) {
        return res.status(500).json({ message: 'Cloudinary upload failed', imageUrl: '' });
      }
      console.log('Cover image uploaded to Cloudinary:', url);
      return res.json({ message: 'Image uploaded', imageUrl: url });
    }
    // Otherwise, use the URL from JSON body
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ message: 'Image URL or file is required', imageUrl: '' });
    }
    res.json({ message: 'Image uploaded', imageUrl });
  } catch (err) {
    console.error('Error uploading cover image:', err);
    res.status(500).json({ message: 'Internal server error', imageUrl: '' });
  }
});



// Upload a song image (admin only)
// Accepts: multipart/form-data with a file (field name "file" or "image"), or JSON with imageUrl
router.post('/upload-song-image', (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart')) {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload-song-image multer error:', err);
        return res.status(400).json({ message: err.message || 'Upload failed', imageUrl: '' });
      }
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { adminEmail, imageUrl } = req.body;
    if (!adminEmail) {
      return res.status(400).json({ message: 'Admin email is required', imageUrl: '' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can upload images', imageUrl: '' });
    }
    if (req.file) {
      const url = req.file.path || '';
      if (!url) {
        return res.status(500).json({ message: 'Cloudinary upload failed', imageUrl: '' });
      }
      console.log('Song image uploaded to Cloudinary:', url);
      return res.json({ message: 'Image uploaded', imageUrl: url });
    }
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ message: 'Image URL or file is required', imageUrl: '' });
    }
    res.json({ message: 'Image uploaded', imageUrl });
  } catch (err) {
    console.error('Error uploading song image:', err);
    res.status(500).json({ message: 'Internal server error', imageUrl: '' });
  }
});

// Remove a song from a global playlist (admin only)
router.post('/admin-remove-song', async (req, res) => {
  try {
    const { adminEmail, playlistId, songName } = req.body;
    console.log('[DELETE SONG] admin-remove-song request:', { adminEmail, playlistId, songName });

    if (!adminEmail || !playlistId || !songName) {
      console.log('[DELETE SONG] Missing required fields');
      return res.status(400).json({ success: false, message: 'Admin email, playlist ID, and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      console.log('[DELETE SONG] Admin not found or unauthorized:', adminEmail);
      return res.status(403).json({ success: false, message: 'Only approved admins can remove songs from global playlists' });
    }
    const playlist = await Playlist.findOne({ _id: playlistId, isGlobal: true });
    if (!playlist) {
      console.log('[DELETE SONG] Global playlist not found:', playlistId);
      return res.status(404).json({ success: false, message: 'Global playlist not found' });
    }
    const idx = playlist.songs.findIndex(s => s.songName === songName);
    if (idx === -1) {
      console.log('[DELETE SONG] Song not found in playlist:', songName);
      return res.status(404).json({ success: false, message: 'Song not found in this playlist' });
    }
    playlist.songs.splice(idx, 1);
    await playlist.save();
    console.log('[DELETE SONG] Successfully deleted:', songName, 'from playlist:', playlistId);
    res.json({ success: true, message: 'Song deleted successfully' });
  } catch (err) {
    console.error('[DELETE SONG] Error removing song from global playlist:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== USER PLAYLISTS (not global, per-user) ====================

// Create a user-local playlist
router.post('/user-create', async (req, res) => {
  try {
    const { userId, playlistName, coverImage } = req.body;
    if (!userId || !playlistName || !playlistName.trim()) {
      return res.status(400).json({ message: 'User ID and playlist name are required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const existing = await Playlist.findOne({ userId: user._id, playlistName: playlistName.trim(), isGlobal: false });
    if (existing) {
      return res.status(409).json({ message: 'A playlist with that name already exists' });
    }
    const playlist = new Playlist({
      userId: user._id,
      playlistName: playlistName.trim(),
      songs: [],
      isGlobal: false,
      coverImage: coverImage || ''
    });
    await playlist.save();
    res.status(201).json({ message: 'Playlist created', playlist });
  } catch (err) {
    console.error('Error creating user playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all playlists for a user
router.get('/user-playlists/:userId', async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.params.userId, isGlobal: false }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    console.error('Error fetching user playlists:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rename a user playlist
router.post('/user-rename', async (req, res) => {
  try {
    const { userId, playlistId, newName } = req.body;
    if (!userId || !playlistId || !newName || !newName.trim()) {
      return res.status(400).json({ message: 'User ID, playlist ID, and new name are required' });
    }
    const existing = await Playlist.findOne({ userId, playlistName: newName.trim(), isGlobal: false, _id: { $ne: playlistId } });
    if (existing) {
      return res.status(409).json({ message: 'A playlist with that name already exists' });
    }
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId, isGlobal: false },
      { playlistName: newName.trim() },
      { new: true }
    );
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json({ message: 'Playlist renamed', playlist });
  } catch (err) {
    console.error('Error renaming user playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a user playlist
router.post('/user-delete', async (req, res) => {
  try {
    const { userId, playlistId } = req.body;
    if (!userId || !playlistId) {
      return res.status(400).json({ message: 'User ID and playlist ID are required' });
    }
    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, userId, isGlobal: false });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    console.error('Error deleting user playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add song to user playlist
router.post('/user-add-song', async (req, res) => {
  try {
    const { userId, playlistId, songName, songUrl, songImage } = req.body;
    if (!userId || !playlistId || !songName || !songName.trim()) {
      return res.status(400).json({ message: 'User ID, playlist ID, and song name are required' });
    }
    const playlist = await Playlist.findOne({ _id: playlistId, userId, isGlobal: false });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    const existingSong = playlist.songs.find(s => s.songName === songName.trim());
    if (existingSong) {
      return res.status(409).json({ message: 'A song with that name already exists in this playlist' });
    }
    let finalUrl = songUrl || '';
    if (!finalUrl) {
      return res.status(400).json({ message: 'Song URL is required' });
    }
    playlist.songs.push({ songName: songName.trim(), songUrl: finalUrl, songImage: songImage || '' });
    await playlist.save();
    res.json({ message: 'Song added to playlist', playlist });
  } catch (err) {
    console.error('Error adding song to user playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove song from user playlist
router.post('/user-remove-song', async (req, res) => {
  try {
    const { userId, playlistId, songName } = req.body;
    console.log('[DELETE SONG] user-remove-song request:', { userId, playlistId, songName });

    if (!userId || !playlistId || !songName) {
      console.log('[DELETE SONG] Missing required fields');
      return res.status(400).json({ success: false, message: 'User ID, playlist ID, and song name are required' });
    }
    const playlist = await Playlist.findOne({ _id: playlistId, userId, isGlobal: false });
    if (!playlist) {
      console.log('[DELETE SONG] User playlist not found:', playlistId);
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    const idx = playlist.songs.findIndex(s => s.songName === songName);
    if (idx === -1) {
      console.log('[DELETE SONG] Song not found in user playlist:', songName);
      return res.status(404).json({ success: false, message: 'Song not found in this playlist' });
    }
    playlist.songs.splice(idx, 1);
    await playlist.save();
    console.log('[DELETE SONG] Successfully deleted:', songName, 'from user playlist:', playlistId);
    res.json({ success: true, message: 'Song deleted successfully' });
  } catch (err) {
    console.error('[DELETE SONG] Error removing song from user playlist:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin cleanup — remove all non-Cloudinary songs from all playlists
router.post('/admin-clean-songs', async (req, res) => {
  try {
    const { adminEmail } = req.body;
    if (!adminEmail) {
      return res.status(400).json({ success: false, message: 'Admin email is required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Only approved admins can clean songs' });
    }

    const playlists = await Playlist.find({});
    let totalRemoved = 0;
    const results = [];

    for (const playlist of playlists) {
      const before = playlist.songs.length;
      playlist.songs = playlist.songs.filter(s => {
        return s.songUrl && s.songUrl.includes('res.cloudinary.com');
      });
      const after = playlist.songs.length;
      const removed = before - after;
      if (removed > 0) {
        totalRemoved += removed;
        await playlist.save();
        results.push({ playlistName: playlist.playlistName, removed, remaining: after });
      }
    }

    res.json({
      success: true,
      message: `Cleaned ${totalRemoved} old song(s) from ${results.length} playlist(s)`,
      totalRemoved,
      details: results
    });
  } catch (err) {
    console.error('[CLEAN SONGS] Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

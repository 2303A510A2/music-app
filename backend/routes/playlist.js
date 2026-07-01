const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const Playlist = require('../models/Playlist');

// Sanitize filename: replace Windows-illegal chars and trim
function safeFilename(original) {
  return original.replace(/[\\/:*?"<>|]/g, '_').trim();
}

// Multer config for MP3 uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../frontend/music'),
  filename: (req, file, cb) => {
    cb(null, safeFilename(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.mp3')) {
      return cb(new Error('Only MP3 files allowed'));
    }
    cb(null, true);
  }
});

// Middleware to catch Multer errors and return JSON
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

// Multer config for image uploads
const imageStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../frontend/images'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Only image files (jpg, jpeg, png, gif, svg, webp) are allowed'));
    }
    cb(null, true);
  }
});

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
    console.error('Error adding song to global playlist (URL):', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin add song — File mode (multipart with MP3 upload)
router.post('/admin-add-song', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    const { adminEmail, playlistId, songName, songImage } = req.body;
    if (!adminEmail || !playlistId || !songName || !songName.trim()) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: 'Admin email, playlist ID, and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(403).json({ message: 'Only approved admins can add songs to global playlists' });
    }
    let playlist;
    try {
      playlist = await Playlist.findOne({ _id: playlistId, isGlobal: true });
    } catch (castErr) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: 'Invalid playlist ID' });
    }
    if (!playlist) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No MP3 file uploaded' });
    }
    const finalUrl = `music/${req.file.filename}`;
    playlist.songs.push({ songName: songName.trim(), songUrl: finalUrl, songImage: songImage || '' });
    await playlist.save();
    res.json({ message: 'Song added to global playlist', playlist });
  } catch (err) {
    console.error('Error adding song to global playlist (file):', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload an MP3 file to the server (for local playlists, admin only)
router.post('/upload-file', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    const { adminEmail, songName } = req.body;
    if (!adminEmail || !songName || !songName.trim()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Admin email and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Only approved admins can upload files' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded', fileName: req.file.filename });
  } catch (err) {
    console.error('Error uploading file:', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Copy a file from a local path to the music directory
router.post('/copy-from-path', async (req, res) => {
  try {
    const { adminEmail, filePath } = req.body;
    if (!adminEmail || !filePath) {
      return res.status(400).json({ message: 'Admin email and file path are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can add songs' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found at the given path' });
    }
    const fileName = safeFilename(path.basename(filePath));
    const destPath = path.join(__dirname, '../../frontend/music', fileName);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(filePath, destPath);
    }
    res.json({ message: 'File uploaded', fileName, url: `music/${fileName}` });
  } catch (err) {
    console.error('Error copying file from path:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload a cover image for a playlist (admin only)
router.post('/upload-cover', uploadImage.single('file'), async (req, res) => {
  try {
    const { adminEmail } = req.body;
    if (!adminEmail) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Admin email is required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Only approved admins can upload images' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const imageUrl = `images/${req.file.filename}`;
    res.json({ message: 'Image uploaded', imageUrl });
  } catch (err) {
    console.error('Error uploading cover image:', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Copy a cover image from a local file path (admin only)
router.post('/copy-cover-path', async (req, res) => {
  try {
    const { adminEmail, filePath } = req.body;
    if (!adminEmail || !filePath) {
      return res.status(400).json({ message: 'Admin email and file path are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can add images' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found at the given path' });
    }
    const ext = path.extname(filePath).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ message: 'Only image files (jpg, jpeg, png, gif, svg, webp) are allowed' });
    }
    const fileName = Date.now() + '-' + path.basename(filePath);
    const destPath = path.join(__dirname, '../../frontend/images', fileName);
    fs.copyFileSync(filePath, destPath);
    res.json({ message: 'Image uploaded', imageUrl: `images/${fileName}` });
  } catch (err) {
    console.error('Error copying image from path:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload a song image file (admin only)
router.post('/upload-song-image', uploadImage.single('file'), async (req, res) => {
  try {
    const { adminEmail } = req.body;
    if (!adminEmail) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Admin email is required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Only approved admins can upload images' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const imageUrl = `images/${req.file.filename}`;
    res.json({ message: 'Image uploaded', imageUrl });
  } catch (err) {
    console.error('Error uploading song image:', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove a song from a global playlist (admin only)
router.post('/admin-remove-song', async (req, res) => {
  try {
    const { adminEmail, playlistId, songName } = req.body;
    if (!adminEmail || !playlistId || !songName) {
      return res.status(400).json({ message: 'Admin email, playlist ID, and song name are required' });
    }
    const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ['approved', 'leader'] } });
    if (!admin) {
      return res.status(403).json({ message: 'Only approved admins can remove songs from global playlists' });
    }
    const playlist = await Playlist.findOne({ _id: playlistId, isGlobal: true });
    if (!playlist) {
      return res.status(404).json({ message: 'Global playlist not found' });
    }
    const idx = playlist.songs.findIndex(s => s.songName === songName);
    if (idx === -1) {
      return res.status(404).json({ message: 'Song not found in this playlist' });
    }
    playlist.songs.splice(idx, 1);
    await playlist.save();
    res.json({ message: 'Song removed from global playlist', playlist });
  } catch (err) {
    console.error('Error removing song from global playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
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
    if (!userId || !playlistId || !songName) {
      return res.status(400).json({ message: 'User ID, playlist ID, and song name are required' });
    }
    const playlist = await Playlist.findOne({ _id: playlistId, userId, isGlobal: false });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    const idx = playlist.songs.findIndex(s => s.songName === songName);
    if (idx === -1) {
      return res.status(404).json({ message: 'Song not found in this playlist' });
    }
    playlist.songs.splice(idx, 1);
    await playlist.save();
    res.json({ message: 'Song removed from playlist', playlist });
  } catch (err) {
    console.error('Error removing song from user playlist:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

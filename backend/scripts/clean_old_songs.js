require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Playlist = require('../models/Playlist');

async function cleanOldSongs() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mymusic';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const playlists = await Playlist.find({});
    let totalRemoved = 0;

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
        console.log(`Removed ${removed} old song(s) from playlist "${playlist.playlistName}" (${playlist._id})`);
      }
    }

    console.log(`\nCleanup complete. Total songs removed: ${totalRemoved}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanOldSongs();

const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  songName: { type: String, required: true },
  songUrl: { type: String, required: true },
  songImage: { type: String, default: '' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  playlistName: { type: String, required: true },
  songs: [songSchema],
  isGlobal: { type: Boolean, default: false },
  createdByAdmin: { type: String, default: '' },
  coverImage: { type: String, default: '' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

playlistSchema.pre('save', function (next) {
  if (this.songs && this.songs.length > 0) {
    this.songs = this.songs.filter(s => s.songName && s.songName.trim() && s.songUrl && s.songUrl.trim());
  }
  next();
});

module.exports = mongoose.model('Playlist', playlistSchema);

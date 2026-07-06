const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  petName: { type: String },
  favoriteColor: { type: String },
  isAdmin: { type: Boolean, default: false },
  isLeader: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  adminStatus: { type: String, enum: ['none', 'pending', 'approved', 'leader'], default: 'none' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('User', userSchema);

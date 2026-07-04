const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ResetToken', resetTokenSchema);

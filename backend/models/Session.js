// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  typingSpeed: { type: Number },
  pasteDetected: { type: Boolean, default: false },
  checkoutDuration: { type: Number }, // seconds
  countryMismatch: { type: Boolean, default: false },
  deviceFingerprint: { type: String },
  trustScore: { type: Number },
  isAnomaly: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

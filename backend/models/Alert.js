// models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Info'], default: 'Info' },
  reason: { type: String }, // Explanation for the alert (e.g., "Low trust score: 32")
  source: { type: String, default: 'System' }, // E.g. 'login', 'cart', 'checkout'

  metadata: { type: Object }, // Flexible field to store additional data like orderId, trustScore, prediction

  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
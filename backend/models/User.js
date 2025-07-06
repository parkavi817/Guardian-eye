const mongoose = require('mongoose');
const crypto = require('crypto'); // Node.js built-in module

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  trustScore: { type: Number, default: 100 }, // Default trust score
  status: { type: String, enum: ['Safe', 'Monitor', 'Suspicious', 'Blocked'], default: 'Safe' },
}, { timestamps: true });

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
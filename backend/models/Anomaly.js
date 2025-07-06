const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['wishlist', 'cart', 'checkout', 'login', 'product-view'], // Extend as needed
  },
  context: {
    type: String,
    required: true,
    // Examples: 'rapid-add', 'rapid-remove', 'rapid-add-remove', 'unusual-login-location', 'high-value-cart-rapid-changes'
  },
  features: {
    type: Array, // <--- CHANGED FROM Object to Array
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: { // Added isRead field
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Anomaly', AnomalySchema);
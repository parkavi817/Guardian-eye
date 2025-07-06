const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: String,
    default: 'user' // Could be 'user', 'admin', 'system', 'ai'
  }
});

// Optional: auto-update timestamp whenever item is updated
cartItemSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);

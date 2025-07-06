const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'ADD_TO_CART',
      'REMOVE_FROM_CART',
      'VIEW_CART',
      'ADD_TO_WISHLIST',
      'REMOVE_FROM_WISHLIST',
      'VIEW_WISHLIST',
      'VIEW_PRODUCT',
      'SEARCH_PRODUCT',
      'UPDATE_CART_ITEM',
      // Add other relevant user actions as needed
    ],
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for various details
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

module.exports = mongoose.model('UserActivity', userActivitySchema);
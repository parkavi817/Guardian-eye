// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
  category: String,
  description: String,
  inStock: Boolean,
  rating: Number,
  reviews: Number,
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
// Order schema
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  totalAmount: { type: Number, required: true }, // Added totalAmount
  status: { type: String, default: 'Pending' },
  trustScore: { type: Number, default: 1 },
  prediction: { type: String, default: 'normal' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

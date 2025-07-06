const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const { evaluateTrustScore } = require('../utils/anomalyUtils');
const UserActivity = require('../models/UserActivity');

// Add to Cart (or update quantity if already exists)
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id; // Assuming userId is available from authentication middleware

  try {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [{ product: productId, quantity }] });
    } else {
      const existingItem = cart.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();

    // Log user activity
    const product = await Product.findById(productId); // Fetch product details for logging
    await UserActivity.create({
      user: userId,
      actionType: 'ADD_TO_CART',
      details: {
        productId: productId,
        productName: product ? product.name : 'Unknown Product',
        quantity: quantity,
      },
    });

    res.json({ message: 'Added to cart', items: cart.items });
  } catch (err) {
    console.error('Add to cart error:', err.message);
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};

// Get Cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      // Log user activity even if cart is empty
      await UserActivity.create({
        user: req.user.id,
        actionType: 'VIEW_CART',
        details: {
          itemCount: 0,
        },
      });
      return res.json({ items: [] });
    }

    const items = cart.items.map(item => ({
      id: item.product._id,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      price: item.product.price,
      quantity: item.quantity
    }));

    // Log user activity
    await UserActivity.create({
      user: req.user.id,
      actionType: 'VIEW_CART',
      details: {
        itemCount: items.length,
      },
    });

    res.json({ items });
  } catch (err) {
    console.error('Get cart error:', err.message);
    res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
  }
};

// Update Quantity with anomaly detection
exports.updateCartItem = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  console.log(`Attempting to update productId: ${productId}, quantity: ${req.body.quantity} for userId: ${userId}`);

  const {
    quantity,
    typingSpeed = 0,
    pasteDetected = false,
    checkoutDuration = 0,
    countryMismatch = false
  } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    const oldQuantity = item.quantity;
    item.quantity = quantity;
    await cart.save();

    // Log user activity for quantity update
    await UserActivity.create({
      user: req.user.id,
      actionType: 'UPDATE_CART_ITEM',
      details: {
        productId: productId,
        oldQuantity: oldQuantity,
        newQuantity: quantity,
      },
    });

    const { prediction, trust_score } = await evaluateTrustScore({
      typingSpeed,
      pasteDetected,
      checkoutDuration,
      countryMismatch,
    });

    if (prediction === 1) {
      await Alert.create({
        user: req.user.id,
        message: 'Abnormal behavior while updating cart',
        severity: trust_score < 40 ? 'High' : 'Medium',
        source: 'Cart',
        isRead: false,
      });
    }

    res.json({ message: 'Cart item updated', item });
  } catch (err) {
    console.error('Update cart item error:', err);
    res.status(500).json({ message: 'Failed to update item', error: err.message });
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { items: { product: productId } } },
      { new: true }
    );

    // Log user activity
    await UserActivity.create({
      user: req.user.id,
      actionType: 'REMOVE_FROM_CART',
      details: {
        productId: productId,
      },
    });

    res.json({ message: 'Item removed', items: cart?.items || [] });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ message: 'Failed to remove item', error: err.message });
  }
};
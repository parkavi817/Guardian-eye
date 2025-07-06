const Order = require('../models/Order');
const Alert = require('../models/Alert');
const { evaluateTrustScore } = require('../utils/anomalyUtils');
const User = require('../models/User');
const Product = require('../models/Product'); // Import Product model
const ruleEngine = require('../services/ruleEngine');

exports.placeOrder = async (req, res) => {
  const { items, shippingAddress, behavioralMetrics } = req.body;
  console.log('Backend: Received items in placeOrder:', items);
  console.log('Backend: Type of items:', typeof items);
  console.log('Backend: Is items an array?', Array.isArray(items));
  console.log('Backend: Length of items:', items ? items.length : 'undefined or null');

  // Calculate total amount and prepare order items for Mongoose
  let totalAmount = 0;
  const orderItems = []; // This will store items in the format expected by the Order model

  if (items && items.length > 0) {
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.id} not found.` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({ product: product._id, quantity: item.quantity });
    }
  } else {
    return res.status(400).json({ message: 'No items in order.' });
  }

  // Evaluate trust score for the order
  let trustScore = 1; // Default to high trust
  let prediction = 'normal';

  if (behavioralMetrics) {
    const {
      typingSpeedShipping,
      typingSpeedPayment,
      timeOnPageCheckout,
      billingCountry,
    } = behavioralMetrics;

    // Assuming country mismatch can be determined here if user's registered country is known
    const user = await User.findById(req.user.id); // Fetch user to get registered country
    const countryMismatch = user && user.country && billingCountry && user.country !== billingCountry;

    const evaluationResult = await evaluateTrustScore({
      typingSpeed: (typingSpeedShipping + typingSpeedPayment) / 2, // Average typing speed
      pasteDetected: false, // Assuming no direct paste detection for now, or add it to behavioralMetrics
      checkoutDuration: timeOnPageCheckout,
      countryMismatch: countryMismatch,
    });
    trustScore = evaluationResult.trust_score;
    prediction = evaluationResult.prediction === 1 ? 'suspicious' : 'normal';
  }

  const order = await Order.create({
    user: req.user.id,
    items: orderItems, // Use the transformed orderItems
    shippingAddress,
    totalAmount, // Include totalAmount here
    status: 'Pending', // Initial status
    trustScore: trustScore, // Store trust score with the order
    prediction: prediction, // Store prediction with the order
  });

  // NEW: Update user's trust score based on order trust score
  const user = await User.findById(req.user.id);
  if (user) {
    // Simple update: set user's trust score to the latest order's trust score
    // You might want a more sophisticated algorithm here (e.g., moving average)
    user.trustScore = trustScore; // Use the trustScore calculated for the order
    await user.save();
    console.log(`User ${user.email}'s trust score updated to: ${user.trustScore} after order placement.`);
  }

  // Create alert if order is suspicious
  if (trustScore < 0.5 || prediction === 'suspicious') {
    await Alert.create({
      userId: req.user.id,
      userEmail: req.user.email,
      message: `Suspicious order placed by ${req.user.email || req.user.id}`,
      severity: 'High',
      source: 'Order Processing',
      reason: 'Low Trust Score / ML Prediction',
      metadata: { orderId: order._id, trustScore, prediction },
    });
    // Optionally, set order status to 'Review'
    order.status = 'Review';
    await order.save();
  }

  // Prepare context for rule evaluation
  // Fetch user again to ensure it's the latest, or use the one fetched earlier if available
  // NOTE: The 'user' object for contextForRules is already fetched and updated above.
  const userForRules = user; // Use the 'user' object that was just fetched and updated

  // Calculate isNew for the user
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isNewUser = userForRules && userForRules.createdAt > twentyFourHoursAgo;

  const context = {
    user: { // Pass a simplified user object to context, including isNew
      _id: userForRules._id,
      email: userForRules.email,
      isAdmin: userForRules.isAdmin,
      trustScore: userForRules.trustScore, // Use the updated trustScore
      status: userForRules.status,
      createdAt: userForRules.createdAt,
      isNew: isNewUser, // NEW: Add isNew property
    },
    order: order, // The full order object, which contains totalAmount
    items: items, // Keep original items for rule engine if needed, or use orderItems
    shippingAddress: shippingAddress,
    behavioralMetrics: behavioralMetrics,
    trustScore: trustScore,
    prediction: prediction,
    // Add other relevant order data to context
  };

  // Evaluate rules
  await ruleEngine.evaluateRules(context, 'order'); // ADDED 'order' eventType

  // This alert is for general order placement, not necessarily suspicious
  await Alert.create({
    userId: req.user.id,
    userEmail: req.user.email,
    message: 'New Order Placed',
    severity: 'Info',
    source: 'Order Processing',
    reason: 'Order Creation',
    metadata: { orderId: order._id },
  });

  res.status(201).json(order);
};

exports.getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
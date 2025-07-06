const User = require('../models/User');
const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Wishlist = require('../models/Wishlist'); // Import Wishlist model
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean(); // Use .lean() for plain JS object

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's orders
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5) // Limit to recent orders for performance
      .lean();

    // Transform orders to match frontend's expected structure
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      totalAmount: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt,
    }));

    // Fetch user's alerts
    const alerts = await Alert.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5) // Limit to recent alerts for performance
      .lean();

    // Transform alerts to match frontend's expected structure
    const transformedAlerts = alerts.map(alert => ({
      id: alert._id.toString(),
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.createdAt,
    }));

    // Fetch user's wishlist
    const userWishlist = await Wishlist.findOne({ user: req.user.id }).populate('items').lean();
    const wishlistItems = userWishlist ? userWishlist.items.map(item => item._id.toString()) : [];

    // Combine user data with orders, alerts, and wishlist
    const userProfile = {
      ...user,
      orders: transformedOrders,
      alerts: transformedAlerts,
      wishlist: wishlistItems, // Add wishlist items (as product IDs)
    };

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const updated = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true });
  res.json(updated);
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};
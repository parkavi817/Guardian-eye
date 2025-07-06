const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    // Set req.user.role based on isAdmin for compatibility with authorizeRoles middleware
    req.user.role = user.isAdmin ? 'admin' : 'user';
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
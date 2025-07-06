const User = require('../models/User');
const Alert = require('../models/Alert');
const { hashPassword, comparePassword } = require('../utils/authUtils');
const { signToken } = require('../utils/jwtUtils');
const sendEmail = require('../utils/sendEmail');
const { evaluateTrustScore } = require('../utils/anomalyUtils');
const ruleEngine = require('../services/ruleEngine');
const crypto = require('crypto');

// -------- Signup --------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
    let { typingSpeed, pasteDetected } = req.body;

    // Validate and sanitize behavioral metrics
    typingSpeed = typeof typingSpeed === 'number' ? typingSpeed : 0;
    pasteDetected = typeof pasteDetected === 'boolean' ? pasteDetected : false;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({ name, email, password: hashedPassword, country });

    // Behavioral anomaly detection
    const { prediction, trust_score } = await evaluateTrustScore({
      typingSpeed,
      pasteDetected,
      checkoutDuration: 0,
      countryMismatch: false,
    });

    if (prediction === 1) {
      await Alert.create({
        user: newUser._id,
        message: 'Suspicious behavior during signup',
        severity: trust_score < 40 ? 'High' : 'Medium',
        source: 'Signup',
        reason: 'ML Anomaly Detection',
        isRead: false,
      });
    }

    // Prepare context for rule evaluation
    const context = {
      user: newUser,
      email: email,
      country: country,
      typingSpeed: typingSpeed,
      pasteDetected: pasteDetected,
      trustScore: trust_score,
      isAnomaly: prediction === 1,
      event: 'signup',
    };

    // Evaluate rules
    await ruleEngine.evaluateRules(context, 'signup'); // ADDED 'signup' eventType

    const token = signToken({ id: newUser._id });
    res.status(201).json({ token, user: { id: newUser._id, name, email } });

  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

// -------- Login --------
exports.login = async (req, res) => {
  try {
    const { email, password, country: currentCountry } = req.body;
    let { typingSpeed, pasteDetected } = req.body;

    typingSpeed = typeof typingSpeed === 'number' ? typingSpeed : 0;
    pasteDetected = typeof pasteDetected === 'boolean' ? pasteDetected : false;

    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // NEW: Check user status
    if (user.status === 'Blocked') {
      // Log the attempt for auditing
      console.warn(`Blocked user login attempt: ${user.email}`);
      // Return a generic message to avoid revealing user existence
      return res.status(403).json({ message: 'Access denied. Your account is unavailable.' });
    }

    const countryMismatch = user.country && currentCountry && user.country !== currentCountry;

    const { prediction, trust_score } = await evaluateTrustScore({
      typingSpeed,
      pasteDetected,
      checkoutDuration: 0,
      countryMismatch,
    });

    if (prediction === 1) {
      await Alert.create({
        user: user._id,
        message: 'Suspicious behavior during login',
        severity: trust_score < 40 ? 'High' : 'Medium',
        source: 'Login',
        reason: 'ML Anomaly Detection',
        isRead: false,
      });
    }

    // Prepare context for rule evaluation
    const context = {
      user: user,
      email: email,
      country: currentCountry,
      typingSpeed: typingSpeed,
      pasteDetected: pasteDetected,
      countryMismatch: countryMismatch,
      trustScore: trust_score,
      isAnomaly: prediction === 1,
      event: 'login',
    };

    // Evaluate rules
    await ruleEngine.evaluateRules(context, 'login'); // ADDED 'login' eventType

    const token = signToken({ id: user._id });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// -------- Forgot Password --------
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Send a generic success message to prevent email enumeration
      return res.status(200).json({ message: 'If a user with that email exists, a password reset email has been sent.' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); // Save user with token and expiry

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      You are receiving this email because you (or someone else) has requested the reset of a password.
      Please make a PUT request to: \n\n ${resetUrl}
      \n\nThis token is valid for 10 minutes.
      If you did not request this, please ignore this email.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
      console.error('Error sending email:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent', error: err.message });
    }

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Forgot password process failed', error: err.message });
  }
};

// -------- Reset Password --------
exports.resetPassword = async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = await hashPassword(req.body.newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
};
const Session = require('../models/Session');
const axios = require('axios');
const Alert = require('../models/Alert');
const ruleEngine = require('../services/ruleEngine');
const User = require('../models/User'); // Import User model

exports.trackSession = async (req, res) => {
  // Destructure all expected fields from the frontend payload
  const {
    typingSpeed,
    pasteDetected,
    checkoutDuration,
    countryMismatch,
    features, // This is the crucial 'features' array from the frontend
    action,   // Action performed (e.g., 'login', 'add_to_cart')
    context,  // Context of the action (e.g., 'login_form', 'product_123')
    email     // Email, if sent (though not an ML feature, can be used for context/logging)
  } = req.body;

  console.log("trackSession received. Action:", action, "Context:", context, "Features:", features);

  try {
    // Send the 'features' array directly to the Python API as it's already constructed by the frontend
    const response = await axios.post(process.env.PYTHON_API + "/predict", {
      features: features,
    });

    const { prediction, trust_score } = response.data;
    console.log("ML prediction (from Python):", prediction, "trust_score:", trust_score);

    // Define a threshold for anomaly detection (e.g., 0.5 for probabilities)
    const ANOMALY_THRESHOLD = 0.4; // CHANGED THRESHOLD TO 0.4
    const isAnomaly = prediction >= ANOMALY_THRESHOLD;

    console.log(`Node.js: Prediction ${prediction} >= Threshold ${ANOMALY_THRESHOLD} = isAnomaly: ${isAnomaly}`);

    const session = await Session.create({
      user: req.user.id,
      typingSpeed: typingSpeed,
      pasteDetected: pasteDetected,
      checkoutDuration: checkoutDuration,
      countryMismatch: countryMismatch,
      action: action,
      context: context,
      trustScore: trust_score, // Store trust score with the session
      isAnomaly: isAnomaly,
      mlFeatures: features,
    });
    console.log("Session created:", session);

    // NEW: Update user's trust score
    const user = await User.findById(req.user.id);
    if (user) {
      // Simple update: set user's trust score to the latest session's trust score
      // You might want a more sophisticated algorithm here (e.g., moving average)
      user.trustScore = trust_score;
      await user.save();
      console.log(`User ${user.email}'s trust score updated to: ${user.trustScore}`);
    }

    if (isAnomaly) {
      // Assuming req.user is populated by the protect middleware with user details (id and email)
      const alert = await Alert.create({
        userId: req.user.id, // Use userId as per schema
        userEmail: req.user.email, // Add userEmail as per schema
        message: `⚠️ Suspicious activity detected during ${action} (${context || 'N/A'})`,
        severity: 'High', // Changed to 'High' (uppercase) as per Alert schema enum
        reason: 'Anomaly detected by ML model',
        source: 'Session Tracking',
        metadata: { // Store mlFeatures and trustScore in metadata as per Alert schema
          mlFeatures: features,
          trustScore: trust_score,
        },
      });
      console.log("Alert created:", alert);
    }

    // Prepare context for rule evaluation
    // const user = await User.findById(req.user.id); // This line is now redundant, 'user' is already fetched above
    const contextForRules = {
      user: user, // Use the 'user' object already fetched and updated
      session: session,
      typingSpeed: typingSpeed,
      pasteDetected: pasteDetected,
      checkoutDuration: checkoutDuration,
      countryMismatch: countryMismatch,
      trustScore: trust_score,
      isAnomaly: isAnomaly,
      action: action,
      context: context,
      mlFeatures: features,
      // Placeholder for derived metrics - you'll need to implement actual calculation logic
      transactionLocationDistance: 0, // Example: calculate based on current and previous session locations
      timeSinceLastTransaction: 0,    // Example: calculate time since last transaction for this user
      userTransactionCountLast24h: 0, // Example: count user's transactions in last 24 hours
    };

    // Evaluate rules
    await ruleEngine.evaluateRules(contextForRules, 'session'); // ADDED 'session' eventType

    res.status(201).json(session);
  } catch (err) {
    console.error('Session tracking failed:', err);
    res.status(500).json({ message: 'Session tracking failed', error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  const sessions = await Session.find().populate('user').sort({ createdAt: -1 });
  res.json(sessions);
};
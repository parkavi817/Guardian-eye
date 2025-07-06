const axios = require('axios');
const Alert = require('../models/Alert');
const Anomaly = require('../models/Anomaly'); // Import the new Anomaly model

// POST /api/anomaly/behavior
const detectAnomaly = async (req, res) => {
  const { features, userId, userEmail, source, message } = req.body;

  // This is the detectAnomaly function, which expects 4 features for the ML model
  if (!features || !Array.isArray(features) || features.length !== 4 || !userId || !userEmail) {
    return res.status(400).json({ error: 'detectAnomaly: Missing or invalid required fields for ML prediction' });
  }

  const [typingSpeed, pasteDetected, duration, countryMismatch] = features;

  try {
    // Send to ML model
    const response = await axios.post('http://localhost:6000/predict', { features });
    const { prediction, trust_score } = response.data;

    if (prediction === 1) {
      await Alert.create({
        user: userId,
        message: message || 'Anomaly Detected: Unusual User Behavior',
        source: source || 'unknown',
        details: {
          typingSpeed,
          pasteDetected: Boolean(pasteDetected),
          duration,
          countryMismatch: Boolean(countryMismatch)
        },
        severity: trust_score < 40 ? 'high' : 'medium',
        read: false,
      });
    }

    res.status(200).json({ prediction, trust_score });
  } catch (err) {
    console.error('Anomaly detection error:', err.message);
    res.status(500).json({ error: 'Anomaly detection failed' });
  }
};

// controllers/anomalyController.ts

const logBehavioralAnomaly = async (req, res) => {
  try {
    const { userId, userEmail, source, context, features } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'logBehavioralAnomaly: Missing userId' });
    }
    if (!userEmail) {
      return res.status(400).json({ error: 'logBehavioralAnomaly: Missing userEmail' });
    }
    if (!source) {
      return res.status(400).json({ error: 'logBehavioralAnomaly: Missing source' });
    }
    if (!context) {
      return res.status(400).json({ error: 'logBehavioralAnomaly: Missing context' });
    }
    if (!Array.isArray(features) || features.length === 0) { // Ensure features is a non-empty array
      return res.status(400).json({ error: 'logBehavioralAnomaly: Invalid or empty features array' });
    }

    const newAnomaly = await Anomaly.create({
      userId,
      userEmail,
      source,
      context,
      features,
      createdAt: new Date(), // Optional if your schema auto-generates this
    });

    console.log(`✅ Behavioral anomaly logged for user ${userId}: ${context}`);
    return res.status(201).json({
      message: 'Behavioral anomaly logged successfully',
      anomaly: newAnomaly,
    });
  } catch (error) {
    console.error('❌ Error logging behavioral anomaly:', error);
    return res.status(500).json({
      error: 'Failed to log behavioral anomaly.',
    });
  }
};

const getAllAnomalies = async (req, res) => {
  try {
    const anomalies = await Anomaly.find().sort({ timestamp: -1 }).limit(100);
    res.json(anomalies);
  } catch (err) {
    console.error('Failed to fetch anomalies:', err);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
};

const markAnomalyAsRead = async (req, res) => {
  try {
    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }

    res.status(200).json(anomaly);
  } catch (err) {
    console.error('Failed to mark anomaly as read:', err);
    res.status(500).json({ message: 'Failed to mark anomaly as read', error: err.message });
  }
};

// NEW: Delete an anomaly by ID
const deleteAnomaly = async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id);

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }

    await Anomaly.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Anomaly deleted successfully' });
  } catch (err) {
    console.error('Failed to delete anomaly:', err);
    res.status(500).json({ message: 'Failed to delete anomaly', error: err.message });
  }
};

module.exports = {
  detectAnomaly,
  logBehavioralAnomaly,
  getAllAnomalies,
  markAnomalyAsRead,
  deleteAnomaly // NEW: Export the deleteAnomaly function
};
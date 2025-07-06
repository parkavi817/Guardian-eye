const Session = require('../models/Session');
const Alert = require('../models/Alert');
const Order = require('../models/Order'); // Assuming you might want to include recent orders
const UserActivity = require('../models/UserActivity');

exports.getLiveActivities = async (req, res) => {
  try {
    // Fetch recent sessions
    const sessions = await Session.find()
      .populate('user', 'email') // Populate user email
      .sort({ createdAt: -1 })
      .limit(10); // Limit to a reasonable number for live feed

    // Fetch recent alerts
    const alerts = await Alert.find()
      .populate('userId', 'email') // Populate user email for alerts
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch recent orders (optional, adjust limit as needed)
    const orders = await Order.find()
      .populate('user', 'email') // Populate user email for orders
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch recent user activities
    const userActivities = await UserActivity.find()
      .populate('user', 'email') // Populate user email
      .sort({ timestamp: -1 })
      .limit(10); // Limit to a reasonable number

    // Transform sessions into LiveActivity format
    const sessionActivities = sessions.map(session => ({
      id: session._id.toString(),
      timestamp: session.createdAt.toISOString(),
      userId: session.user ? session.user._id.toString() : 'N/A',
      userEmail: session.user ? session.user.email : 'Guest',
      action: 'Session Activity',
      riskScore: session.trustScore,
      details: {
        typingSpeed: session.typingSpeed,
        pasteDetected: session.pasteDetected,
        checkoutDuration: session.checkoutDuration,
        countryMismatch: session.countryMismatch,
        isAnomaly: session.isAnomaly,
      },
      isSuspicious: session.isAnomaly,
    }));

    // Transform alerts into LiveActivity format
    const alertActivities = alerts.map(alert => ({
      id: alert._id.toString(),
      timestamp: alert.createdAt.toISOString(),
      userId: alert.userId ? alert.userId._id.toString() : 'N/A',
      userEmail: alert.userId ? alert.userId.email : 'System',
      action: `Alert: ${alert.message}`,
      riskScore: alert.severity === 'High' ? 0.1 : alert.severity === 'Medium' ? 0.3 : 0.5, // Example risk score mapping
      details: {
        severity: alert.severity,
        reason: alert.reason,
        source: alert.source,
      },
      isSuspicious: true, // Alerts are inherently suspicious
    }));

    // Transform orders into LiveActivity format (example)
    const orderActivities = orders.map(order => ({
      id: order._id.toString(),
      timestamp: order.createdAt.toISOString(),
      userId: order.user ? order.user._id.toString() : 'N/A',
      userEmail: order.user ? order.user.email : 'Guest',
      action: `Order Placed: $${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}`,
      riskScore: order.trustScore, // Use order's trust score
      details: {
        status: order.status,
        itemsCount: order.items.length,
      },
      isSuspicious: order.trustScore < 0.5, // Example: suspicious if trust score is low
    }));

    // Transform user activities into LiveActivity format
    const transformedUserActivities = userActivities.map(activity => ({
      id: activity._id.toString(),
      timestamp: activity.timestamp.toISOString(),
      userId: activity.user ? activity.user._id.toString() : 'N/A',
      userEmail: activity.user ? activity.user.email : 'Guest',
      action: activity.actionType.replace(/_/g, ' '), // e.g., "ADD TO CART"
      riskScore: 0, // User activities are not inherently risky, unless a rule flags them
      details: activity.details,
      isSuspicious: false,
    }));

    // Combine and sort all activities by timestamp
    const combinedActivities = [
      ...sessionActivities,
      ...alertActivities,
      ...orderActivities,
      ...transformedUserActivities, // Add the new activities
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(combinedActivities);
  } catch (error) {
    console.error('Error fetching live activities:', error);
    res.status(500).json({ message: 'Failed to fetch live activities' });
  }
};
const User = require('../models/User');
const Order = require('../models/Order');
const Alert = require('../models/Alert');
const Session = require('../models/Session');

// Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const suspiciousActivitiesToday = await Alert.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
      $or: [{ severity: 'High' }, { severity: 'Medium' }],
    });
    const averageTrustScoreResult = await User.aggregate([
      {
        $group: {
          _id: null,
          averageTrustScore: { $avg: '$trustScore' },
        },
      },
    ]);
    const averageTrustScore = averageTrustScoreResult.length > 0 ? Math.round(averageTrustScoreResult[0].averageTrustScore) : 100;
    const activeAlerts = await Alert.countDocuments({ isRead: false });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // Set to the beginning of today

    const recentAnomalies = await Alert.find({
      createdAt: { $gte: startOfToday }, // CHANGED: Filter by start of today
      $or: [
        { severity: 'High' },
        { severity: 'high' }, // Added for robustness
        { message: /suspicious/i },
        { source: 'checkout' },
        { source: 'Session Tracking' }
      ],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Transform recentAnomalies to include timestamp from createdAt
    const transformedRecentAnomalies = recentAnomalies.map(alert => ({
      ...alert,
      timestamp: alert.createdAt, // Map createdAt to timestamp
    }));

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'email')
      .populate('items.product', 'price') // Populate the product details within items
      .lean();

    // Transform recentOrders to include userEmail and totalAmount
    const transformedRecentOrders = recentOrders.map(order => ({
      id: order._id,
      userEmail: order.user ? order.user.email : 'N/A',
      totalAmount: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt,
    }));

    res.json({
      analytics: {
        totalUsers,
        suspiciousActivitiesToday,
        averageTrustScore,
        activeAlerts,
      },
      anomalies: transformedRecentAnomalies, // Use the transformed anomalies
      recentOrders: transformedRecentOrders,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

// Analytics Data (for charts, etc.)
exports.getAnalyticsData = async (req, res) => {
  try {
    // Example: Users registered over time
    const usersByDate = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Example: Anomalies by severity
    const anomaliesBySeverity = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    // Example: Trust Score distribution (e.g., count users in score ranges)
    const trustScoreDistribution = await User.aggregate([
      {
        $bucket: {
          groupBy: '$trustScore',
          boundaries: [0, 20, 40, 60, 80, 101], // 0-19, 20-39, ..., 80-100
          default: 'Other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    // Example: Sessions over time
    const sessionsByDate = await Session.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      usersByDate,
      anomaliesBySeverity,
      trustScoreDistribution,
      sessionsByDate,
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
  }
};
const Alert = require('../models/Alert');

// GET /api/alerts - Get all alerts for admin or specific user
exports.getAllAlerts = async (req, res) => {
  try {
    const query = req.user && !req.user.isAdmin
      ? { userId: req.user.id }
      : {};

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to get alerts',
      error: err.message,
    });
  }
};

// PATCH /api/alerts/:id/read - Mark a specific alert as read
exports.markAlertAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.status(200).json(alert);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to mark alert as read',
      error: err.message,
    });
  }
};

// DELETE /api/alerts/:id - Delete a specific alert
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Optional: Add authorization check if only the user who created the alert
    // or an admin can delete it. Since the route is already protected by
    // authorizeRoles('admin'), only admins can reach this.
    // If you want to allow users to delete their own alerts, you'd need to
    // adjust the route protection and add a check like:
    // if (!req.user.isAdmin && alert.userId.toString() !== req.user.id) {
    //   return res.status(403).json({ message: 'Not authorized to delete this alert' });
    // }

    await Alert.deleteOne({ _id: req.params.id }); // Use deleteOne for clarity

    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (err) {
    console.error('Failed to delete alert:', err);
    res.status(500).json({
      message: 'Failed to delete alert',
      error: err.message,
    });
  }
};
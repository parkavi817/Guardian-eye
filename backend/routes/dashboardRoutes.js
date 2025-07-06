const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalyticsData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(protect, authorizeRoles('admin'));
router.get('/', getDashboardStats);
router.get('/analytics', getAnalyticsData);

module.exports = router;

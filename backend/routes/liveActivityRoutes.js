const express = require('express');
const router = express.Router();
const { getLiveActivities } = require('../controllers/liveActivityController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.get('/', protect, authorizeRoles('admin'), getLiveActivities);

module.exports = router;
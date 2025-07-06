const express = require('express');
const router = express.Router();
const { getAllAlerts, markAlertAsRead, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(protect, authorizeRoles('admin'));
router.get('/', getAllAlerts);
router.patch('/:id/read', markAlertAsRead);
router.delete('/:id', deleteAlert);

module.exports = router;
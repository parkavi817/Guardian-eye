const express = require('express');
const router = express.Router();
const { detectAnomaly, logBehavioralAnomaly, getAllAnomalies, markAnomalyAsRead, deleteAnomaly } = require('../controllers/anomalyController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.get('/', protect, authorizeRoles('admin'), getAllAnomalies);
router.post('/behavior', logBehavioralAnomaly);
router.patch('/:id/read', protect, authorizeRoles('admin'), markAnomalyAsRead);
router.delete('/:id', protect, authorizeRoles('admin'), deleteAnomaly);

module.exports = router;
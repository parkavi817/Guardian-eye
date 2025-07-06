const express = require('express');
const router = express.Router();
const { getRules, createRule, toggleRule, deleteRule, updateRule } = require('../controllers/ruleController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(protect, authorizeRoles('admin'));
router.get('/', getRules);
router.post('/', createRule);
router.patch('/:id', toggleRule); // Keep this for specific toggle functionality
router.put('/:id', updateRule); // NEW: Route for updating an entire rule
router.delete('/:id', deleteRule);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, deleteUser, updateUserStatus, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(protect);
router.get('/me', getProfile);
router.put('/update', updateProfile);
router.get('/all', authorizeRoles('admin'), getAllUsers); // Apply admin role check here
router.delete('/:id', authorizeRoles('admin'), deleteUser); // Apply admin role check here
router.patch('/:id/status', authorizeRoles('admin'), updateUserStatus);
router.put('/change-password', changePassword);

module.exports = router;
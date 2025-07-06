const express = require('express');
const router = express.Router();
const { trackSession, getSessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');


router.use(protect);
router.post('/track', trackSession);
router.get('/', getSessions);


module.exports = router;

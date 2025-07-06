const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCart);
router.post('/item', addToCart); // updated from /add to /item
router.patch('/item/:productId', updateCartItem); // NEW
router.delete('/item/:productId', removeFromCart); // updated path

module.exports = router;

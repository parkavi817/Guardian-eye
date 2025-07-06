const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');

// Get wishlist
exports.getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items');

  if (!wishlist) {
    // Log user activity even if wishlist is empty
    await UserActivity.create({
      user: req.user.id,
      actionType: 'VIEW_WISHLIST',
      details: {
        itemCount: 0,
      },
    });
    return res.json({ items: [] });
  }

  const items = wishlist.items.map(product => ({
    id: product._id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    description: product.description
  }));

  // Log user activity
  await UserActivity.create({
    user: req.user.id,
    actionType: 'VIEW_WISHLIST',
    details: {
      itemCount: items.length,
    },
  });

  res.json({ items });
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, items: [productId] });
  } else {
    if (!wishlist.items.includes(productId)) {
      wishlist.items.push(productId);
    }
  }

  await wishlist.save();

  // Log user activity
  const product = await Product.findById(productId); // Fetch product details for logging
  await UserActivity.create({
    user: userId,
    actionType: 'ADD_TO_WISHLIST',
    details: {
      productId: productId,
      productName: product ? product.name : 'Unknown Product',
    },
  });

  res.json({ message: 'Product added to wishlist', items: wishlist.items });
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { items: productId } },
    { new: true }
  ).populate('items');

  const items = wishlist.items.map(product => ({
    id: product._id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    description: product.description
  }));

  // Log user activity
  await UserActivity.create({
    user: req.user.id,
    actionType: 'REMOVE_FROM_WISHLIST',
    details: {
      productId: productId,
    },
  });

  res.json({ message: 'Product removed from wishlist', items });
};
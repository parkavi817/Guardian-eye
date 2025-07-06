const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const alertRoutes = require('./routes/alertRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes'); // ✅ NEW
const liveActivityRoutes = require('./routes/liveActivityRoutes');
const errorHandler = require('./middleware/errorHandler');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/anomaly', anomalyRoutes); // ✅ ADD THIS
app.use('/api/admin/live-activity', liveActivityRoutes);
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://vapemaster.netlify.app',
      'https://admin222.netlify.app'
    ];
    console.log('Request Origin:', origin); // Debug origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/user', require('./routes/user.js'));
app.use('/api/category', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/imageUpload', require('./helper/imageUpload.js'));
app.use('/api/productWeight', require('./routes/productWeight.js'));
app.use('/api/productRAMS', require('./routes/productRAMS.js'));
app.use('/api/productSIZE', require('./routes/productSize.js'));
app.use('/api/productReviews', require('./routes/productReviews.js'));
app.use('/api/cart', require('./routes/cart.js'));
app.use('/api/my-list', require('./routes/myList.js'));
app.use('/api/orders', require('./routes/orders.js'));
app.use('/api/homeBanner', require('./routes/homeBanner.js'));
app.use('/api/search', require('./routes/search.js'));
app.use('/api/banners', require('./routes/banners.js'));
app.use('/api/homeSideBanners', require('./routes/homeSideBanner.js'));
app.use('/api/homeBottomBanners', require('./routes/homeBottomBanner.js'));
app.use('/api/cashfree-token', require('./routes/cashfree.js'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.header('Access-Control-Allow-Origin', 'https://admin222.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(500).json({ message: 'Server error', error: err.message, success: false });
});

// Database connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ Database connected successfully');
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });
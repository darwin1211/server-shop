// index.js - Production-ready Express server entry point

// Load environment variables from .env file
require('dotenv').config();
console.log('CLIENT_BASE_URL:', process.env.CLIENT_BASE_URL);
console.log('CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID);

// Require dependencies
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Create Express app
const app = express();

// Middleware: parse JSON and enable CORS
app.use(express.json());    // for parsing application/json:contentReference[oaicite:6]{index=6}
app.use(cors());            // enable CORS for all routes:contentReference[oaicite:7]{index=7}

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connection successful'))  // log on successful DB connect:contentReference[oaicite:8]{index=8}
    .catch(err => console.error('MongoDB connection error:', err));

// Import route modules
const userRoutes            = require('./routes/user');
const categoryRoutes        = require('./routes/categories');
const productRoutes         = require('./routes/products');
const imageUploadRoutes     = require('./routes/imageUpload');
const productWeightRoutes   = require('./routes/productWeight');
const productRAMSRoutes     = require('./routes/productRAMS');
const productSizeRoutes     = require('./routes/productSize');
const productReviewsRoutes  = require('./routes/productReviews');
const cartRoutes            = require('./routes/cart');
const myListRoutes          = require('./routes/myList');
const ordersRoutes          = require('./routes/orders');
const homeBannerRoutes      = require('./routes/homeBanner');
const searchRoutes          = require('./routes/search');
const bannersRoutes         = require('./routes/banners');
const homeSideBannerRoutes  = require('./routes/homeSideBanner');
const homeBottomBannerRoutes= require('./routes/homeBottomBanner');
const cashfreeRoutes        = require('./routes/cashfree');

// Mount routes (patterns per Express guide:contentReference[oaicite:9]{index=9})
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/imageUpload', imageUploadRoutes);
app.use('/api/productWeight', productWeightRoutes);
app.use('/api/productRAMS', productRAMSRoutes);
app.use('/api/productSIZE', productSizeRoutes);
app.use('/api/productReviews', productReviewsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/my-list', myListRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/homeBanner', homeBannerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/homeSideBanners', homeSideBannerRoutes);
app.use('/api/homeBottomBanners', homeBottomBannerRoutes);
app.use('/api/cashfree-token', cashfreeRoutes);

// Start the server on the specified port (default 8000)
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);  // confirm server start:contentReference[oaicite:10]{index=10}
});

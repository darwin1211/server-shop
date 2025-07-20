const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Static folder for images
app.use("/uploads", express.static("uploads"));

// Route imports
const userRoutes = require('./routes/user.js');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const productWeightRoutes = require('./routes/productWeight.js');
const productRAMSRoutes = require('./routes/productRAMS.js');
const productSIZESRoutes = require('./routes/productSize.js');
const productReviews = require('./routes/productReviews.js');
const cartRoutes = require('./routes/cart.js');
const myListRoutes = require('./routes/myList.js');
const ordersRoutes = require('./routes/orders.js');
const homeBannerRoutes = require('./routes/homeBanner.js');
const searchRoutes = require('./routes/search.js');
const bannersRoutes = require('./routes/banners.js');
const homeSideBannerRoutes = require('./routes/homeSideBanner.js');
const homeBottomBannerRoutes = require('./routes/homeBottomBanner.js');
const cashfreeRoutes = require('./routes/cashfree.js');

// Optional: Load imageUpload if exists
try {
  const imageUploadRoutes = require('./routes/imageUpload.js');
  app.use('/api/imageUpload', imageUploadRoutes);
} catch (err) {
  console.warn('⚠️ Warning: imageUpload.js not found. Skipping image upload route.');
}

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/productWeight", productWeightRoutes);
app.use("/api/productRAMS", productRAMSRoutes);
app.use("/api/productSIZE", productSIZESRoutes);
app.use("/api/productReviews", productReviews);
app.use("/api/cart", cartRoutes);
app.use("/api/my-list", myListRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/homeBanner", homeBannerRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/homeSideBanners", homeSideBannerRoutes);
app.use("/api/homeBottomBanners", homeBottomBannerRoutes);

// ✅ Cashfree route
app.use("/api", cashfreeRoutes); // e.g. POST /api/cashfree-token

// MongoDB connection and server start
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

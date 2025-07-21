<<<<<<< HEAD
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

// ─── REQUEST PARSING ────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(express.json());

// ─── ROUTES ────────────────────────────────────────────────────────────────────
const userRoutes = require("./routes/user.js");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const imageUploadRoutes = require("./helper/imageUpload.js");
const productWeightRoutes = require("./routes/productWeight.js");
const productRAMSRoutes = require("./routes/productRAMS.js");
const productSIZESRoutes = require("./routes/productSize.js");
const productReviews = require("./routes/productReviews.js");
const cartRoutes = require("./routes/cart.js");
const myListRoutes = require("./routes/myList.js");
const ordersRoutes = require("./routes/orders.js");
const homeBannerRoutes = require("./routes/homeBanner.js");
const searchRoutes = require("./routes/search.js");
const bannersRoutes = require("./routes/banners.js");
const homeSideBannerRoutes = require("./routes/homeSideBanner.js");
const homeBottomBannerRoutes = require("./routes/homeBottomBanner.js");

// Cashfree payment route
const cashfreeRoutes = require("./routes/cashfree.js");

// Mount routes
app.use("/api/user", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/imageUpload", imageUploadRoutes);
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
app.use("/api/cashfree-token", cashfreeRoutes);

// ─── DATABASE & SERVER START ──────────────────────────────────────────────────
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Database connected successfully");
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
=======
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());       // parse JSON request bodies
app.use(cors());               // allow CORS for all routes:contentReference[oaicite:8]{index=8}

// Token creation route
app.post('/api/cashfree-token', async (req, res) => {
  try {
    const { orderId, orderAmount } = req.body;
    if (!orderId || !orderAmount) {
      return res.status(400).json({ error: 'orderId and orderAmount required' });
    }
    // Call Cashfree "Create Order" API to get a payment_session_id (order token)
    const cfRes = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      {
        order_currency: 'INR',
        order_amount: orderAmount,
        customer_details: {
          customer_id: 'CUST_ID'       // provide your customer ID or use a dynamic value
        },
        order_id: orderId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2025-01-01',
          'x-client-id': process.env.CASHFREE_APP_ID,     // set in env
          'x-client-secret': process.env.CASHFREE_SECRET_KEY
        }
      }
    );
    // Respond with the Cashfree order token (payment_session_id)
    return res.json({ orderToken: cfRes.data.payment_session_id });
  } catch (error) {
    console.error('Cashfree token error', error.response?.data || error.message);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
>>>>>>> cbab385bba3c2d7ef874a9ffb9668bbe17d916c8

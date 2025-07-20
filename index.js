// index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Your other route imports
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

// Cashfree route
const cashfreeRoutes = require("./routes/cashfree.js");

// Mount your routes
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

// ─── Cashfree ────────────────────────────────────────────────────────────
// This mounts POST /api/cashfree-token to the router in routes/cashfree.js
app.use("/api/cashfree-token", cashfreeRoutes);

// MongoDB connection & start server
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

// routes/cashfree.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

// Health‑check endpoint (GET /api/cashfree-token)
router.get("/", (req, res) => {
  return res.status(200).json({ msg: "Cashfree route is alive" });
});

// POST /api/cashfree-token
router.post("/", async (req, res) => {
  try {
    const { amount, userId, email, phone, name } = req.body;

    // ✅ Generate unique order ID
    const orderId = "ORDER_" + Date.now();

    // ✅ Build Cashfree order payload
    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId || "guest",
        customer_email: email,
        customer_phone: phone,
        customer_name: name,
      },
      order_meta: {
        // ✅ Return the actual order ID in return_url
        return_url: `https://vapemaster.netlify.app/payment-success?order_id=${orderId}`,
      },
    };

    // ✅ Send request to Cashfree Orders API
    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const sessionId = response.data.payment_session_id;
    if (!sessionId) {
      throw new Error("No payment_session_id returned from Cashfree");
    }

    return res.status(200).json({
      payment_session_id: sessionId,
      order_id: orderId, // Optional: send this back too
    });
  } catch (error) {
    console.error("❌ Cashfree Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Cashfree token generation failed",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;

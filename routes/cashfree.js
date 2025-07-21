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
    const orderId = "ORDER_" + Date.now();

    // Build payload for Cashfree Orders API
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
        return_url: `${process.env.CLIENT_BASE_URL}/payment-success?order_id={order_id}`,
      },
    };

    // Call Cashfree to create an order & session
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

    // Extract payment_session_id
    const sessionId = response.data.payment_session_id;
    if (!sessionId) {
      throw new Error("No payment_session_id in Cashfree response");
    }

    // Send it back to client
    return res.status(200).json({ payment_session_id: sessionId });
  } catch (error) {
    console.error("❌ Cashfree Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Cashfree token generation failed",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;

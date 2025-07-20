// routes/cashfree.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config(); // only needed if not already loaded in main file

router.post("/api/cashfree-token", async (req, res) => {
  try {
    const { amount, userId, email, phone, name } = req.body;

    const orderId = `ORDER_${Date.now()}`;

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
    };

    const response = await axios.post("https://api.cashfree.com/pg/orders", payload, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        "x-api-version": "2022-09-01",
      },
    });

    const sessionId = response.data.payment_session_id;
    return res.status(200).json({ payment_session_id: sessionId });

  } catch (error) {
    console.error("❌ Error from Cashfree:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Cashfree token generation failed",
      details: error?.response?.data || error.message,
    });
  }
});

module.exports = router;

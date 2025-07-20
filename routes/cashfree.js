// routes/cashfree.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

// Create Cashfree payment session
router.post("/cashfree-token", async (req, res) => {
  const { amount, email, phone, name, userId } = req.body;

  const orderId = `order_${Date.now()}`;
  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: userId,
      customer_email: email,
      customer_phone: phone,
      customer_name: name,
    },
  };

  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "content-type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        },
      }
    );

    res.json({ payment_session_id: response.data.payment_session_id });
  } catch (error) {
    console.error("Cashfree error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate payment session" });
  }
});

module.exports = router;

const express = require('express');
const axios = require('axios');
const router = express.Router();

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "TEST"; // Use "PROD" in production

const BASE_URL =
  CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

router.post('/cashfree-token', async (req, res) => {
  try {
    const { orderId, orderAmount, customerName, customerEmail, customerPhone } = req.body;

    const tokenRes = await axios.post(
      `${BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: customerEmail,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        }
      },
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "content-type": "application/json",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY
        }
      }
    );

    const { payment_session_id } = tokenRes.data;

    res.json({ paymentSessionId: payment_session_id });
  } catch (err) {
    console.error("Cashfree error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to create Cashfree session" });
  }
});

module.exports = router;

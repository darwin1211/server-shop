// server-shop/routes/cashfree.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

require("dotenv").config();

router.get("/", (req, res) => {
  res.send("✅ Cashfree route working. Use POST to generate token.");
});

router.post("/", async (req, res) => {
  const { orderId, orderAmount, customerName, customerEmail, customerPhone } = req.body;

  const headers = {
    "x-client-id": process.env.CASHFREE_CLIENT_ID,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
    "x-api-version": "2022-09-01",
    "Content-Type": "application/json",
  };

  const data = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: "INR",
    customer_details: {
      customer_id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    },
  };

  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      data,
      { headers }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Cashfree error:", err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data || "Payment creation failed" });
  }
});

module.exports = router;

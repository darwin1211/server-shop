const express = require("express");
const router = express.Router();
const axios = require("axios");

// Now define POST on `/` instead of `/cashfree-token`
router.post("/", async (req, res) => {
  const { amount, userId, email, phone, name } = req.body;
  try {
    const authHeader = Buffer.from(
      `${process.env.CASHFREE_APP_ID}:${process.env.CASHFREE_SECRET_KEY}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_email: email,
          customer_phone: phone,
          customer_name: name,
        },
      },
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
        },
      }
    );

    res.json({ payment_session_id: response.data.payment_session_id });
  } catch (err) {
    console.error("Cashfree Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate payment session" });
  }
});

module.exports = router;

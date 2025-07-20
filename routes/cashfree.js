const express = require("express");
const router = express.Router();
const axios = require("axios");

// @route   POST /api/cashfree-token
// @desc    Generate Cashfree payment session ID
// @access  Public
router.post("/", async (req, res) => {
  const { amount, userId, email, phone, name } = req.body;

  try {
    // Log to verify keys are loaded
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({ error: "Cashfree keys not configured" });
    }

    // Encode credentials in Base64
    const authHeader = Buffer.from(
      `${process.env.CASHFREE_APP_ID}:${process.env.CASHFREE_SECRET_KEY}`
    ).toString("base64");

    // Create order using Cashfree API
    const response = await axios.post(
      "https://api.cashfree.com/pg/orders", // ✅ PRODUCTION URL
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

    // Return session ID to frontend
    return res.status(200).json({
      payment_session_id: response.data.payment_session_id,
    });

  } catch (err) {
    console.error("Cashfree Error:", err.response?.data || err.message);

    const errorMessage =
      err.response?.data?.message || "Failed to generate payment session";

    return res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;

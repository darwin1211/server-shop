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
<<<<<<< HEAD
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
=======
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
>>>>>>> cbab385bba3c2d7ef874a9ffb9668bbe17d916c8
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

<<<<<<< HEAD
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
=======
    const { payment_session_id } = tokenRes.data;

    res.json({ paymentSessionId: payment_session_id });
  } catch (err) {
    console.error("Cashfree error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to create Cashfree session" });
>>>>>>> cbab385bba3c2d7ef874a9ffb9668bbe17d916c8
  }
});

module.exports = router;

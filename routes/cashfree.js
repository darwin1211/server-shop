// routes/cashfree.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'TEST'; // Use 'PROD' in production

const BASE_URL = CASHFREE_ENV === 'PROD'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Endpoint: POST /api/cashfree-token
router.post('/', async (req, res) => {
  try {
    const { amount, userId, email, phone, name } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Generate a unique order ID
    const orderId = 'ORDER_' + Date.now();

    // Build Cashfree order payload
    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId || 'guest',
        customer_email: email,
        customer_phone: phone,
        customer_name: name,
      },
      order_meta: {
        return_url: `https://vapemaster.netlify.app/payment-success?order_id=${orderId}`,
      },
    };

    // Send request to Cashfree Orders API
    const cfRes = await axios.post(
      `${BASE_URL}/orders`,
      payload,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-version': '2022-09-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
        },
      }
    );

    const sessionId = cfRes.data.payment_session_id;
    if (!sessionId) {
      throw new Error('No payment_session_id returned from Cashfree');
    }

    // Respond with session ID and order ID
    return res.status(200).json({
      payment_session_id: sessionId,
      order_id: orderId,
    });
  } catch (error) {
    console.error('❌ Cashfree Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Cashfree token generation failed',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;

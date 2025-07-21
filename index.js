const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());       // parse JSON request bodies
app.use(cors());               // allow CORS for all routes:contentReference[oaicite:8]{index=8}

// Token creation route
app.post('/api/cashfree-token', async (req, res) => {
  try {
    const { orderId, orderAmount } = req.body;
    if (!orderId || !orderAmount) {
      return res.status(400).json({ error: 'orderId and orderAmount required' });
    }
    // Call Cashfree "Create Order" API to get a payment_session_id (order token)
    const cfRes = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      {
        order_currency: 'INR',
        order_amount: orderAmount,
        customer_details: {
          customer_id: 'CUST_ID'       // provide your customer ID or use a dynamic value
        },
        order_id: orderId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2025-01-01',
          'x-client-id': process.env.CASHFREE_APP_ID,     // set in env
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
        }
      }
    );
    // Respond with the Cashfree order token (payment_session_id)
    return res.json({ orderToken: cfRes.data.payment_session_id });
  } catch (error) {
    console.error('Cashfree token error', error.response?.data || error.message);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cashfreeRoutes = require('./routes/cashfree');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/cashfree-token', cashfreeRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// routes/cashfree.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

router.post('/', async (req, res) => {
  try {
    const { orderId, orderAmount, customerEmail, customerPhone } = req.body;

    const response = await axios.post(
      'https://api.cashfree.com/pg/orders',
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerEmail,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2022-09-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Cashfree token error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate Cashfree token' });
  }
});

module.exports = router;

// .env (not part of JS code but must be in project root)
// CASHFREE_APP_ID=your_cashfree_app_id
// CASHFREE_SECRET_KEY=your_cashfree_secret_key

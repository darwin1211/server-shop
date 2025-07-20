const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/orders'); // Adjust path if needed
require('dotenv').config();

// STEP 1: Create payment order with Cashfree
router.post('/token', async (req, res) => {
    const { userId, products, amount, email, phone } = req.body;

    const orderId = `ORD_${Date.now()}`;

    try {
        const headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY
        };

        const data = {
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_email: email,
                customer_phone: phone
            }
        };

        const response = await axios.post(
            "https://sandbox.cashfree.com/pg/orders",
            data,
            { headers }
        );

        // Save to MongoDB
        const newOrder = new Order({
            user: userId,
            products,
            amount,
            status: "PENDING",
            orderId
        });

        await newOrder.save();

        res.json({
            success: true,
            tokenData: response.data,
            orderId
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, error: "Cashfree order creation failed" });
    }
});

module.exports = router;

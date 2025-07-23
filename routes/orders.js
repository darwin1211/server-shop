const { Orders } = require('../models/orders');
const express = require('express');
const router = express.Router();

router.get(`/sales`, async (req, res) => {
  try {
    const currentYear = parseInt(req.query.year) || new Date().getFullYear();
    console.log('Fetching sales for year:', currentYear); // Debug

    const ordersList = await Orders.find();
    if (!ordersList) {
      return res.status(200).json({
        totalSales: 0,
        monthlySales: [],
        success: true
      });
    }

    let totalSales = 0;
    const monthlySales = [
      { month: 'JAN', sale: 0 },
      { month: 'FEB', sale: 0 },
      { month: 'MAR', sale: 0 },
      { month: 'APRIL', sale: 0 },
      { month: 'MAY', sale: 0 },
      { month: 'JUNE', sale: 0 },
      { month: 'JULY', sale: 0 },
      { month: 'AUG', sale: 0 },
      { month: 'SEP', sale: 0 },
      { month: 'OCT', sale: 0 },
      { month: 'NOV', sale: 0 },
      { month: 'DEC', sale: 0 },
    ];

    for (const order of ordersList) {
      totalSales += parseFloat(order.amount) || 0;
      const orderDate = new Date(order.date);
      const year = orderDate.getFullYear();
      const month = orderDate.getMonth(); // 0-based (0 = Jan, 11 = Dec)

      if (year === currentYear) {
        monthlySales[month].sale += parseFloat(order.amount) || 0;
      }
    }

    return res.status(200).json({
      totalSales,
      monthlySales,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/orders/sales:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/`, async (req, res) => {
  try {
    const ordersList = await Orders.find(req.query);
    return res.status(200).json(ordersList || []);
  } catch (error) {
    console.error('Error in /api/orders:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false, orders: [] });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Order ID', success: false });
    }
    const order = await Orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found', success: false });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error in /api/orders/:id:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const orderCount = await Orders.countDocuments();
    return res.status(200).json({ orderCount, success: true });
  } catch (error) {
    console.error('Error in /api/orders/get/count:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log('Order create body:', req.body); // Debug
    const requiredFields = ['name', 'phoneNumber', 'address', 'pincode', 'amount', 'email', 'userid', 'products'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}`, success: false });
      }
    }

    const order = new Orders({
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      pincode: req.body.pincode,
      amount: parseFloat(req.body.amount),
      paymentId: req.body.paymentId || '',
      email: req.body.email,
      userid: req.body.userid,
      products: req.body.products,
      date: req.body.date || Date.now(),
      status: req.body.status || 'pending'
    });

    const savedOrder = await order.save();
    return res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error in /api/orders/create:', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Order ID', success: false });
    }
    const deletedOrder = await Orders.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found', success: false });
    }
    return res.status(200).json({ message: 'Order deleted', success: true });
  } catch (error) {
    console.error('Error in /api/orders/:id (DELETE):', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Order ID', success: false });
    }
    const requiredFields = ['name', 'phoneNumber', 'address', 'pincode', 'amount', 'email', 'userid', 'products', 'status'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}`, success: false });
      }
    }

    const order = await Orders.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        pincode: req.body.pincode,
        amount: parseFloat(req.body.amount),
        paymentId: req.body.paymentId || '',
        email: req.body.email,
        userid: req.body.userid,
        products: req.body.products,
        status: req.body.status,
        date: req.body.date || Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found', success: false });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error in /api/orders/:id (PUT):', error.stack);
    return res.status(500).json({ message: 'Server error', error: error.message, success: false });
  }
});

module.exports = router;
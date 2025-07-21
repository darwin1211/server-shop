const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cashfreeRoutes = require('./routes/cashfree'); // Ensure this path matches your folder structure

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // In production, replace with your frontend URL: 'https://vapemaster.netlify.app'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api', cashfreeRoutes);

// Root Test Route
app.get('/', (req, res) => {
  res.send('Cashfree Backend is Running...');
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

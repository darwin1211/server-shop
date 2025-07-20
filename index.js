const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load env based on NODE_ENV
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

// Debug logs
console.log('✅ NODE_ENV:', process.env.NODE_ENV);
console.log('✅ CLIENT_BASE_URL:', process.env.CLIENT_BASE_URL);

app.use(cors());
app.use(express.json());

// Import routes
const userRoutes           = require('./routes/user.js');
const categoryRoutes       = require('./routes/categories');
const productRoutes        = require('./routes/products');
// … your other routes …
const cashfreeRoutes       = require('./routes/cashfree.js');

// Mount routes
app.use('/api/user', userRoutes);
// … mount other routes …
app.use('/api', cashfreeRoutes);  // ⇨ POST /api/cashfree-token

// Connect MongoDB & start server
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Database connected successfully');
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

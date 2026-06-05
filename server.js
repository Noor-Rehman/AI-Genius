const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');

// Load environment variables FIRST
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ===== MIDDLEWARE =====
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies (needed for refresh token)

// ===== ROUTES =====
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));

// ===== ROOT HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ status: 'success', message: '🚀 AI-Genius API is running!' });
});

// ===== CENTRALIZED ERROR HANDLER =====
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
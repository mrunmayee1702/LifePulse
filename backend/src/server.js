const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO Server
initSocket(server);

// Security & Utility Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Express API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LifePulse API',
    stage: 'Stage 11 Production Hardening, Final QA & Deployment Readiness',
    timestamp: new Date().toISOString(),
  });
});

// Root entry fallback
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LifePulse Backend API' });
});

// Global Express Error Handler Middleware (Prevents raw stack trace leakage)
app.use((err, req, res, next) => {
  console.error('[LifePulse Unhandled Server Error]:', err.stack || err.message);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isPublic ? err.message : 'An internal server error occurred.',
    code: err.code || 'INTERNAL_SERVER_ERROR',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`[LifePulse Backend] Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[LifePulse Backend Startup Error]: Failed to connect to MongoDB Atlas.', err);
    });
}

module.exports = app;

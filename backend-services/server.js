const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const redisClient = require('./config/redis');
const appwriteService = require('./services/appwriteService');
const locationRoutes = require('./routes/location');
const emergencyRoutes = require('./routes/emergency');
const policeRoutes = require('./routes/police');
const { initializeSocketHandlers } = require('./services/socketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.POLICE_DASHBOARD_URL || "http://localhost:3001"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    process.env.POLICE_DASHBOARD_URL || "http://localhost:3001"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
    appwrite: appwriteService.isInitialized() ? 'initialized' : 'not initialized'
  });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/location`, locationRoutes);
app.use(`${apiPrefix}/emergency`, emergencyRoutes);
app.use(`${apiPrefix}/police`, policeRoutes);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8000;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    redisClient.quit();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    redisClient.quit();
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Yatri Suraksha Backend Server running on port ${PORT}`);
  console.log(`📍 Location tracking service active`);
  console.log(`🚨 Emergency services ready`);
  console.log(`👮 Police dashboard API available`);
});
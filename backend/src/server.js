import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// env must be imported first so missing vars cause an early exit
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import routes
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import userRoutes from './routes/users.js';
import walletRoutes from './routes/wallet.js';
import challengeRoutes from './routes/challenges.js';
import rankingRoutes from './routes/ranking.js';
import storeRoutes from './routes/store.js';
import adsRoutes from './routes/ads.js';
import aiRoutes from './routes/ai.js';
import uploadsRoutes from './routes/uploads.js';
import notificationsRoutes from './routes/notifications.js';

import mongoose from 'mongoose';

const app = express();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Security middleware
app.use(helmet());

// Request logging (concise in production, verbose in development)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS – allow-list driven by ALLOWED_ORIGINS env variable
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    callback(err);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Serve generated PDF contracts for download
app.use('/api/contracts', express.static(path.join(__dirname, '..', 'contracts')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 TrampoHero API Server running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Allowed origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
});

export default app;


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
import kycRoutes from './routes/kyc.js';
import referralRoutes from './routes/referral.js';
import paymentsRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import analyticsRoutes from './routes/analytics.js';
import disputesRoutes from './routes/disputes.js';
import contractsRoutes from './routes/contracts.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';
import consentRoutes from './routes/consents.js';

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
// NOTE: /api/payments/webhook must receive the raw body for Stripe signature verification,
// so it is registered here – before the global express.json() – with express.raw().
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
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
app.use('/api/kyc', kycRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/disputes', disputesRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consents', consentRoutes);

// Serve generated PDF contracts via authenticated route in contracts router
app.use('/api/contracts', contractsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const db = dbReadyState === 1 ? 'connected' : 'disconnected';
  const status = db === 'connected' ? 'ok' : 'degraded';

  res.set('Cache-Control', 'no-store');
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    db,
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const rawStatusCode = Number(err.status);
  const statusCode = Number.isInteger(rawStatusCode) && rawStatusCode >= 100 && rawStatusCode <= 599
    ? rawStatusCode
    : 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err.stack);
  const shouldMaskError = env.NODE_ENV === 'production' && statusCode >= 500;
  res.status(statusCode).json({
    error: shouldMaskError ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 TrampoHero API Server running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Allowed origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
});

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10000;
// Mongoose readyState numeric values:
// 0 = disconnected, 3 = disconnecting
const MONGOOSE_READY_STATE_DISCONNECTED = 0;
const MONGOOSE_READY_STATE_DISCONNECTING = 3;

let isShuttingDown = false;
function closeMongoConnection() {
  if (
    mongoose.connection.readyState === MONGOOSE_READY_STATE_DISCONNECTED ||
    mongoose.connection.readyState === MONGOOSE_READY_STATE_DISCONNECTING
  ) {
    return Promise.resolve();
  }

  return mongoose.connection.close().catch((mongoError) => {
    console.error(`[${new Date().toISOString()}] Error closing MongoDB connection during shutdown:`, mongoError);
    return Promise.resolve();
  });
}

function shutdown(signalOrReason, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error(`[${new Date().toISOString()}] Shutdown triggered: ${signalOrReason}`);

  const forceShutdownTimer = setTimeout(() => {
    const forceShutdownExitCode = exitCode === 0 ? 1 : exitCode;
    console.error(`[${new Date().toISOString()}] Forced shutdown due to timeout`);
    process.exit(forceShutdownExitCode);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
  forceShutdownTimer.unref();

  server.close((serverError) => {
    if (serverError) {
      console.error(`[${new Date().toISOString()}] Error closing HTTP server during shutdown:`, serverError);
    }
    closeMongoConnection().finally(() => {
      clearTimeout(forceShutdownTimer);
      process.exit(exitCode);
    });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
  shutdown('uncaughtException', 1);
});

export default app;

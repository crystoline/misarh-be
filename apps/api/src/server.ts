import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import cartRoutes from './routes/cart.routes';
import ordersRoutes from './routes/orders.routes';
import wishlistRoutes from './routes/wishlist.routes';
import consultationsRoutes from './routes/consultations.routes';
import newsletterRoutes from './routes/newsletter.routes';
import contactRoutes from './routes/newsletter.routes'; // Contact uses same file
import usersRoutes from './routes/users.routes';
import uploadRoutes from './routes/upload.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import adminRoutes from './routes/admin.routes';

// Load environment variables from monorepo root
dotenv.config({ path: '../../.env' });

// Debug: Log environment variables to verify they're loaded
console.log('🔍 Environment Variables Check:');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST || 'NOT SET');
console.log('DATABASE_PORT:', process.env.DATABASE_PORT || 'NOT SET');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME || 'NOT SET');
console.log('DATABASE_USER:', process.env.DATABASE_USER || 'NOT SET');
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '***SET***' : 'NOT SET');
console.log('---');

const app: Application = express();
const PORT = process.env.API_PORT || 3000;

/**
 * Middleware Configuration
 */

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

/**
 * Routes
 */

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'MISARH API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/consultations', consultationsRoutes);
app.use('/newsletter', newsletterRoutes);
app.use('/contact', contactRoutes);
app.use('/users', usersRoutes);
app.use('/upload', uploadRoutes);
app.use('/subscriptions', subscriptionsRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to Redis
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🌸 MISARH API Server Started 🌸    ║
║                                       ║
║   Port: ${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
║   Time: ${new Date().toLocaleString()}  ║
║                                       ║
╚═══════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trades.js';
import journalRoutes from './routes/journal.js';
import tagRoutes from './routes/tags.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('   Please set JWT_SECRET in your .env file');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL ERROR: JWT_SECRET must be at least 32 characters long!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDatabase();
console.log('✓ Database initialized');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now, configure based on your needs
  crossOriginEmbedderPolicy: false
}));

// CORS configuration with validation
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173', // Always allow local development
  'https://flobros.de',
  'https://www.flobros.de', // Also allow www subdomain
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow local network access (LAN IPs)
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.|192\.168\.|10\.)/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Support large journal entries with images

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/tags', tagRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));

  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  // Error handling middleware (development only, production uses SPA catch-all)
  app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  // 404 handler (development only)
  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

// Global error handler (always needed)
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { loadRoutes } from './lib/route-loader';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = '/api';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Cookie parser - must be before other middleware that need cookies
app.use(cookieParser());

// Raw body parser for webhook routes (must be before json parser)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON and URL-encoded body parsers for other routes
// Skip body parsing for multipart/form-data (handled by route adapters)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    // Skip body parsing for multipart requests - let the adapter handle it
    return next();
  }
  // For other content types, use standard parsers
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    // Skip URL-encoded parsing for multipart requests
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  });
});

// API routes - automatically loaded from server/src/routes/
async function setupRoutes() {
  try {
    await loadRoutes(app);
  } catch (error) {
    console.error('Failed to load routes:', error);
    process.exit(1);
  }
}

// Initialize routes before starting server
setupRoutes().then(() => {
  // 404 handler (must be after all routes)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.path,
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}${API_PREFIX}`);
  });
});

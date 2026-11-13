
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import auth from './routes/auth.js';
import entries from './routes/entries.js';

export function createApp() {
  const app = express();

  // Hardcoded allowed frontend domains
  const allowedOrigins = [
    'https://YOUR-VERCEL-DOMAIN.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  app.disable('x-powered-by');

  // Render proxy configuration
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error('Blocked CORS origin:', origin);

      return callback(new Error('Origin not allowed by CORS'));
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    optionsSuccessStatus: 204
  }));

  // Disable API caching
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Request parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Rate limiting
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 180,
      standardHeaders: 'draft-8',
      legacyHeaders: false
    })
  );

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Backend is running'
    });
  });

  // API routes
  app.use('/api/auth', auth);
  app.use('/api/entries', entries);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Not found.'
    });
  });

  // Error handler
  app.use((error, req, res, next) => {
    const status =
      error.code === 11000 ? 409 :
      error.code === 'LIMIT_FILE_SIZE' ? 413 :
      ['ValidationError', 'CastError', 'MulterError'].includes(error.name) ? 400 :
      error.message === 'Origin not allowed by CORS' ? 403 :
      error.status || 500;

    if (status === 500) {
      console.error(error);
    }

    res.status(status).json({
      message:
        error.code === 11000
          ? 'Email or username already exists.'
          : status === 500
            ? 'Something went wrong. Please try again.'
            : error.message
    });
  });

  return app;
}

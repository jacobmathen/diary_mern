
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import auth from './routes/auth.js';
import entries from './routes/entries.js';

export function createApp() {
  const app = express();

  // Support multiple frontend origins.
  // Example: https://daybook.vercel.app,https://daybook.com
  const configuredOrigins = (
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    'http://localhost:5173'
  )
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  const allowedOrigins = new Set(
    configuredOrigins.map(value => new URL(value).origin)
  );

  // Allow local development aliases outside production.
  if (process.env.NODE_ENV !== 'production') {
    for (const hostname of ['localhost', '127.0.0.1']) {
      allowedOrigins.add(`http://${hostname}:5173`);
    }
  }

  app.disable('x-powered-by');

  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: (requestOrigin, callback) => {
      // Allow server-to-server requests and requests without Origin.
      if (!requestOrigin) {
        return callback(null, true);
      }

      return callback(null, allowedOrigins.has(requestOrigin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  }));

  // Additional origin validation for state-changing requests.
  app.use((req, res, next) => {
    const requestOrigin = req.get('origin');

    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      requestOrigin &&
      !allowedOrigins.has(requestOrigin)
    ) {
      return res.status(403).json({
        message: 'Untrusted request origin.'
      });
    }

    next();
  });

  // Prevent API responses from being cached.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

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
    res.json({ status: 'ok' });
  });

  // Routes
  app.use('/api/auth', auth);
  app.use('/api/entries', entries);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  // Error handler
  app.use((error, req, res, next) => {
    const status =
      error.code === 11000 ? 409 :
      error.code === 'LIMIT_FILE_SIZE' ? 413 :
      ['ValidationError', 'CastError', 'MulterError'].includes(error.name) ? 400 :
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

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import problemRoutes from './routes/problemRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  DuplicateSubmissionError,
  InvalidStateTransitionError
} from './domain/errors/index.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/problems', problemRoutes);
app.use('/api/attempts', attemptRoutes);

// Optional: Serve frontend build in unified monolithic production deployment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleFrontendPaths = [
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist')
];

let resolvedFrontendDist: string | null = null;
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    resolvedFrontendDist = p;
    break;
  }
}

if (resolvedFrontendDist) {
  console.log(`Serving static frontend from: ${resolvedFrontendDist}`);
  app.use(express.static(resolvedFrontendDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(resolvedFrontendDist!, 'index.html'));
  });
} else {
  console.log('No static frontend dist found; running API-only mode.');
}

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: err.message
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof DuplicateSubmissionError) {
    return res.status(409).json({
      error: 'DUPLICATE_SUBMISSION',
      message: err.message
    });
  }

  if (err instanceof InvalidStateTransitionError) {
    return res.status(400).json({
      error: 'INVALID_STATE_TRANSITION',
      message: err.message
    });
  }

  if (err instanceof DomainError) {
    return res.status(400).json({
      error: err.code || 'DOMAIN_ERROR',
      message: err.message
    });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message
  });
});
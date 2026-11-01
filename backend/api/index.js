import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projects from '../src/routes/projects.js';
import admin from '../src/routes/admin.js';
import { initializeDatabase } from '../src/db.js';

const app = express();
app.get('/api', (_req, res) => {
  res.json({
    status: 'success',
    message: 'CodeNova Student Project Showcase API endpoints are ready.',
    endpoints: ['/api/health', '/api/projects', '/api/admin/projects'],
  });
});

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    let hostname = '';
    try {
      hostname = new URL(origin || '').hostname;
    } catch {
      hostname = '';
    }

    const normalizedOrigin = origin?.replace(/\/$/, '');
    const isConfiguredOrigin = allowedOrigins.includes(normalizedOrigin);
    const isLocalOrigin = hostname === 'localhost' || hostname === '127.0.0.1';
    const isVercelOrigin = hostname.endsWith('.vercel.app');

    if (!origin || allowedOrigins.length === 0 || isConfiguredOrigin || isLocalOrigin || isVercelOrigin) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

app.use(async (_req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    res.status(503).json({ error: 'Database is temporarily unavailable.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'CodeNova Task 4 Student Project Showcase API' }));
app.use('/api/projects', projects);
app.use('/api/admin', admin);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

export default app;

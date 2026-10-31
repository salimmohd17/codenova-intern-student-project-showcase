import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projects from '../src/routes/projects.js';
import admin from '../src/routes/admin.js';
import '../src/db.js';

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

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

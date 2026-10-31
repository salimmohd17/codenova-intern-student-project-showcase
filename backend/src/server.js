import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projects from './routes/projects.js';
import admin from './routes/admin.js';
import './db.js';

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

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'CodeNova Task 4 Student Project Showcase API',
}));

app.use('/api/projects', projects);
app.use('/api/admin', admin);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

const port = Number(process.env.PORT || 5005);
app.listen(port, '0.0.0.0', () => {
  console.log(`Student Project Showcase API listening on port ${port}`);
});

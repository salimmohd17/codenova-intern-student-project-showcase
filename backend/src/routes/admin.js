import { Router } from 'express';
import db from '../db.js';

const router = Router();
const validId = value => Number.isInteger(Number(value)) && Number(value) > 0;

const parseTags = value => {
  try {
    const tags = JSON.parse(value);
    return Array.isArray(tags) ? tags.map(String) : [];
  } catch {
    return [];
  }
};

router.use((req, res, next) => {
  const key = process.env.ADMIN_KEY;
  if (!key || req.get('x-admin-key') !== key) {
    return res.status(401).json({ error: 'Admin access denied. Enter the configured admin key.' });
  }
  next();
});

router.get('/projects', (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? req.query.status
    : null;
  const rows = status
    ? db.prepare('SELECT * FROM projects WHERE status=? ORDER BY submitted_at DESC').all(status)
    : db.prepare('SELECT * FROM projects ORDER BY submitted_at DESC').all();

  res.json({ projects: rows.map(project => ({ ...project, tags: parseTags(project.tags) })) });
});

router.patch('/projects/:id/review', (req, res) => {
  const status = req.body?.status;
  const note = String(req.body?.review_note || '').trim().slice(0, 500);
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, rejected, or pending.' });
  }

  const result = db.prepare(`
    UPDATE projects
    SET status=?, reviewed_at=CURRENT_TIMESTAMP, review_note=?
    WHERE id=?
  `).run(status, note || null, Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: `Project ${status}.` });
});

router.patch('/projects/:id/tags', (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const tags = Array.isArray(req.body?.tags)
    ? [...new Set(req.body.tags.map(tag => String(tag).trim().replace(/^#/, '')).filter(Boolean))]
    : [];
  if (!tags.length || tags.length > 8 || tags.some(tag => tag.length > 30)) {
    return res.status(400).json({ error: 'Provide 1 to 8 tags, each no longer than 30 characters.' });
  }

  const result = db.prepare('UPDATE projects SET tags=? WHERE id=?')
    .run(JSON.stringify(tags), Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: 'Project tags updated.', tags });
});

router.delete('/projects/:id', (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const result = db.prepare('DELETE FROM projects WHERE id=?').run(Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: 'Project submission deleted.' });
});

export default router;

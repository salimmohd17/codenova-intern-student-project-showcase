import { Router } from 'express';
import { query } from '../db.js';

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
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

router.get('/projects', asyncHandler(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? req.query.status
    : null;
  const result = status
    ? await query('SELECT * FROM projects WHERE status = $1 ORDER BY submitted_at DESC', [status])
    : await query('SELECT * FROM projects ORDER BY submitted_at DESC');
  const rows = result.rows;

  res.json({ projects: rows.map(project => ({ ...project, tags: parseTags(project.tags) })) });
}));

router.patch('/projects/:id/review', asyncHandler(async (req, res) => {
  const status = req.body?.status;
  const note = String(req.body?.review_note || '').trim().slice(0, 500);
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, rejected, or pending.' });
  }

  const result = await query(`
    UPDATE projects
    SET status = $1, reviewed_at = CURRENT_TIMESTAMP, review_note = $2
    WHERE id = $3
  `, [status, note || null, Number(req.params.id)]);
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: `Project ${status}.` });
}));

router.patch('/projects/:id/tags', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const tags = Array.isArray(req.body?.tags)
    ? [...new Set(req.body.tags.map(tag => String(tag).trim().replace(/^#/, '')).filter(Boolean))]
    : [];
  if (!tags.length || tags.length > 8 || tags.some(tag => tag.length > 30)) {
    return res.status(400).json({ error: 'Provide 1 to 8 tags, each no longer than 30 characters.' });
  }

  const result = await query(
    'UPDATE projects SET tags = $1::jsonb WHERE id = $2',
    [JSON.stringify(tags), Number(req.params.id)],
  );
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: 'Project tags updated.', tags });
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const result = await query('DELETE FROM projects WHERE id = $1', [Number(req.params.id)]);
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Project submission not found.' });
  }

  res.json({ message: 'Project submission deleted.' });
}));

export default router;

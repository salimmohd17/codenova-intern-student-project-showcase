import { Router } from 'express';
import db from '../db.js';
import { validateProject } from '../validation.js';

const router = Router();

const getRatingSummary = projectId => db.prepare(`
  SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average
  FROM project_ratings
  WHERE project_id = ?
`).get(projectId);

const parseTags = value => {
  try {
    const tags = JSON.parse(value);
    return Array.isArray(tags) ? tags.map(String) : [];
  } catch {
    return [];
  }
};

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const tag = String(req.query.tag || '').trim().toLowerCase();
  const rows = db.prepare(`
    SELECT id, title, student_name, description, tags, github_url, demo_url,
           status, submitted_at, reviewed_at
    FROM projects
    WHERE status = 'approved'
    ORDER BY submitted_at DESC
  `).all().map(project => {
    const rating = getRatingSummary(project.id);
    return {
      ...project,
      tags: parseTags(project.tags),
      rating_count: rating.count,
      average_rating: Number(Number(rating.average).toFixed(1)),
    };
  });

  const projects = rows.filter(project =>
    (!q || `${project.title} ${project.student_name} ${project.description} ${project.tags.join(' ')}`
      .toLowerCase()
      .includes(q))
    && (!tag || project.tags.some(projectTag => projectTag.toLowerCase() === tag)),
  );
  const tags = [...new Set(rows.flatMap(project => project.tags))]
    .sort((a, b) => a.localeCompare(b));

  res.json({ projects, tags, total: projects.length });
});

router.post('/:id/rating', (req, res) => {
  const projectId = Number(req.params.id);
  const rating = Number(req.body?.rating);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }
  if (!db.prepare("SELECT id FROM projects WHERE id=? AND status='approved'").get(projectId)) {
    return res.status(404).json({ error: 'Published project not found.' });
  }

  const raterId = String(req.header('x-rater-id') || req.ip || '').trim();
  if (!raterId) {
    return res.status(400).json({ error: 'Viewer identifier is required.' });
  }

  db.prepare(`
    INSERT INTO project_ratings(project_id, rater_id, rating)
    VALUES (?, ?, ?)
    ON CONFLICT(project_id, rater_id) DO UPDATE SET rating=excluded.rating
  `).run(projectId, raterId, rating);

  const summary = getRatingSummary(projectId);
  res.json({
    message: 'Thank you for rating this project.',
    rating_count: summary.count,
    average_rating: Number(Number(summary.average).toFixed(1)),
  });
});

router.post('/', (req, res) => {
  const { errors, value } = validateProject(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({
      error: 'Please correct the highlighted fields.',
      fields: errors,
    });
  }

  const result = db.prepare(`
    INSERT INTO projects(title, student_name, description, tags, github_url, demo_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    value.title,
    value.student_name,
    value.description,
    JSON.stringify(value.tags),
    value.github_url,
    value.demo_url,
  );

  res.status(201).json({
    message: 'Project submitted for moderation. It will appear publicly only after approval.',
    project: { id: result.lastInsertRowid, ...value, status: 'pending' },
  });
});

export default router;

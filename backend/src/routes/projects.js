import { Router } from 'express';
import { query } from '../db.js';
import { validateProject } from '../validation.js';

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const getRatingSummary = async projectId => {
  const { rows } = await query(`
  SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average
  FROM project_ratings
  WHERE project_id = $1
`, [projectId]);
  return rows[0];
};

const parseTags = value => {
  if (Array.isArray(value)) return value.map(String);
  try {
    const tags = JSON.parse(value);
    return Array.isArray(tags) ? tags.map(String) : [];
  } catch {
    return [];
  }
};

router.get('/', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const tag = String(req.query.tag || '').trim().toLowerCase();
  const { rows } = await query(`
    SELECT id, title, student_name, description, tags, github_url, demo_url,
           status, submitted_at, reviewed_at
    FROM projects
    WHERE status = 'approved'
    ORDER BY submitted_at DESC
  `);
  const projectsWithRatings = await Promise.all(rows.map(async project => {
    const rating = await getRatingSummary(project.id);
    return {
      ...project,
      tags: parseTags(project.tags),
      rating_count: Number(rating.count),
      average_rating: Number(Number(rating.average).toFixed(1)),
    };
  }));

  const projects = projectsWithRatings.filter(project =>
    (!q || `${project.title} ${project.student_name} ${project.description} ${project.tags.join(' ')}`
      .toLowerCase()
      .includes(q))
    && (!tag || project.tags.some(projectTag => projectTag.toLowerCase() === tag)),
  );
  const tags = [...new Set(projectsWithRatings.flatMap(project => project.tags))]
    .sort((a, b) => a.localeCompare(b));

  res.json({ projects, tags, total: projects.length });
}));

router.post('/:id/rating', asyncHandler(async (req, res) => {
  const projectId = Number(req.params.id);
  const rating = Number(req.body?.rating);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }
  const projectResult = await query(
    "SELECT id FROM projects WHERE id = $1 AND status = 'approved'",
    [projectId],
  );
  if (!projectResult.rowCount) {
    return res.status(404).json({ error: 'Published project not found.' });
  }

  const raterId = String(req.header('x-rater-id') || req.ip || '').trim();
  if (!raterId) {
    return res.status(400).json({ error: 'Viewer identifier is required.' });
  }

  await query(`
    INSERT INTO project_ratings(project_id, rater_id, rating)
    VALUES ($1, $2, $3)
    ON CONFLICT(project_id, rater_id) DO UPDATE SET rating = EXCLUDED.rating
  `, [projectId, raterId, rating]);

  const summary = await getRatingSummary(projectId);
  res.json({
    message: 'Thank you for rating this project.',
    rating_count: Number(summary.count),
    average_rating: Number(Number(summary.average).toFixed(1)),
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { errors, value } = validateProject(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({
      error: 'Please correct the highlighted fields.',
      fields: errors,
    });
  }

  const result = await query(`
    INSERT INTO projects(title, student_name, description, tags, github_url, demo_url)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
    RETURNING id
  `, [
    value.title,
    value.student_name,
    value.description,
    JSON.stringify(value.tags),
    value.github_url,
    value.demo_url,
  ]);

  res.status(201).json({
    message: 'Project submitted for moderation. It will appear publicly only after approval.',
    project: { id: result.rows[0].id, ...value, status: 'pending' },
  });
}));

export default router;

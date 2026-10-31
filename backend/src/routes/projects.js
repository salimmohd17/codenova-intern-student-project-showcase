import { Router } from 'express';
import db from '../db.js';
import { validateProject } from '../validation.js';

const router = Router();

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
  `).all().map(project => ({ ...project, tags: parseTags(project.tags) }));

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

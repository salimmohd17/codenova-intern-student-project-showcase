function validHttpUrl(value) {
  try {
    const raw = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function normalizeUrl(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function validateProject(body = {}) {
  const errors = {};
  const title = String(body.title || '').trim();
  const student_name = String(body.student_name || '').trim();
  const description = String(body.description || '').trim();
  const raw_github_url = String(body.github_url || '').trim();
  const github_url = normalizeUrl(raw_github_url);
  const raw_demo_url = String(body.demo_url || '').trim();
  const demo_url = normalizeUrl(raw_demo_url);
  const rawTags = Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',');
  const tags = [...new Set(rawTags.map(t => String(t).trim().replace(/^#/, '')).filter(Boolean))];

  if (title.length < 4 || title.length > 100) errors.title = 'Title must be between 4 and 100 characters.';
  if (student_name.length < 2 || student_name.length > 100) errors.student_name = 'Student name must be between 2 and 100 characters.';
  if (description.length < 30 || description.length > 1500) errors.description = 'Description must be between 30 and 1,500 characters.';
  if (!github_url || !validHttpUrl(github_url) || !/^https?:\/\/(www\.)?github\.com\//i.test(github_url)) errors.github_url = 'Enter a valid public GitHub repository URL (e.g. https://github.com/username/repo).';
  if (!raw_demo_url || !validHttpUrl(demo_url)) errors.demo_url = 'Enter a valid live preview URL (e.g. https://myproject.netlify.app).';
  if (tags.length < 1 || tags.length > 8 || tags.some(t => t.length > 30)) errors.tags = 'Provide 18 tags, each no longer than 30 characters.';

  return { errors, value: { title, student_name, description, github_url, demo_url, tags } };
}

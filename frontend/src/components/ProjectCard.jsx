import { useState } from 'react';
import { request } from '../api.js';

const raterStorageKey = 'student-showcase-rater-id';
function getRaterId() {
  let raterId = localStorage.getItem(raterStorageKey);
  if (!raterId) {
    raterId = crypto.randomUUID();
    localStorage.setItem(raterStorageKey, raterId);
  }
  return raterId;
}

export default function ProjectCard({ project, onNotice }) {
  const [rating, setRating] = useState(
    Number(localStorage.getItem(`student-showcase-project-${project.id}-rating`)) || 0,
  );
  const [average, setAverage] = useState(project.average_rating || 0);
  const [count, setCount] = useState(project.rating_count || 0);
  const [ratingBusy, setRatingBusy] = useState(false);

  async function submitRating(value) {
    setRatingBusy(true);
    try {
      const data = await request(`/projects/${project.id}/rating`, {
        method: 'POST',
        headers: { 'x-rater-id': getRaterId() },
        body: JSON.stringify({ rating: value }),
      });
      setRating(value);
      localStorage.setItem(`student-showcase-project-${project.id}-rating`, String(value));
      setAverage(data.average_rating);
      setCount(data.rating_count);
      onNotice?.({ type: 'success', message: data.message });
    } catch (error) {
      onNotice?.({ type: 'error', message: error.message });
    } finally {
      setRatingBusy(false);
    }
  }

  return (
    <article className="content-card">
      <div className="content-card__meta">
        <span>{project.student_name}</span>
        <span className="badge badge--approved">Approved</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className="tag-list">
        {project.tags.map(tag => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>
      <div className="content-card__footer">
        <a
          className="button button--secondary"
          href={project.github_url}
          target="_blank"
          rel="noreferrer"
        >
          GitHub repository
        </a>
        <a
          className="button button--primary"
          href={project.demo_url}
          target="_blank"
          rel="noreferrer"
        >
          Live preview
        </a>
      </div>
      <div className="project-rating" aria-label={`Rate ${project.title}`}>
        <strong>{average.toFixed(1)} / 5</strong>
        <span> ({count} {count === 1 ? 'rating' : 'ratings'})</span>
        <div className="project-rating__stars">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              className={`rating-star${value <= rating ? ' rating-star--active' : ''}`}
              onClick={() => submitRating(value)}
              disabled={ratingBusy}
              aria-label={`Rate ${value} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

import { useState } from 'react';
import { request } from '../api.js';
import EmptyState from './EmptyState.jsx';

export default function AdminPanel({ onNotice, onChanged }) {
  const [key, setKey] = useState('');
  const [activeKey, setActiveKey] = useState('');
  const [status, setStatus] = useState('pending');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load(adminKey = activeKey, selectedStatus = status) {
    setLoading(true);
    try {
      const selected = selectedStatus === 'all' ? '' : selectedStatus;
      const data = await request(`/admin/projects?status=${selected}`, {
        headers: { 'x-admin-key': adminKey },
      });
      setProjects(data.projects);
      setActiveKey(adminKey);
      onNotice(null);
    } catch (error) {
      onNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function review(id, value) {
    try {
      const reviewNote = value === 'rejected' ? 'Needs revision before public listing.' : '';
      const data = await request(`/admin/projects/${id}/review`, {
        method: 'PATCH',
        headers: { 'x-admin-key': activeKey },
        body: JSON.stringify({ status: value, review_note: reviewNote }),
      });
      onNotice({ type: 'success', message: data.message });
      await load();
      onChanged();
    } catch (error) {
      onNotice({ type: 'error', message: error.message });
    }
  }

  async function remove(id) {
    if (!window.confirm('Permanently delete this submission?')) return;
    try {
      await request(`/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': activeKey },
      });
      onNotice({ type: 'success', message: 'Submission deleted.' });
      await load();
      onChanged();
    } catch (error) {
      onNotice({ type: 'error', message: error.message });
    }
  }

  return (
    <section className="panel admin-box">
      <details>
        <summary>Administrator moderation portal</summary>
        <p className="panel__intro">
          Review submissions and approve them for the public gallery. The admin key is sent to the
          backend only and is not saved in the browser.
        </p>
        <div className="admin-controls">
          <input
            className="control"
            type="password"
            placeholder="Administrator key"
            value={key}
            onChange={event => setKey(event.target.value)}
          />
          <select
            className="control"
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              if (activeKey) load(activeKey, event.target.value);
            }}
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All submissions</option>
          </select>
          <button
            className="button button--primary"
            onClick={() => load(key)}
            disabled={!key || loading}
          >
            {loading ? 'Loading' : 'Load submissions'}
          </button>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            title="No submissions loaded"
            detail="Enter the admin key and load the selected queue to review projects."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Submitted by</th>
                  <th>Links</th>
                  <th>Status</th>
                  <th>Review action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.title}</strong>
                      <br />
                      <span className="small-muted">{project.description}</span>
                      <div className="tag-list">
                        {project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}
                      </div>
                    </td>
                    <td>
                      {project.student_name}
                      <br />
                      <span className="small-muted">
                        {new Date(`${project.submitted_at}Z`).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <a href={project.github_url} target="_blank" rel="noreferrer">GitHub</a>
                      <br />
                      <a href={project.demo_url} target="_blank" rel="noreferrer">Live preview</a>
                    </td>
                    <td>
                      <span className={`badge badge--${project.status}`}>{project.status}</span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {project.status !== 'approved' && (
                          <button
                            className="button button--primary"
                            onClick={() => review(project.id, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {project.status !== 'rejected' && (
                          <button
                            className="button button--secondary"
                            onClick={() => review(project.id, 'rejected')}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          className="button button--danger"
                          onClick={() => remove(project.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}

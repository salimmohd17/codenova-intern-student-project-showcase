import { useState } from 'react';
import Field from './Field.jsx';
import { request } from '../api.js';

const initial = { title: '', student_name: '', description: '', tags: '', github_url: '', demo_url: '' };

export default function ProjectForm({ onNotice, onSubmitted }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const change = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(s => ({ ...s, [e.target.name]: '' }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const d = await request('/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      setForm(initial);
      onNotice({ type: 'success', message: d.message });
      onSubmitted();
    } catch (err) {
      if (err.status === 400 && err.fields) setErrors(err.fields);
      onNotice({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h3>Submit a project</h3>
      <p className="panel__intro">
        Share your work with the student community. Submissions remain private until approved by a moderator.
      </p>
      <Field label="Project title" name="title" value={form.title} onChange={change} required maxLength={100} />
      {errors.title && <small className="field-error">{errors.title}</small>}

      <Field label="Student name" name="student_name" value={form.student_name} onChange={change} required maxLength={100} />
      {errors.student_name && <small className="field-error">{errors.student_name}</small>}

      <Field
        label="Project description"
        name="description"
        value={form.description}
        onChange={change}
        required
        multiline
        rows={5}
        maxLength={1500}
        hint="Describe what it does and who it helps (301,500 characters)."
      />
      {errors.description && <small className="field-error">{errors.description}</small>}

      <Field
        label="Tags"
        name="tags"
        value={form.tags}
        onChange={change}
        required
        placeholder="React, Education, Productivity"
        hint="Separate 18 tags with commas."
      />
      {errors.tags && <small className="field-error">{errors.tags}</small>}

      <Field
        label="GitHub repository URL"
        name="github_url"
        value={form.github_url}
        onChange={change}
        required
        type="url"
        placeholder="https://github.com/username/repository"
      />
      {errors.github_url && <small className="field-error">{errors.github_url}</small>}

      <Field
        label="Live preview URL"
        name="demo_url"
        value={form.demo_url}
        onChange={change}
        required
        type="text"
        placeholder="https://salim-mwamkoba.netlify.app"
        hint="Include https://  e.g. https://myproject.netlify.app"
      />
      {errors.demo_url && <small className="field-error">{errors.demo_url}</small>}

      <button className="button button--primary button--wide" disabled={busy}>
        {busy ? 'Submitting' : 'Submit for review'}
      </button>
    </form>
  );
}

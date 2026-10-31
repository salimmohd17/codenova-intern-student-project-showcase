import { useEffect, useState } from 'react';
import { FolderKanban } from 'lucide-react';
import { request } from './api.js';
import ProjectCard from './components/ProjectCard.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import Notice from './components/Notice.jsx';
import LoadingState from './components/LoadingState.jsx';
import EmptyState from './components/EmptyState.jsx';
import StatCard from './components/StatCard.jsx';
import { useServerWakeup } from './useServerWakeup.js';
import './styles.css';

const WakeupBanner = ({ status }) => {
  const [showSuccess, setShowSuccess] = useState(status === 'ready');

  useEffect(() => {
    if (status !== 'ready') {
      setShowSuccess(false);
      return undefined;
    }
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'ready' && !showSuccess) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: status === 'error' ? '#fef2f2' : status === 'ready' ? '#f0fdf4' : '#eff6ff',
      borderBottom: `2px solid ${status === 'error' ? '#fca5a5' : status === 'ready' ? '#86efac' : '#93c5fd'}`,
      padding: '12px 24px', display: 'flex', alignItems: 'center',
      gap: '12px', fontSize: '13px',
      color: status === 'error' ? '#991b1b' : status === 'ready' ? '#166534' : '#1e3a8a',
    }}>
      {status === 'waking' && (
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #93c5fd', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      )}
      {status === 'waking' && 'Connecting to backend... Render may take up to 60 seconds to wake up.'}
      {status === 'ready' && 'Connected to the backend successfully.'}
      {status === 'error' && 'Could not reach the server. Check the backend URL, deployment status, and connection, then refresh.'}
    </div>
  );
};

export default function App() {
  const serverStatus = useServerWakeup();
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [activePage, setActivePage] = useState('home');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (tag !== 'all') params.set('tag', tag);
      const d = await request(`/projects?${params.toString()}`);
      setProjects(d.projects);
      setTags(d.tags);
      setNotice(null);
    } catch (e) {
      setNotice({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 180);
    return () => clearTimeout(timer);
  }, [q, tag, refresh]);

  return (
    <div className="app-shell">
      <WakeupBanner status={serverStatus} />
      <header className="topbar" style={serverStatus !== 'ready' ? { marginTop: 48 } : {}}>
        <div className="brand">
          <div className="brand__mark"><FolderKanban size={22} /></div>
          <div>
            <h1>Student Project Showcase</h1>
            <p>Community portfolio &amp; gallery</p>
          </div>
        </div>
        <nav className="nav">
          <a
            href="#"
            className={`nav__link ${activePage === 'home' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('home'); }}
          > Home</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'projects' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('projects'); }}
          > Projects</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'submit' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('submit'); }}
          > Submit</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'about' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('about'); }}
          > About</a>
        </nav>
        <span className="topbar__label">TASK 4</span>
      </header>

      <main className="container">
        {activePage === 'about' ? (
          <div>
            <div className="page-heading">
              <div>
                <h2>About This Showcase</h2>
                <p>Learn about our student project gallery and submission process.</p>
              </div>
            </div>
            <div className="panel">
              <h3>Student Project Showcase</h3>
              <p className="panel__intro">
                A platform for students to share their projects with the community. Every submission goes through
                a moderation process to ensure quality. Once approved, projects appear in the public gallery
                for everyone to explore and learn from.
              </p>
              <h3 style={{ marginTop: '20px' }}>How it works</h3>
              <ol style={{ color: '#64748b', lineHeight: '2.2', fontSize: '14px', paddingLeft: '20px' }}>
                <li>Submit your project with title, description, tags, GitHub link, and live demo URL</li>
                <li>A moderator reviews your submission</li>
                <li>Approved projects appear in the public gallery</li>
                <li>The community can explore and discover your work</li>
              </ol>
              <h3 style={{ marginTop: '20px' }}>Moderation Policy</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.7' }}>
                All submissions are reviewed before publication. We look for genuine student work,
                clear descriptions, working links, and appropriate content.
                Projects that meet our standards are approved within 48 hours.
              </p>
            </div>
          </div>
        ) : activePage === 'submit' ? (
          <div>
            <div className="page-heading">
              <div>
                <h2>Submit Your Project</h2>
                <p>Share your work with the student community.</p>
              </div>
            </div>
            <Notice notice={notice} onClose={() => setNotice(null)} />
            <div className="panel">
              <ProjectForm
                onNotice={setNotice}
                onSubmitted={() => { setRefresh(n => n + 1); setActivePage('projects'); }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <h2>Projects built by students</h2>
                <p>Explore approved work, discover useful ideas, and share a project of your own with the community.</p>
              </div>
            </div>
            <Notice notice={notice} onClose={() => setNotice(null)} />
            <div className="stats-grid">
              <StatCard label="Published projects" value={projects.length} detail="Approved and visible to everyone" />
              <StatCard label="Available tags" value={tags.length} detail="Use tags to narrow the gallery" />
              <StatCard label="Moderation policy" value="Review first" detail="New submissions stay private until approved" />
            </div>
            <div className="section-title">
              <div>
                <h3>Project gallery</h3>
                <p>Only moderator-approved submissions appear here.</p>
              </div>
              <a
                href="#"
                className="button button--primary"
                onClick={e => { e.preventDefault(); setActivePage('submit'); }}
              > Submit a project</a>
            </div>
            <div className="filters">
              <input
                className="control"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search projects, students, or descriptions"
                aria-label="Search projects"
              />
              <select
                className="control"
                value={tag}
                onChange={e => setTag(e.target.value)}
                aria-label="Filter by tag"
              >
                <option value="all">All tags</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {loading ? (
              <LoadingState label="Loading approved projects" />
            ) : projects.length ? (
              <div className="card-grid">
                {projects.map(p => (
                  <ProjectCard project={p} key={p.id} onNotice={setNotice} />
                ))}
              </div>
            ) : (
              <EmptyState title="No projects match your search" detail="Try another keyword or choose a different tag." />
            )}
            <AdminPanel onNotice={setNotice} onChanged={() => setRefresh(n => n + 1)} />
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__copy">
            <strong> {new Date().getFullYear()} Salim Mwamkoba</strong>
            <span style={{ marginLeft: '8px', opacity: 0.8 }}> Student Project Showcase  Task 4</span>
          </div>
          <a
            href="https://salim-mwamkoba.netlify.app"
            target="_blank"
            rel="noreferrer"
            className="footer__designed"
          >
             Designed by BMS Techs
          </a>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar.jsx';
import { formatCurrency, formatDate, statusLabel } from '../utils/format.js';

export default function ProjectCard({ project }) {
  return (
    <article className="card project-card">
      <div className="card-kicker">
        <span>{project.projectCode}</span>
        <span className={`status status-${project.status}`}>{statusLabel(project.status)}</span>
      </div>
      <h3>{project.name}</h3>
      <p className="muted">{project.department} · {project.location}</p>
      <dl className="meta-grid">
        <div><dt>Budget</dt><dd>{formatCurrency(project.approvedBudget)}</dd></div>
        <div><dt>Start</dt><dd>{formatDate(project.startDate)}</dd></div>
        <div><dt>Expected</dt><dd>{formatDate(project.expectedCompletionDate)}</dd></div>
        <div><dt>Updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>
      </dl>
      <ProgressBar value={project.progressPercent} />
      <Link className="btn secondary" to={`/projects/${project.id}`}>View details</Link>
    </article>
  );
}

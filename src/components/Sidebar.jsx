import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <button className="close-mobile" type="button" onClick={onClose}>Close</button>
      <p className="sidebar-title">Workspace</p>
      {user?.role === 'CITIZEN' && (
        <nav>
          <NavLink to="/citizen" onClick={onClose}>Dashboard</NavLink>
          <NavLink to="/projects" onClick={onClose}>Public projects</NavLink>
          <NavLink to="/reports/new" onClick={onClose}>Submit report</NavLink>
          <NavLink to="/reports/mine" onClick={onClose}>My reports</NavLink>
        </nav>
      )}
      {user?.role === 'OFFICER' && (
        <nav>
          <NavLink to="/officer" onClick={onClose}>Dashboard</NavLink>
          <NavLink to="/officer/projects" onClick={onClose}>Assigned projects</NavLink>
          <NavLink to="/officer/reports" onClick={onClose}>Reports to review</NavLink>
        </nav>
      )}
      {user?.role === 'ADMIN' && (
        <nav>
          <NavLink to="/admin" onClick={onClose}>Dashboard</NavLink>
          <NavLink to="/admin/users" onClick={onClose}>Users</NavLink>
          <NavLink to="/admin/projects" onClick={onClose}>Projects</NavLink>
          <NavLink to="/admin/reports" onClick={onClose}>Reports</NavLink>
          <NavLink to="/admin/audit" onClick={onClose}>Audit logs</NavLink>
        </nav>
      )}
      {!user && (
        <nav>
          <NavLink to="/projects" onClick={onClose}>Public projects</NavLink>
          <NavLink to="/reports/new" onClick={onClose}>Report an issue</NavLink>
          <NavLink to="/login" onClick={onClose}>Sign in</NavLink>
        </nav>
      )}
    </aside>
  );
}

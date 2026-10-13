import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Logo from './Logo.jsx';

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="topbar">
      <button className="menu-btn" type="button" aria-label="Open navigation" onClick={onMenu}>☰</button>
      <NavLink to="/" className="brand-link"><Logo /></NavLink>
      <nav className="top-nav" aria-label="Primary">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/projects">Public Projects</NavLink>
        <a href="/#how-it-works">How It Works</a>
        <a href="/#transparency">Transparency</a>
        <a href="/#about">About</a>
        {!user && <NavLink to="/login?role=OFFICER">Officer Login</NavLink>}
        {!user && <NavLink to="/login?role=ADMIN">Admin Login</NavLink>}
        {!user && <NavLink to="/projects" className="btn small">Continue as Citizen</NavLink>}
        {user?.role === 'CITIZEN' && <NavLink to="/citizen">Citizen desk</NavLink>}
        {user?.role === 'OFFICER' && <NavLink to="/officer">Officer desk</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">Admin desk</NavLink>}
      </nav>
      {user && (
        <div className="session">
          <span>{user.fullName} · {user.role}</span>
          <button type="button" className="btn ghost" onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </header>
  );
}

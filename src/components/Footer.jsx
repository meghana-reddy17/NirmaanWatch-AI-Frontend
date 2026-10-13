import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>NirmaanWatch AI</strong>
        <p>Public project reality and accountability platform.</p>
      </div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
        <a href="/#about">About</a>
        <a href="mailto:contact-placeholder@example.invalid">Contact (placeholder)</a>
      </nav>
      <p className="muted">Contact email, phone, and office address are placeholders and are not live public service contacts.</p>
    </footer>
  );
}

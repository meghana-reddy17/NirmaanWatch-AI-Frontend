import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/api.js';

export default function AutoPage({ title }) {
  const location = useLocation();
  const params = useParams();
  const [message, setMessage] = useState('Ready');
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    setMessage('Page loaded. Checking available data…');
    const endpoint = location.pathname.startsWith('/projects')
      ? (params.id ? `/projects/${params.id}` : '/projects')
      : location.pathname.startsWith('/reports/mine')
      ? '/reports/mine'
      : location.pathname.startsWith('/officer/projects')
      ? '/officer/projects'
      : location.pathname.startsWith('/admin/users')
      ? '/admin/users'
      : location.pathname.startsWith('/admin/reports') ||
        location.pathname.startsWith('/officer/reports')
      ? '/reports'
      : location.pathname === '/citizen' ||
        location.pathname === '/officer' ||
        location.pathname === '/admin'
      ? '/public/stats'
      : null;

    if (!endpoint) {
      setMessage('Use the navigation links to explore NirmaanWatch AI.');
      return;
    }

    let active = true;
    api.get(endpoint)
      .then(result => {
        if (active) {
          setData(result);
          setMessage('Data loaded successfully.');
        }
      })
      .catch(error => {
        if (active) setMessage(
          `The page is open, but its API is unavailable: ${error.message}`
        );
      });
    return () => { active = false; };
  }, [location.pathname, params.id]);

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: 24,
      fontFamily: 'Arial, sans-serif', color: '#172554' }}>
      <section style={{ background: '#fff', padding: 28, borderRadius: 16,
        boxShadow: '0 8px 30px #0f172a12', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#2563eb', fontWeight: 700 }}>NIRMAANWATCH AI</p>
        <h1>{title}</h1>
        <p>Public Project Reality &amp; Accountability Platform</p>
        <p style={{ color: '#475569' }}>{message}</p>
        {data !== null && (
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
            background: '#f8fafc', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12,
          marginTop: 24 }}>
          {[
            ['Home', '/'],
            ['Public Projects', '/projects'],
            ['Citizen Dashboard', '/citizen'],
            ['Submit Report', '/reports/new'],
            ['My Reports', '/reports/mine'],
            ['Officer Dashboard', '/officer'],
            ['Admin Dashboard', '/admin'],
            ['Sign In', '/login']
          ].map(([label, href]) => (
            <Link key={href} to={href} style={{
              padding: '10px 14px', borderRadius: 8,
              background: '#1d4ed8', color: 'white',
              textDecoration: 'none', fontWeight: 600
            }}>{label}</Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

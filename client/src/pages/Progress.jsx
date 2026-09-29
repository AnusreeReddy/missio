import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const DOMAIN_LABEL = { dsa: 'DSA', fitness: 'Fitness' };

function titleCase(s) {
  return s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export default function Progress() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.progress().then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
      <Link to="/" className="btn-text" style={{ fontSize: 13, display: 'inline-block', marginBottom: 20 }}>
        ← Today
      </Link>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Progress</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 28 }}>
        What you've actually done, by topic. No streaks, no app-open counts.
      </p>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13.5 }}>{error}</div>}

      {data && Object.keys(data).length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nothing completed yet \u2014 finish a mission to see it here.</p>
      )}

      {data &&
        Object.entries(data).map(([domain, topics]) => (
          <div key={domain} style={{ marginBottom: 32 }}>
            <div className="domain-tag" style={{ marginBottom: 12 }}>
              <span className={`domain-dot ${domain}`} />
              {DOMAIN_LABEL[domain] || domain}
            </div>

            {topics.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13.5 }}>No completions yet.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topics.map((t) => (
                <div
                  key={t._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14,
                  }}
                >
                  <span>{titleCase(t.topicId)}</span>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {t.lastDifficulty}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      {t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '\u2014'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

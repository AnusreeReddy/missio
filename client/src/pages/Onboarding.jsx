import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';

const CATEGORIES = [
  {
    id: 'dsa',
    label: 'Interview / DSA prep',
    domainClass: 'dsa',
    levels: [
      { id: 'easy', label: 'Just starting (< 20 problems solved)' },
      { id: 'medium', label: 'Some practice (20\u2013100 problems)' },
      { id: 'hard', label: 'Solid base (100+ problems)' },
    ],
    defaultMinutes: 25,
  },
  {
    id: 'fitness',
    label: 'Fitness / exercise',
    domainClass: 'fitness',
    levels: [
      { id: 'easy', label: 'Beginner (0\u20135 push-ups unbroken)' },
      { id: 'medium', label: 'Getting there (5\u201315 push-ups)' },
      { id: 'hard', label: 'Regular training (15+ push-ups)' },
    ],
    defaultMinutes: 15,
  },
];

export default function Onboarding() {
  const [selected, setSelected] = useState({}); // { dsa: { level, dailyTimeBudgetMin }, fitness: {...} }
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  function toggle(cat) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[cat.id]) {
        delete next[cat.id];
      } else {
        next[cat.id] = { level: cat.levels[0].id, dailyTimeBudgetMin: cat.defaultMinutes };
      }
      return next;
    });
  }

  function setLevel(catId, level) {
    setSelected((prev) => ({ ...prev, [catId]: { ...prev[catId], level } }));
  }

  function setMinutes(catId, minutes) {
    setSelected((prev) => ({ ...prev, [catId]: { ...prev[catId], dailyTimeBudgetMin: minutes } }));
  }

  async function handleContinue() {
    const goals = Object.entries(selected).map(([category, cfg]) => ({ category, ...cfg }));
    if (goals.length === 0) {
      setError('Pick at least one goal to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.setGoals(goals);
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not save your goals.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 10 }}>SET UP</div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>What are you working toward?</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 32, maxWidth: 460 }}>
        Pick one or more. We'll generate a real mission for today \u2014 not a reminder to "study" or "exercise."
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CATEGORIES.map((cat) => {
          const isOn = Boolean(selected[cat.id]);
          return (
            <div
              key={cat.id}
              style={{
                border: `1px solid ${isOn ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: 18,
                background: isOn ? 'var(--surface)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(cat)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left' }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `1.5px solid ${isOn ? 'var(--accent)' : 'var(--text-faint)'}`,
                    background: isOn ? 'var(--accent)' : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <span className="domain-dot" style={{ background: `var(--domain-${cat.domainClass})` }} />
                <span style={{ fontSize: 15.5, fontWeight: 600 }}>{cat.label}</span>
              </button>

              {isOn && (
                <div style={{ marginTop: 16, paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>Where are you starting from?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cat.levels.map((lvl) => (
                        <label key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-dim)' }}>
                          <input
                            type="radio"
                            name={`level-${cat.id}`}
                            checked={selected[cat.id]?.level === lvl.id}
                            onChange={() => setLevel(cat.id, lvl.id)}
                            style={{ width: 'auto' }}
                          />
                          {lvl.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>
                      Daily time budget: <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{selected[cat.id]?.dailyTimeBudgetMin} min</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={selected[cat.id]?.dailyTimeBudgetMin ?? cat.defaultMinutes}
                      onChange={(e) => setMinutes(cat.id, Number(e.target.value))}
                      style={{ width: '100%', background: 'transparent' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13.5, marginTop: 16 }}>{error}</div>}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleContinue}
        disabled={busy}
        style={{ marginTop: 28, width: '100%' }}
      >
        {busy ? 'Setting up…' : "Generate today's plan"}
      </button>
    </div>
  );
}

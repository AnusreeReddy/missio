import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import MissionCard from '../components/MissionCard.jsx';
import CheckInForm from '../components/CheckInForm.jsx';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Today() {
  const { user, logout } = useAuth();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(null);
  const date = todayStr();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, c] = await Promise.all([api.planToday(), api.getCheckIn(date).catch(() => null)]);
      setPlan(p);
      setCheckIn(c);
    } catch (err) {
      setError(err.message || 'Could not load today\u2019s plan.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVariantChange(missionId, variant) {
    // optimistic-ish: refetch the single mission after swap, patch into plan state
    const updated = await api.setVariant(missionId, variant);
    setPlan((prev) => ({
      ...prev,
      missions: prev.missions.map((m) => (m._id === missionId ? { ...m, ...updated } : m)),
    }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        building today\u2019s plan…
      </div>
    );
  }

  const adjustments = plan?.basis?.adjustmentsApplied || [];
  const activeMissions = plan?.missions?.filter((m) => m.status !== 'skipped') || [];
  const allDone = activeMissions.length > 0 && activeMissions.every((m) => m.status === 'completed');

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>MISSIO</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/progress" style={{ fontSize: 13, color: 'var(--text-dim)' }}>Progress</Link>
          <button type="button" className="btn-text" style={{ fontSize: 13 }} onClick={logout}>Log out</button>
        </div>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 4 }}>
        {allDone ? 'Today, done.' : "Today's missions"}
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 4 }}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {adjustments.length > 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
          {adjustments.map((a, i) => (
            <div key={i}>· {a}</div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 13.5, margin: '16px 0' }}>
          {error}{' '}
          <button type="button" className="btn-text" onClick={load}>Retry</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
        {activeMissions.map((mission) => (
          <MissionCard key={mission._id} mission={mission} onVariantChange={handleVariantChange} />
        ))}
        {activeMissions.length === 0 && !error && (
          <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            No missions for today yet. Set a goal in Onboarding to get started.
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        {!checkInOpen ? (
          <button type="button" className="btn-ghost" style={{ width: '100%', padding: '12px 16px', fontSize: 13.5 }} onClick={() => setCheckInOpen(true)}>
            {checkIn ? 'Update today\u2019s check-in' : 'How did you sleep? Quick check-in \u2192'}
          </button>
        ) : (
          <CheckInForm date={date} existing={checkIn} onSaved={(c) => { setCheckIn(c); setCheckInOpen(false); }} />
        )}
      </div>
    </div>
  );
}

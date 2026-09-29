import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Timer from '../components/Timer.jsx';

const DOMAIN_LABEL = { dsa: 'DSA', fitness: 'Workout', health: 'Health' };

export default function Execution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [outcomeChoice, setOutcomeChoice] = useState('success');

  const load = useCallback(async () => {
    try {
      const m = await api.getMission(id);
      setMission(m);
      if (m.status === 'planned') {
        const started = await api.startMission(id);
        setMission(started);
      }
    } catch (err) {
      setError(err.message || 'Could not load this mission.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <FullScreen>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Back to Today</button>
      </FullScreen>
    );
  }

  if (!mission) {
    return (
      <FullScreen>
        <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>loading mission…</p>
      </FullScreen>
    );
  }

  if (mission.status === 'completed') {
    return (
      <FullScreen>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--success)', marginBottom: 14 }}>MISSION COMPLETE</div>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{mission.title}</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 28 }}>
          {mission.steps.length} step{mission.steps.length === 1 ? '' : 's'} done. That's it \u2014 nothing else to decide today for this one.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>Back to Today</button>
      </FullScreen>
    );
  }

  const stepIndex = mission.steps.findIndex((s) => !s.completedAt);
  const step = mission.steps[stepIndex];
  const isLastStep = stepIndex === mission.steps.length - 1;

  async function handleDone() {
    setBusy(true);
    try {
      const outcome = isLastStep && mission.domain !== 'health' ? outcomeChoice : undefined;
      const updated = await api.completeStep(id, stepIndex, outcome);
      setMission(updated);
    } catch (err) {
      setError(err.message || 'Could not save that step.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSkipMission() {
    if (!window.confirm('Skip this mission for today? You can still do a Rescue version from Today.')) return;
    await api.skipMission(id);
    navigate('/');
  }

  return (
    <FullScreen>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span className="domain-tag">
            <span className={`domain-dot ${mission.domain}`} />
            {DOMAIN_LABEL[mission.domain] || mission.domain} · step {stepIndex + 1} / {mission.steps.length}
          </span>
          <button type="button" className="btn-text" style={{ fontSize: 12.5 }} onClick={handleSkipMission}>
            Skip mission
          </button>
        </div>

        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(stepIndex / mission.steps.length) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 200ms ease',
            }}
          />
        </div>

        <h1 style={{ fontSize: 22, lineHeight: 1.35, marginBottom: 10 }}>{step.label}</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>{step.instruction}</p>

        {step.url && (
          <a
            href={step.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ display: 'inline-flex', marginBottom: 28, fontSize: 13.5 }}
          >
            Open resource ↗
          </a>
        )}

        <div style={{ margin: '8px 0 32px' }}>
          <Timer durationSec={step.durationSec} stepKey={`${mission._id}-${stepIndex}`} />
        </div>

        {isLastStep && mission.domain !== 'health' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'success', label: 'Nailed it' },
              { id: 'struggled', label: 'Struggled' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOutcomeChoice(opt.id)}
                className="btn-ghost"
                style={{
                  flex: 1,
                  fontSize: 13,
                  borderColor: outcomeChoice === opt.id ? 'var(--accent)' : 'var(--border)',
                  color: outcomeChoice === opt.id ? 'var(--accent)' : 'var(--text-dim)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={handleDone} disabled={busy}>
          {busy ? 'Saving…' : isLastStep ? 'Finish mission' : 'Done \u2014 next step'}
        </button>
      </div>
    </FullScreen>
  );
}

function FullScreen({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

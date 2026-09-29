import { useEffect, useRef, useState } from 'react';

function format(sec) {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  const sign = sec < 0 ? '-' : '';
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
}

export default function Timer({ durationSec, stepKey }) {
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Reset when the step changes.
  useEffect(() => {
    setRemaining(durationSec);
    setRunning(false);
  }, [stepKey, durationSec]);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const overtime = remaining <= 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 56,
          fontWeight: 500,
          color: overtime ? 'var(--accent)' : 'var(--text)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-live="polite"
      >
        {format(remaining)}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
        <button type="button" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : remaining === durationSec ? 'Start timer' : 'Resume'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: '8px 18px', fontSize: 13 }}
          onClick={() => {
            setRunning(false);
            setRemaining(durationSec);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

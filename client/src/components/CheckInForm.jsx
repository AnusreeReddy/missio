import { useState } from 'react';
import { api } from '../api/client.js';

export default function CheckInForm({ date, existing, onSaved }) {
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours ?? '');
  const [waterLiters, setWaterLiters] = useState(existing?.waterLiters ?? '');
  const [energyLevel, setEnergyLevel] = useState(existing?.energyLevel ?? null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const checkIn = await api.checkIn({
        date,
        sleepHours: sleepHours === '' ? null : Number(sleepHours),
        waterLiters: waterLiters === '' ? null : Number(waterLiters),
        energyLevel,
      });
      setSaved(true);
      onSaved?.(checkIn);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
      <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 12 }}>
        Quick check-in \u2014 this shapes tomorrow's plan, not just a chart.
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label style={{ flex: '1 1 120px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 4 }}>Sleep (hrs)</div>
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="7"
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ flex: '1 1 120px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 4 }}>Water (L)</div>
          <input
            type="number"
            min={0}
            max={6}
            step={0.25}
            value={waterLiters}
            onChange={(e) => setWaterLiters(e.target.value)}
            placeholder="1.5"
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 6 }}>Energy today</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergyLevel(n)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius)',
                border: `1px solid ${energyLevel === n ? 'var(--accent)' : 'var(--border)'}`,
                color: energyLevel === n ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 14, width: '100%' }}
        onClick={handleSave}
        disabled={busy}
      >
        {busy ? 'Saving…' : saved ? 'Saved \u2713' : 'Save check-in'}
      </button>
    </div>
  );
}

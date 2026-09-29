import { useNavigate } from 'react-router-dom';

const DOMAIN_LABEL = { dsa: 'DSA', fitness: 'Workout', health: 'Health' };
const STATUS_LABEL = {
  planned: null,
  in_progress: 'In progress',
  completed: 'Completed',
  skipped: 'Skipped',
};
const VARIANT_LABEL = { ideal: 'Ideal', minimum: 'Minimum', rescue: 'Rescue' };

export default function MissionCard({ mission, onVariantChange }) {
  const navigate = useNavigate();
  const isDone = mission.status === 'completed';
  const isSkipped = mission.status === 'skipped';

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 18,
        background: 'var(--surface)',
        opacity: isSkipped ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <span className="domain-tag">
            <span className={`domain-dot ${mission.domain}`} />
            {DOMAIN_LABEL[mission.domain] || mission.domain}
            {STATUS_LABEL[mission.status] && (
              <span style={{ color: isDone ? 'var(--success)' : 'var(--text-faint)' }}>
                {' \u00b7 '}
                {STATUS_LABEL[mission.status]}
              </span>
            )}
          </span>
          <h3 style={{ fontSize: 18, marginTop: 8 }}>{mission.title}</h3>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          {mission.estMinutes} min
        </div>
      </div>

      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-faint)' }}>
        {mission.steps.length} step{mission.steps.length === 1 ? '' : 's'}
      </div>

      {!isDone && !isSkipped && mission.variantsAvailable && (
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {['ideal', 'minimum', 'rescue'].map((v) => {
            const available = mission.variantsAvailable[v];
            const active = mission.variant === v;
            return (
              <button
                key={v}
                type="button"
                disabled={!available}
                onClick={() => onVariantChange(mission._id, v)}
                className="btn-ghost"
                style={{
                  fontSize: 12.5,
                  padding: '6px 11px',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  color: active ? 'var(--accent)' : 'var(--text-dim)',
                  opacity: available ? 1 : 0.4,
                }}
                title={available ? `${VARIANT_LABEL[v]} \u00b7 ${available.estMinutes} min` : 'Not available'}
              >
                {VARIANT_LABEL[v]}
              </button>
            );
          })}
        </div>
      )}

      {!isDone && !isSkipped && (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 14, width: '100%' }}
          onClick={() => navigate(`/missions/${mission._id}`)}
        >
          {mission.status === 'in_progress' ? 'Continue mission' : 'Start mission'}
        </button>
      )}
    </div>
  );
}

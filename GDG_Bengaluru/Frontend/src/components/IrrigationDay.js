export default function IrrigationDay({ plan, index }) {
  if (!plan) return null;

  const cardClass = plan.irrigation_needed
    ? plan.heat_stress_alert
      ? 'irrigation-card heat-alert'
      : 'irrigation-card needs-water'
    : 'irrigation-card skip';

  return (
    <div className={cardClass}>
      <div className="irrigation-header">
        <h4>Day {index + 1}</h4>
        <div className="irrigation-badges">
          {plan.heat_stress_alert && (
            <span className="badge badge-red" style={{ fontSize: '0.625rem' }}>
              <span className="status-dot status-dot-red" /> Heat
            </span>
          )}
          {plan.irrigation_needed ? (
            <span className="badge badge-blue" style={{ fontSize: '0.625rem' }}>
              <span className="status-dot" style={{ background: '#3B82F6' }} /> Water
            </span>
          ) : (
            <span className="badge" style={{ fontSize: '0.625rem', background: 'var(--stone-100)', color: 'var(--stone-600)' }}>Skip</span>
          )}
        </div>
      </div>

      <div>
        <div className="irrigation-detail">
          <span className="irrigation-detail-label">Temp:</span>
          <span>{plan.temperature_max}°C max</span>
        </div>
        <div className="irrigation-detail">
          <span className="irrigation-detail-label">Rain:</span>
          <span>{plan.precipitation}mm</span>
        </div>

        {plan.irrigation_needed && (
          <>
            <div className="irrigation-detail" style={{ color: 'var(--info-700)', fontWeight: '500' }}>
              <span>Water:</span>
              <span>{plan.water_amount}</span>
            </div>
            <div className="irrigation-detail">
              <span className="irrigation-detail-label">When:</span>
              <span style={{ textTransform: 'capitalize' }}>{plan.best_time}</span>
            </div>
          </>
        )}

        <div className="irrigation-detail">
          <span className={`status-dot ${plan.pesticide_spray_ok ? 'status-dot-green' : 'status-dot-red'}`} />
          <span style={{ color: plan.pesticide_spray_ok ? 'var(--forest-700)' : 'var(--danger-600)' }}>
            {plan.pesticide_spray_ok ? 'Spray OK' : 'No spray'}
          </span>
        </div>
        {plan.spray_note && (
          <p style={{ fontSize: '0.6875rem', color: 'var(--stone-500)', fontStyle: 'italic', paddingLeft: '0.75rem' }}>
            {plan.spray_note}
          </p>
        )}
      </div>

      {plan.warnings?.length > 0 && (
        <div className="irrigation-warnings">
          {plan.warnings.map((w, i) => (
            <div key={i} className="irrigation-warning">{w}</div>
          ))}
        </div>
      )}

      {plan.heat_stress_note && (
        <div className="irrigation-heat-note">{plan.heat_stress_note}</div>
      )}
    </div>
  );
}

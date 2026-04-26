import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ScanHistoryCard({ scan }) {
  const date = new Date(scan.date);
  const severityColor = {
    severe: 'status-dot-red',
    moderate: 'status-dot-yellow',
    mild: 'status-dot-yellow',
    none: 'status-dot-green',
  };

  return (
    <div className="glass-card glass-card-hover scan-history-card">
      <div className="scan-history-content">
        {scan.imageUrl && (
          <img src={scan.imageUrl} alt={scan.crop_name} className="scan-history-thumb" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h4 className="scan-history-name">{scan.crop_name}</h4>
            <span className={`status-dot ${severityColor[scan.disease_severity?.toLowerCase()] || 'status-dot-green'}`} />
          </div>
          <p className="scan-history-disease">
            {scan.disease_detected === 'Healthy' ? 'Healthy' : scan.disease_detected}
          </p>
          <p className="scan-history-date">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MyCropPage() {
  const { farmer } = useAuth();
  const currentCrop = farmer?.currentCrop;
  const lastScan = currentCrop?.lastScan;
  const scanHistory = farmer?.scanHistory || [];

  return (
    <div className="page-transition page-bottom-padding" style={{ maxWidth: '56rem', margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)' }}>My Crop</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', marginTop: '0.25rem' }}>
          Your current crop status and scan history
        </p>
      </div>

      {/* Current Crop Card */}
      {currentCrop ? (
        <div className="glass-card crop-status-card mb-6">
          <div className="crop-status-content">
            {lastScan?.imageUrl && (
              <img src={lastScan.imageUrl} alt={currentCrop.name} className="crop-status-image" />
            )}
            <div style={{ flex: 1 }}>
              <div className="crop-name-row">
                <h2 className="crop-name">{currentCrop.name}</h2>
                {lastScan && (
                  <span className={`badge ${
                    lastScan.urgency_level?.toLowerCase() === 'act now' ? 'badge-red' :
                    lastScan.urgency_level?.toLowerCase() === 'monitor' ? 'badge-yellow' : 'badge-green'
                  }`}>
                    <span className={`status-dot ${
                      lastScan.urgency_level?.toLowerCase() === 'act now' ? 'status-dot-red' :
                      lastScan.urgency_level?.toLowerCase() === 'monitor' ? 'status-dot-yellow' : 'status-dot-green'
                    }`} />
                    {lastScan.urgency_level}
                  </span>
                )}
              </div>

              {lastScan && (
                <>
                  <div className="report-badges mb-3">
                    <span className="badge badge-blue">{lastScan.crop_age_estimate}</span>
                    <span className={`badge ${lastScan.disease_severity === 'none' ? 'badge-green' : 'badge-yellow'}`}>
                      {lastScan.disease_detected === 'Healthy' ? 'Healthy' : lastScan.disease_detected}
                    </span>
                  </div>
                  <p className="line-clamp-2 mb-3" style={{ fontSize: '0.875rem', color: 'var(--stone-600)' }}>
                    {lastScan.disease_description}
                  </p>
                </>
              )}

              <div className="crop-action-buttons">
                <Link to="/scanner" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                  Re-scan Crop
                </Link>
                <Link to="/weather" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                  View Irrigation Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card empty-state mb-6">
          <div className="empty-state-icon gradient-subtle">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '2rem', height: '2rem', color: 'var(--forest-500)' }} stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.8 0 3.5-.5 5-1.3" strokeLinecap="round"/>
              <path d="M12 6c-2 2-3 5-2 8M14 4c1 3 1 6 0 9M8.5 7c3-1 6-.5 8 1" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>No crop scanned yet</h3>
          <p>Scan your first crop to start tracking its health and get personalized care plans.</p>
          <Link to="/scanner" className="btn-primary">
            Scan Your First Crop
          </Link>
        </div>
      )}

      {/* Quick Access Cards */}
      {currentCrop && (
        <div className="crop-quick-stats mb-8">
          {lastScan?.recommended_pesticides?.length > 0 && (
            <div className="glass-card glass-card-hover crop-quick-stat">
              <p className="label">Recommended Pesticides</p>
              <p className="value">{lastScan.recommended_pesticides.length}</p>
              <p className="detail">
                {lastScan.recommended_pesticides[0]?.name}
                {lastScan.recommended_pesticides.length > 1 && ` +${lastScan.recommended_pesticides.length - 1} more`}
              </p>
            </div>
          )}
          {lastScan?.organic_alternatives?.length > 0 && (
            <div className="glass-card glass-card-hover crop-quick-stat">
              <p className="label">Organic Options</p>
              <p className="value">{lastScan.organic_alternatives.length}</p>
              <p className="detail">{lastScan.organic_alternatives[0]}</p>
            </div>
          )}
          {lastScan?.general_crop_tips?.length > 0 && (
            <div className="glass-card glass-card-hover crop-quick-stat">
              <p className="label">Care Tips Available</p>
              <p className="value">{lastScan.general_crop_tips.length}</p>
              <p className="detail">{lastScan.general_crop_tips[0]}</p>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <section>
          <h2 className="section-title mb-4">Scan History</h2>
          <div className="space-y-3">
            {scanHistory.map(scan => (
              <ScanHistoryCard key={scan.id} scan={scan} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

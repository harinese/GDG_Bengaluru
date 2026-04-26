export function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div className="skeleton" style={{ height: '1rem', width: '75%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '0.75rem', width: '100%', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: '0.75rem', width: '83%', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: '0.75rem', width: '66%' }} />
    </div>
  );
}

export function SkeletonReport() {
  return (
    <div className="page-transition space-y-4">
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="skeleton" style={{ height: '1.5rem', width: '50%', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="skeleton" style={{ height: '1.75rem', width: '5rem', borderRadius: '9999px' }} />
          <div className="skeleton" style={{ height: '1.75rem', width: '5rem', borderRadius: '9999px' }} />
        </div>
        <div className="skeleton" style={{ height: '0.75rem', width: '100%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '0.75rem', width: '80%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '0.75rem', width: '60%' }} />
      </div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="skeleton" style={{ height: '1.25rem', width: '33%', marginBottom: '1rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '6rem', borderRadius: '0.75rem' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonWeather() {
  return (
    <div className="space-y-4">
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="skeleton" style={{ height: '1.5rem', width: '40%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '4rem', width: '100%', borderRadius: '0.75rem' }} />
      </div>
      <div className="weather-cards-grid">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="glass-card" style={{ padding: '1rem' }}>
            <div className="skeleton" style={{ height: '1rem', width: '66%', margin: '0 auto 0.75rem' }} />
            <div className="skeleton" style={{ height: '2rem', width: '2rem', borderRadius: '50%', margin: '0 auto 0.75rem' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '100%', marginBottom: '0.25rem' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '75%', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonNews() {
  return (
    <div className="news-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="skeleton" style={{ height: '10rem', width: '100%', borderRadius: '0 0 0 0' }} />
          <div style={{ padding: '1rem' }}>
            <div className="skeleton" style={{ height: '1rem', width: '100%', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '83%', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '33%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

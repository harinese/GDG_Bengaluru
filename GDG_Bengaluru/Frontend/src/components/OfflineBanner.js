export default function OfflineBanner() {
  return (
    <div className="offline-banner">
      <span className="offline-banner-inner">
        <span className="status-dot" style={{ background: '#F87171' }} />
        You're offline — Some features may not work. Please check your connection.
      </span>
    </div>
  );
}

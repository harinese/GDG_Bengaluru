export default function WeatherCard({ day, isToday = false }) {
  const date = new Date(day.date);
  const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const precipLevel =
    day.precipitation > 10 ? 'heavy' :
    day.precipitation > 2 ? 'moderate' :
    day.precipitation > 0 ? 'light' : 'none';

  const precipColors = {
    heavy: { color: 'var(--info-600)', bg: 'var(--info-50)' },
    moderate: { color: 'var(--info-500)', bg: 'var(--info-50)' },
    light: { color: 'var(--info-400)', bg: 'rgba(239,246,255,0.5)' },
    none: { color: 'var(--stone-400)', bg: 'var(--stone-50)' },
  };

  const getWeatherIcon = () => {
    const iconStyle = { width: '2rem', height: '2rem' };
    if (day.precipitation > 5) return (
      <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, color: 'var(--info-500)' }} stroke="currentColor" strokeWidth="1.5">
        <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" strokeLinecap="round"/>
        <path d="M8 19v2M12 19v2M16 19v2" strokeLinecap="round"/>
      </svg>
    );
    if (day.precipitation > 0) return (
      <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, color: 'var(--info-400)' }} stroke="currentColor" strokeWidth="1.5">
        <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" strokeLinecap="round"/>
        <path d="M12 19v2" strokeLinecap="round"/>
      </svg>
    );
    if (day.temp_max > 35) return (
      <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, color: 'var(--danger-400)' }} stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round"/>
      </svg>
    );
    if (day.temp_max > 28) return (
      <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, color: 'var(--bronze-400)' }} stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" strokeLinecap="round"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, color: 'var(--stone-400)' }} stroke="currentColor" strokeWidth="1.5">
        <path d="M18 10h-1.26A8 8 0 104 16.25" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 2v1M17 4l-.7.7M20 8h-1" strokeLinecap="round"/>
      </svg>
    );
  };

  const pc = precipColors[precipLevel];

  return (
    <div className={`glass-card glass-card-hover weather-card ${isToday ? 'today' : ''}`}>
      <p className="weather-card-day" style={{ color: isToday ? 'var(--forest-600)' : 'var(--stone-700)' }}>
        {dayName}
      </p>
      <p className="weather-card-date">{dateStr}</p>
      <div className="weather-card-icon">{getWeatherIcon()}</div>
      <p className="weather-card-temp">{Math.round(day.temp_max)}°</p>
      <p className="weather-card-temp-min">
        {day.temp_min !== undefined ? `${Math.round(day.temp_min)}°` : ''}
      </p>
      <span className="weather-card-precip" style={{ color: pc.color, background: pc.bg }}>
        {day.precipitation.toFixed(1)}mm
      </span>
      {day.wind_speed && (
        <p className="weather-card-wind">{Math.round(day.wind_speed)} km/h</p>
      )}
    </div>
  );
}

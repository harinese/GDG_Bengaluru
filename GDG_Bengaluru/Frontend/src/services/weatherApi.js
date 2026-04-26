/**
 * weatherApi.js  —  Frontend service
 * Weather and geocoding are now proxied through the Python backend.
 * Backend endpoints:
 *   GET /api/weather          → Open-Meteo 7-day forecast + soil averages
 *   GET /api/weather/geocode  → Nominatim reverse geocoding
 *
 * Pure utility functions (alerts, descriptions, season, geolocation)
 * remain on the frontend — they don't need a network call.
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// ── Weather Forecast ──────────────────────────────────────────────────────────
export async function getWeatherForecast(latitude, longitude) {
  const params = new URLSearchParams({ latitude, longitude });
  const response = await fetch(`${API_BASE}/api/weather?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();  // includes daily_soil computed by backend
}

// ── Reverse Geocoding ─────────────────────────────────────────────────────────
export async function reverseGeocode(latitude, longitude) {
  try {
    const params = new URLSearchParams({ latitude, longitude });
    const res = await fetch(`${API_BASE}/api/weather/geocode?${params}`);
    if (!res.ok) return null;
    return res.json();  // { name, state, country, full }
  } catch {
    return null;
  }
}

// ── Weather Risk Alerts (pure — no network needed) ────────────────────────────
export function generateWeatherAlerts(days) {
  const alerts = [];

  days.forEach((day, i) => {
    const label = i === 0
      ? 'Today'
      : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

    if (day.temp_min != null && day.temp_min < 4)
      alerts.push({ type: 'frost', severity: 'high', day: label, message: `Frost risk — ${Math.round(day.temp_min)}°C min` });

    if (day.temp_max != null && day.temp_max > 38)
      alerts.push({ type: 'heat', severity: 'high', day: label, message: `Heat stress — ${Math.round(day.temp_max)}°C max` });

    if (day.precipitation != null && day.precipitation > 20)
      alerts.push({ type: 'rain', severity: 'medium', day: label, message: `Heavy rain — ${day.precipitation.toFixed(1)}mm` });

    if (day.uv_index != null && day.uv_index > 9)
      alerts.push({ type: 'uv', severity: 'medium', day: label, message: `Extreme UV — index ${day.uv_index.toFixed(0)}` });
  });

  // Drought check
  const dryDays = days.filter(d => (d.precipitation || 0) < 0.5).length;
  if (dryDays >= 5)
    alerts.push({ type: 'drought', severity: 'high', day: '~', message: `Drought risk — ${dryDays} dry days this week` });

  return alerts;
}

// ── Weather Code → Description (pure) ────────────────────────────────────────
export function getWeatherDescription(code) {
  const descriptions = {
    0:  { text: 'Clear sky',                    icon: 'sun' },
    1:  { text: 'Mainly clear',                 icon: 'sun-cloud' },
    2:  { text: 'Partly cloudy',                icon: 'cloud-sun' },
    3:  { text: 'Overcast',                     icon: 'cloud' },
    45: { text: 'Foggy',                        icon: 'fog' },
    48: { text: 'Depositing rime fog',          icon: 'fog' },
    51: { text: 'Light drizzle',                icon: 'rain-light' },
    53: { text: 'Moderate drizzle',             icon: 'rain-light' },
    55: { text: 'Dense drizzle',                icon: 'rain' },
    61: { text: 'Slight rain',                  icon: 'rain' },
    63: { text: 'Moderate rain',                icon: 'rain' },
    65: { text: 'Heavy rain',                   icon: 'rain-heavy' },
    71: { text: 'Slight snow',                  icon: 'snow' },
    73: { text: 'Moderate snow',                icon: 'snow' },
    75: { text: 'Heavy snow',                   icon: 'snow' },
    80: { text: 'Slight rain showers',          icon: 'rain-light' },
    81: { text: 'Moderate rain showers',        icon: 'rain' },
    82: { text: 'Violent rain showers',         icon: 'storm' },
    95: { text: 'Thunderstorm',                 icon: 'storm' },
    96: { text: 'Thunderstorm with hail',       icon: 'storm' },
    99: { text: 'Thunderstorm with heavy hail', icon: 'storm' },
  };
  return descriptions[code] || { text: 'Unknown', icon: 'thermometer' };
}

// ── Season Helper (pure) ──────────────────────────────────────────────────────
export function getCurrentSeason(latitude) {
  const month = new Date().getMonth() + 1;
  const isSouthern = latitude < 0;

  if (isSouthern) {
    if (month >= 3 && month <= 5) return 'Autumn';
    if (month >= 6 && month <= 8) return 'Winter';
    if (month >= 9 && month <= 11) return 'Spring';
    return 'Summer';
  } else {
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter';
  }
}

// ── Browser Geolocation (pure) ────────────────────────────────────────────────
export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

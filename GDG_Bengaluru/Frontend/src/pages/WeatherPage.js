import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getWeatherForecast, getLocation } from '../services/weatherApi';
import { generateIrrigationPlan } from '../services/geminiApi';
import WeatherCard from '../components/WeatherCard';
import IrrigationDay from '../components/IrrigationDay';
import { SkeletonWeather } from '../components/Skeletons';

export default function WeatherPage() {
  const { farmer } = useAuth();
  const { lang } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [irrigationPlan, setIrrigationPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [cropName, setCropName] = useState('');
  const [location, setLocationData] = useState(null);

  useEffect(() => {
    const profileCrop = farmer?.currentCrop?.name;
    if (profileCrop) {
      setCropName(profileCrop);
    }
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-translate if language changes
  useEffect(() => {
    if (irrigationPlan && !planLoading && weather) {
      handleGeneratePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getLocation();
      setLocationData(loc);
      const data = await getWeatherForecast(loc.latitude, loc.longitude);
      setWeather(data);
    } catch (err) {
      setError(
        err.code === 1
          ? 'Location access denied. Please enable location services to get weather data.'
          : 'Failed to fetch weather data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!cropName.trim()) {
      alert('Please enter a crop name to generate an irrigation plan.');
      return;
    }
    if (!weather) {
      alert('Weather data is required. Please wait for it to load.');
      return;
    }

    setPlanLoading(true);
    setPlanError(null);
    setIrrigationPlan(null);

    // Pass the raw Open-Meteo daily format — backend's compress_weather_data() expects this
    const weatherData = {
      daily: {
        time:                  weather.daily?.time                        || [],
        temperature_2m_max:    weather.daily?.temperature_2m_max          || [],
        temperature_2m_min:    weather.daily?.temperature_2m_min          || [],
        precipitation_sum:     weather.daily?.precipitation_sum           || [],
        windspeed_10m_max:     weather.daily?.windspeed_10m_max           || [],
        uv_index_max:          weather.daily?.uv_index_max                || [],
        relative_humidity_2m_mean: weather.daily?.relative_humidity_2m_mean || [],
      }
    };

    try {
      const plan = await generateIrrigationPlan(cropName, weatherData, lang);
      setIrrigationPlan(plan);
    } catch (err) {
      setPlanError('Failed to generate irrigation plan. Please check your API key and try again.');
    } finally {
      setPlanLoading(false);
    }
  };

  const days = weather?.daily?.time?.map((date, i) => ({
    date,
    temp_max: weather.daily.temperature_2m_max?.[i],
    temp_min: weather.daily.temperature_2m_min?.[i],
    precipitation: weather.daily.precipitation_sum?.[i] || 0,
    wind_speed: weather.daily.windspeed_10m_max?.[i],
    uv_index: weather.daily.uv_index_max?.[i],
    humidity: weather.daily.relative_humidity_2m_mean?.[i],
  })) || [];

  return (
    <div className="page-transition page-bottom-padding">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)' }}>Weather & Irrigation Planner</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', marginTop: '0.25rem' }}>
          7-day forecast with AI-powered irrigation scheduling
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card location-error-card">
          <div className="error-card-inner">
            <span className="status-dot status-dot-yellow" style={{ marginTop: '0.375rem' }} />
            <div>
              <h3 style={{ fontWeight: '600', color: 'var(--bronze-800)', marginBottom: '0.25rem' }}>Location Required</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--bronze-700)' }}>{error}</p>
              <button onClick={loadWeather} className="btn-primary" style={{ marginTop: '0.75rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <SkeletonWeather />}

      {!loading && weather && (
        <>
          {/* Current Weather */}
          {weather.current && (
            <div className="glass-card weather-summary-card">
              <div className="weather-summary-inner">
                <div className="weather-summary-left">
                  <div className="weather-summary-icon">
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.75rem', height: '1.75rem', color: 'var(--info-500)' }} stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="weather-summary-temp">{Math.round(weather.current.temperature_2m)}°C</p>
                    <p className="weather-summary-humidity">Humidity: {weather.current.relative_humidity_2m}%</p>
                  </div>
                </div>
                <div className="weather-summary-right">
                  <p>{location?.latitude?.toFixed(2)}°, {location?.longitude?.toFixed(2)}°</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)' }}>{weather.timezone}</p>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          <div className="mb-8">
            <h2 className="section-title mb-4">7-Day Forecast</h2>
            <div className="weather-cards-grid">
              {days.map((day, i) => (
                <WeatherCard key={day.date} day={day} isToday={i === 0} />
              ))}
            </div>
          </div>

          {/* Irrigation Planner */}
          <div className="glass-card mb-6" style={{ padding: '1.5rem' }}>
            <h2 className="section-title mb-4">Generate Irrigation Plan</h2>
            <div className="irrigation-form">
              <div className="irrigation-form-input">
                <label htmlFor="crop-name-input" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--stone-500)', marginBottom: '0.375rem', fontWeight: '500' }}>
                  Crop Name
                </label>
                <input
                  id="crop-name-input"
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g., Tomato, Rice, Wheat..."
                  className="input-field"
                />
              </div>
              <div className="irrigation-form-button">
                <button
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  className="btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                >
                  {planLoading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Generating...
                    </>
                  ) : (
                    'Generate Plan'
                  )}
                </button>
              </div>
            </div>
          </div>

          {planError && (
            <div className="glass-card error-card mb-6" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--danger-700)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-red" /> {planError}
              </p>
            </div>
          )}

          {planLoading && (
            <div className="glass-card mb-6" style={{ padding: '2rem' }}>
              <div className="text-center">
                <div className="spinner" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--stone-600)' }}>Generating your irrigation schedule...</p>
              </div>
            </div>
          )}

          {irrigationPlan && (
            <div className="page-transition">
              {irrigationPlan.weekly_summary && (
                <div className="glass-card gradient-subtle mb-6" style={{ padding: '1.5rem', border: '1px solid var(--forest-200)' }}>
                  <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.5rem' }}>Weekly Summary</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)', lineHeight: '1.6' }}>
                    {irrigationPlan.weekly_summary}
                  </p>
                </div>
              )}

              <h3 className="section-title mb-4">Daily Irrigation Schedule</h3>
              <div className="irrigation-grid mb-6">
                {irrigationPlan.daily_plan?.map((day, i) => (
                  <IrrigationDay key={i} plan={day} index={i} />
                ))}
              </div>

              {irrigationPlan.recommended_pesticides?.length > 0 && (
                <div className="glass-card mb-6" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '1rem' }}>Recommended Pesticides for this Weather</h3>
                  <div className="irrigation-pest-grid">
                    {irrigationPlan.recommended_pesticides.map((pest, i) => (
                      <div key={i} className="irrigation-pest-card">
                        <h4 className="irrigation-pest-name">{pest.name}</h4>
                        <p className="irrigation-pest-detail">
                          <span style={{ fontWeight: '500' }}>Why needed:</span> {pest.purpose}
                        </p>
                        <p className="irrigation-pest-detail">
                          <span style={{ fontWeight: '500' }}>Dosage:</span>{' '}
                          <span className="irrigation-pest-dosage">{pest.dosage}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {irrigationPlan.general_irrigation_tips?.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.75rem' }}>Irrigation Tips</h3>
                  <div>
                    {irrigationPlan.general_irrigation_tips.map((tip, i) => (
                      <div key={i} className="list-item">
                        <span className="list-item-icon">›</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

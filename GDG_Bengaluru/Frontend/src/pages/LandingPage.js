import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { register, login } = useAuth();
  const { t } = useLanguage();
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    password: '', 
    location: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (isSignup && !formData.name.trim()) {
      setError(t('landing.errNameRequired') || 'Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('landing.errPhoneRequired') || 'Phone is required');
      return;
    }
    if (!formData.password.trim() || formData.password.length < 4) {
      setError(t('landing.errPassLengths') || 'Password too short');
      return;
    }

    try {
      setLoading(true);
      if (isSignup) {
        await register(formData);
      } else {
        await login(formData.phone, formData.password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--stone-50)' }}>
      {/* Nav */}
      <nav className="landing-nav">
        <div className="navbar-logo">
          <div className="navbar-logo-icon gradient-primary">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.8 0 3.5-.5 5-1.3" strokeLinecap="round"/>
              <path d="M12 6c-2 2-3 5-2 8M14 4c1 3 1 6 0 9M8.5 7c3-1 6-.5 8 1" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="navbar-brand">
            Agri<span>Lens</span>
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-grid">
          {/* Left: Copy */}
          <div>
            <div className="landing-tag">
              <span className="status-dot status-dot-green" />
              {t('landing.tag')}
            </div>
            <h1 className="landing-title">
              {t('landing.heroTitle1')}<br />
              <span>{t('landing.heroTitle2')}</span>
            </h1>
            <p className="landing-desc">
              {t('landing.heroDesc')}
            </p>

            {/* Features */}
            <div className="landing-features">
              {[
                { title: t('landing.featDetect'), desc: t('landing.featDetectDesc') },
                { title: t('landing.featPlan'), desc: t('landing.featPlanDesc') },
                { title: t('landing.featWeather'), desc: t('landing.featWeatherDesc') },
              ].map(f => (
                <div key={f.title} className="landing-feature">
                  <div className="landing-feature-check">
                    <svg viewBox="0 0 16 16" fill="none" style={{ width: '0.75rem', height: '0.75rem', color: 'var(--forest-600)' }}>
                      <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="glass-card landing-form-card">
            <h2>{isSignup ? t('landing.getStarted') : t('landing.welcomeBack')}</h2>
            <p className="subtitle">
              {isSignup ? t('landing.createProfile') : t('landing.loginPhonePass')}
            </p>

            {error && <div style={{ color: 'var(--danger-500)', background: 'var(--danger-50)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="landing-form-group">
                  <label htmlFor="farmer-name">{t('landing.fullName')}</label>
                  <input
                    id="farmer-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('landing.namePlaceholder')}
                    className="input-field"
                  />
                </div>
              )}

              <div className="landing-form-group">
                <label htmlFor="farmer-phone">{t('landing.phoneReq')}</label>
                <input
                  id="farmer-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                  className="input-field"
                />
              </div>

              <div className="landing-form-group">
                <label htmlFor="farmer-password">{t('landing.password')}</label>
                <input
                  id="farmer-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              {isSignup && (
                <div className="landing-form-group">
                  <label htmlFor="farmer-location">{t('landing.village')}</label>
                  <input
                    id="farmer-location"
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    placeholder={t('landing.locPlaceholder')}
                    className="input-field"
                  />
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                {loading ? t('common.loading') : (isSignup ? t('landing.create') : t('landing.continue'))}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="landing-toggle"
            >
              {isSignup ? t('landing.hasProfile') : t('landing.newHere')}
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="landing-stats">
        <div className="landing-stats-inner">
          {[
            { value: '50+', label: t('landing.stat1') },
            { value: '95%', label: t('landing.stat2') },
            { value: t('landing.stat3val'), label: t('landing.stat3') },
            { value: t('landing.stat4val'), label: t('landing.stat4') },
          ].map(s => (
            <div key={s.label}>
              <p className="landing-stat-value">{s.value}</p>
              <p className="landing-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

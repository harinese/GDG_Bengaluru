import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function Navbar() {
  const { farmer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const [showProfile, setShowProfile] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLang(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = farmer?.name
    ? farmer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/my-crop', label: t('nav.myCrop') },
    { path: '/scanner', label: t('nav.scanner') },
    { path: '/weather', label: t('nav.weather') },
    { path: '/encyclopedia', label: t('nav.encyclopedia') },
    { path: '/community', label: t('nav.community') },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar-desktop">
        <div className="navbar-desktop-inner">
          <NavLink to="/" className="navbar-logo">
            <div className="navbar-logo-icon gradient-primary">
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '1rem', height: '1rem', color: 'white' }} stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.8 0 3.5-.5 5-1.3" strokeLinecap="round"/>
                <path d="M12 6c-2 2-3 5-2 8M14 4c1 3 1 6 0 9" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="navbar-brand">
              Agri<span>Lens</span>
            </span>
          </NavLink>

          <div className="navbar-links">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-controls">
            {/* Language Selector */}
            <div className="lang-selector" ref={langRef}>
              <button
                onClick={() => setShowLang(!showLang)}
                className="lang-btn"
                aria-label="Change language"
              >
                {lang}
              </button>
              {showLang && (
                <div className="lang-dropdown glass-card">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLang(false); }}
                      className={`lang-option ${lang === l.code ? 'active' : ''}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 16 16" fill="none" style={{ width: '0.875rem', height: '0.875rem' }} stroke="currentColor" strokeWidth="1.5">
                  <path d="M13.5 8.5a5.5 5.5 0 01-6-6 5.5 5.5 0 106 6z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" style={{ width: '0.875rem', height: '0.875rem' }} stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="3"/>
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Profile */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="navbar-profile-btn gradient-primary"
              >
                {initials}
              </button>

              {showProfile && (
                <div className="navbar-dropdown glass-card">
                  <div className="navbar-dropdown-info">
                    <p className="navbar-dropdown-name">{farmer?.name}</p>
                    {farmer?.location && (
                      <p className="navbar-dropdown-location">{farmer.location}</p>
                    )}
                  </div>
                  <button onClick={logout} className="navbar-logout-btn">
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="navbar-mobile">
        <div className="navbar-mobile-inner">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              <div className="navbar-mobile-dot" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for desktop nav */}
      <div className="navbar-spacer-desktop" />
    </>
  );
}

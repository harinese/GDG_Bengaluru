import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [animationState, setAnimationState] = useState('start');

  useEffect(() => {
    const t1 = setTimeout(() => setAnimationState('drawing'), 100);
    const t2 = setTimeout(() => setAnimationState('text'), 1000);
    const t3 = setTimeout(() => setAnimationState('exit'), 2200);
    const t4 = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${animationState === 'exit' ? 'exit' : ''}`}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo Icon */}
        <div className={`splash-logo-box ${
          animationState !== 'start' ? 'visible' : ''
        } ${animationState === 'text' || animationState === 'exit' ? 'glow' : ''}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              color: 'white',
              transition: 'all 0.7s',
              opacity: animationState === 'start' ? 0 : 1,
              transform: animationState === 'start' ? 'scale(0.5)' : 'scale(1)',
            }}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeDasharray="100"
              strokeDashoffset={animationState === 'start' ? '100' : '0'}
              style={{ transition: 'all 1s ease-out' }}
              d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.8 0 3.5-.5 5-1.3"
              strokeLinecap="round"
            />
            <path
              strokeDasharray="50"
              strokeDashoffset={animationState === 'start' ? '50' : '0'}
              style={{ transition: 'all 0.7s ease-out 0.3s' }}
              d="M12 6c-2 2-3 5-2 8M14 4c1 3 1 6 0 9M8.5 7c3-1 6-.5 8 1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div style={{ overflow: 'hidden' }}>
          <h1 className={`splash-title ${
            animationState === 'text' || animationState === 'exit' ? 'visible' : ''
          }`}>
            Agri<span style={{ color: 'var(--forest-300)' }}>Lens</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className={`splash-subtitle ${
          animationState === 'text' || animationState === 'exit' ? 'visible' : ''
        }`}>
          Smarter farming starts here
        </p>
      </div>

      {/* Loading Bar */}
      <div className="splash-bar-track">
        <div className={`splash-bar-fill ${animationState !== 'start' ? 'active' : ''}`} />
      </div>
    </div>
  );
}

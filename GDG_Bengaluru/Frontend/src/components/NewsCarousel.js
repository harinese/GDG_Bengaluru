import { useState, useEffect, useCallback } from 'react';
import { getAgricultureNews } from '../services/newsApi';
import { useLanguage } from '../context/LanguageContext';

const trendingStories = [
  {
    title: 'Dragon Fruit Farmer Earns 2 Crore Annually Using Precision Agriculture',
    description: 'A Karnataka farmer transformed a barren 5-acre plot into a high-yield dragon fruit farm using drip irrigation and AI-based soil monitoring.',
    source: { name: 'AgriTrends' },
    tag: 'Success Story',
    image: 'https://images.unsplash.com/photo-1592982537447-6f2ae8c1c5bb?w=1200&q=80',
  },
  {
    title: 'New Drone Spraying Technology Reduces Pesticide Usage by 30%',
    description: 'Agricultural drones equipped with AI vision can now precisely target affected areas, reducing chemical usage while improving crop protection.',
    source: { name: 'TechFarm' },
    tag: 'Innovation',
    image: 'https://images.unsplash.com/photo-1563968743333-044cef8528f8?w=1200&q=80',
  },
  {
    title: 'Government Announces 10,000 Crore Package for Climate-Resilient Farming',
    description: 'The new initiative provides subsidized seeds, crop insurance, and training for farmers affected by unpredictable weather patterns.',
    source: { name: 'PolicyWatch' },
    tag: 'Policy',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1200&q=80',
  },
  {
    title: 'Organic Farming Movement Grows: Premium Prices for Chemical-Free Produce',
    description: 'Urban demand for organic vegetables has doubled, creating an opportunity for farmers to earn 40-60% more through certified organic practices.',
    source: { name: 'MarketPulse' },
    tag: 'Market',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80',
  },
  {
    title: 'AI Soil Sensors Help Farmers Save 50% on Fertilizer Costs',
    description: 'Smart sensors that analyze soil nutrition in real-time are helping farmers apply the exact amount of fertilizer needed, reducing waste and costs.',
    source: { name: 'AgriTech' },
    tag: 'Technology',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad849?w=1200&q=80',
  },
];

const tagColors = {
  'Success Story': { bg: 'var(--forest-100)', color: 'var(--forest-700)' },
  'Innovation': { bg: 'var(--info-100)', color: 'var(--info-600)' },
  'Policy': { bg: 'var(--bronze-100)', color: 'var(--bronze-700)' },
  'Market': { bg: 'var(--forest-50)', color: 'var(--forest-600)' },
  'Technology': { bg: 'var(--info-50)', color: 'var(--info-600)' },
  'Live News': { bg: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' },
};

export default function NewsCarousel() {
  const { lang } = useLanguage();
  const [stories, setStories] = useState(trendingStories);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imgError, setImgError] = useState({});

  // Fetch live news and merge with trending
  useEffect(() => {
    getAgricultureNews(lang).then(articles => {
      if (articles?.length > 0) {
        const liveStories = articles.slice(0, 5).map(a => ({
          title: a.title,
          description: a.description,
          source: a.source,
          url: a.url,
          image: a.image,
          tag: 'Live News',
        }));
        // Put live stories first so users see fresh news immediately
        setStories([...liveStories, ...trendingStories]);
      }
    }).catch(() => {});
  }, [lang]);

  // Auto-play
  const nextSlide = useCallback(() => {
    setCurrent(prev => (prev + 1) % stories.length);
    setImgError({});
  }, [stories.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide]);

  const prevSlide = () => {
    setCurrent(prev => (prev - 1 + stories.length) % stories.length);
    setImgError({});
  };

  const goToSlide = (index) => {
    setCurrent(index);
    setImgError({});
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const story = stories[current];
  if (!story) return null;

  const tc = tagColors[story.tag] || { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' };

  return (
    <div
      className="news-carousel"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image / Pattern */}
      <div className="news-carousel-bg carousel-enter" key={`bg-${current}`}>
        {story.image && !imgError[current] ? (
          <>
            <img
              src={story.image}
              alt=""
              onError={() => setImgError(prev => ({ ...prev, [current]: true }))}
            />
            <div className="news-carousel-bg-overlay" />
          </>
        ) : (
          <>
            <div className="news-carousel-bg-pattern" />
            <div className="news-carousel-bg-dots" />
          </>
        )}
      </div>

      <div className="news-carousel-content">
        {/* Content */}
        <div className="carousel-enter" key={current}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {story.tag && (
              <span
                className="news-carousel-tag"
                style={{ background: tc.bg, color: tc.color }}
              >
                {story.tag}
              </span>
            )}
            {story.source?.name && (
              <span className="news-carousel-source">{story.source.name}</span>
            )}
          </div>
          <h3 className="news-carousel-title line-clamp-2">
            {story.url ? (
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                {story.title}
              </a>
            ) : story.title}
          </h3>
          <p className="news-carousel-desc line-clamp-2">
            {story.description}
          </p>
        </div>

        {/* Controls */}
        <div className="news-carousel-controls">
          <div className="news-carousel-dots">
            {stories.slice(0, 10).map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`news-carousel-dot ${i === current ? 'active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            {stories.length > 10 && (
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', marginLeft: '0.25rem' }}>
                +{stories.length - 10}
              </span>
            )}
          </div>

          <div className="news-carousel-arrows">
            <button onClick={prevSlide} className="news-carousel-arrow" aria-label="Previous slide">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={nextSlide} className="news-carousel-arrow" aria-label="Next slide">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

export default function NewsCard({ article }) {
  const [imgError, setImgError] = useState(false);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover news-card"
    >
      <div className="news-card-image">
        {article.image && !imgError ? (
          <img
            src={article.image}
            alt={article.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="news-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--forest-300)' }} stroke="currentColor" strokeWidth="1">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.8 0 3.5-.5 5-1.3" strokeLinecap="round"/>
              <path d="M12 6c-2 2-3 5-2 8M14 4c1 3 1 6 0 9M8.5 7c3-1 6-.5 8 1" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        <div className="news-card-image-overlay" />
        {article.source?.name && (
          <span className="news-card-source-badge">{article.source.name}</span>
        )}
      </div>
      <div className="news-card-body">
        <h3 className="line-clamp-2">{article.title}</h3>
        <p className="desc line-clamp-2">{article.description}</p>
        <p className="date">{formatDate(article.publishedAt)}</p>
      </div>
    </a>
  );
}

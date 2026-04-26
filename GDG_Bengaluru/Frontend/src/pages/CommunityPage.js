import React, { useState } from 'react';
import './CommunityPage.css';
import { useLanguage } from '../context/LanguageContext';

const createInitialPosts = (t) => [
  {
    id: 1,
    author: 'Ravi Kumar',
    handle: '@ravifarms',
    avatar: 'https://images.unsplash.com/photo-1595958380311-53e77f0a1c6a?w=150&h=150&fit=crop',
    time: '2h ago',
    content: 'Just deployed the new automated drip irrigation system across my 5-acre tomato field. Seeing a 30% reduction in water usage already! The soil moisture sensors are perfectly synced with the AgriLens app. 🍅💧',
    image: 'https://images.unsplash.com/photo-1592841200229-bb585d405610?w=800&fit=crop',
    tags: ['#Irrigation', '#SmartFarming', '#Tomato'],
    likes: 124,
    comments: 18,
    isLiked: false,
  },
  {
    id: 2,
    author: 'AgriTech Solutions',
    handle: '@agritech_ind',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop',
    isVerified: true,
    time: '5h ago',
    content: '🚀 Launching our new Solar-Powered Pest Repeller! Designed specifically for organic farmers in India. Emits high-frequency ultrasonic waves keeping rodents and insects away without any harmful chemicals.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad849?w=800&fit=crop',
    tags: ['#Innovation', '#OrganicFarming', '#AgriTech'],
    innovationLink: 'https://agritech-solutions.in/solar-repeller',
    likes: 342,
    comments: 45,
    isLiked: true,
  },
  {
    id: 3,
    author: 'Sunita Patel',
    handle: '@sunitagrows',
    avatar: 'https://images.unsplash.com/photo-1589311394017-488667ad8413?w=150&h=150&fit=crop',
    time: '1d ago',
    content: 'Question for the community: My wheat crop is showing yellowing tips on the upper leaves (Day 45). Uploaded to AgriLens scanner but wondering if anyone has experienced this specific magnesium deficiency pattern before?',
    tags: ['#Wheat', '#CropCare', '#FarmingAdvice'],
    likes: 56,
    comments: 24,
    isLiked: false,
  }
];

const getTrendingTopics = (t) => [
  { category: t('comm.tech'), topic: '#DroneSpraying', posts: `2.4K ${t('comm.posts')}` },
  { category: t('comm.cropsCat'), topic: '#MangoSeason', posts: `1.8K ${t('comm.posts')}` },
  { category: t('comm.market'), topic: 'Wheat MSP 2026', posts: `5.1K ${t('comm.posts')}` },
  { category: t('comm.innovationCat'), topic: 'Hydroponics Setup', posts: `945 ${t('comm.posts')}` }
];

export default function CommunityPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState(() => createInitialPosts(t));
  const [newPost, setNewPost] = useState('');

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handlePostSubmit = () => {
    if (!newPost.trim()) return;
    
    const post = {
      id: Date.now(),
      author: t('comm.you'),
      handle: '@current_farmer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      time: t('comm.justNow'),
      content: newPost,
      tags: [],
      likes: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className="page-transition page-bottom-padding">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)' }}>{t('comm.title')}</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', marginTop: '0.25rem' }}>
          {t('comm.subtitle')}
        </p>
      </div>

      <div className="community-container">
        {/* Main Feed */}
        <div className="community-feed">
          {/* Post Creation Box */}
          <div className="glass-card create-post-card">
            <textarea 
              className="create-post-input"
              placeholder={t('comm.placeholder')}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="create-post-actions">
              <div className="post-tools">
                <button className="tool-btn" title={t('comm.addImage')}>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
                <button className="tool-btn" title={t('comm.addLink')}>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
              </div>
              <button 
                className="btn-primary" 
                onClick={handlePostSubmit}
                style={{ borderRadius: '999px', padding: '0.5rem 1.5rem' }}
              >
                {t('comm.post')}
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          {posts.map(post => (
            <div key={post.id} className="glass-card post-card">
              <div className="post-header">
                <img src={post.avatar} alt={post.author} className="post-avatar" referrerPolicy="no-referrer" />
                <div className="post-author-info">
                  <div className="post-author-name">
                    {post.author}
                    {post.isVerified && (
                      <span className="post-author-badge" title={t('comm.verified')}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="post-time">{post.handle} • {post.time}</div>
                </div>
              </div>

              <div className="post-content">
                {post.content}
              </div>

              {post.image && (
                <img src={post.image} alt="Post content" className="post-media" referrerPolicy="no-referrer" />
              )}

              {post.innovationLink && (
                <a href={post.innovationLink} target="_blank" rel="noreferrer" className="post-innovation-link">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {t('comm.purchase')}
                </a>
              )}

              {post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="post-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="post-interactions">
                <button 
                  className={`interaction-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <svg viewBox="0 0 24 24" fill={post.isLiked ? "currentColor" : "none"} width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {post.likes}
                </button>
                <button className="interaction-btn">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  {post.comments}
                </button>
                <button className="interaction-btn">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="community-sidebar">
          {/* Trending Card */}
          <div className="glass-card sidebar-card">
            <h3 className="sidebar-title">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              {t('comm.trending')}
            </h3>
            <div>
              {getTrendingTopics(t).map((topic, i) => (
                <div key={i} className="trending-item">
                  <div className="trending-category">{topic.category}</div>
                  <div className="trending-topic">{topic.topic}</div>
                  <div className="trending-posts">{topic.posts}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Innovators Card */}
          <div className="glass-card sidebar-card">
            <h3 className="sidebar-title">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {t('comm.topInnovators')}
            </h3>
            <div className="innovator-item">
              <img src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop" referrerPolicy="no-referrer" alt="AgriTech" className="innovator-avatar" />
              <div className="innovator-info">
                <div className="innovator-name">AgriTech Solutions</div>
                <div className="innovator-handle">@agritech_ind</div>
              </div>
              <button className="follow-btn">{t('comm.follow')}</button>
            </div>
            <div className="innovator-item">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop" referrerPolicy="no-referrer" alt="Kisan" className="innovator-avatar" />
              <div className="innovator-info">
                <div className="innovator-name">Kisan Drones</div>
                <div className="innovator-handle">@kisandrones</div>
              </div>
              <button className="follow-btn">{t('comm.follow')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

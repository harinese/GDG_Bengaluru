import { useState, useEffect } from 'react';
import { generateCropProfile } from '../services/geminiApi';
import { useLanguage } from '../context/LanguageContext';

const commonCrops = [
  { name: 'Rice', category: 'Cereal', image: 'https://images.unsplash.com/photo-1506102390745-f6c152c1767e?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Wheat', category: 'Cereal', image: 'https://images.unsplash.com/photo-1473216858204-7ab9a3e2183e?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Corn (Maize)', category: 'Cereal', image: 'https://images.unsplash.com/photo-1599806497127-1fdfecbe98ef?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Tomato', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1592841200229-bb585d405610?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Potato', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Onion', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1618512496248-a07ce80bb4bb?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Cotton', category: 'Cash Crop', image: 'https://images.unsplash.com/photo-1583321526487-759b7944122d?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Sugarcane', category: 'Cash Crop', image: 'https://images.unsplash.com/photo-1590494441584-c819175f7823?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Soybean', category: 'Legume', image: 'https://images.unsplash.com/photo-1551641506-ee5bc4cb22f6?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Chickpea', category: 'Legume', image: 'https://images.unsplash.com/photo-1515942400420-bbaf3fae21db?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Mango', category: 'Fruit', image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Banana', category: 'Fruit', image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Apple', category: 'Fruit', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b9faa6?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Grape', category: 'Fruit', image: 'https://images.unsplash.com/photo-1596426462788-b2deaf80edaa?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Chili Pepper', category: 'Spice', image: 'https://images.unsplash.com/photo-1588015332195-ddcc9b9643d9?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Turmeric', category: 'Spice', image: 'https://images.unsplash.com/photo-1615486511484-60ef02604c3d?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Tea', category: 'Beverage', image: 'https://images.unsplash.com/photo-1555510657-37d45543d226?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Coffee', category: 'Beverage', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Sunflower', category: 'Oilseed', image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Groundnut', category: 'Oilseed', image: 'https://images.unsplash.com/photo-1629828456641-a67b45f4df21?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Cabbage', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1530914949503-490e620573e8?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Carrot', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1598170845058-285d304bd3c6?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Cucumber', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1604977211151-50ea0415aefc?w=1920&h=1080&fit=crop&q=100' },
  { name: 'Okra (Lady Finger)', category: 'Vegetable', image: 'https://images.unsplash.com/photo-1595856403661-bc370ce7c8d9?w=1920&h=1080&fit=crop&q=100' },
];

function CropProfileDisplay({ profile }) {
  if (!profile) return null;

  return (
    <div className="page-transition space-y-4">
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)', marginBottom: '0.125rem' }}>{profile.crop_name}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', fontStyle: 'italic', marginBottom: '0.75rem' }}>{profile.scientific_name}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)', lineHeight: '1.6' }}>{profile.description}</p>
      </div>

      {/* Quick Stats */}
      <div className="profile-stats-grid">
        {[
          { label: 'Season', value: profile.growing_season },
          { label: 'Temperature', value: profile.ideal_temperature },
          { label: 'Soil', value: profile.soil_type },
          { label: 'Water Needs', value: profile.water_needs },
          { label: 'Sunlight', value: profile.sunlight },
          { label: 'Spacing', value: profile.spacing },
          { label: 'Germination', value: profile.germination_time },
          { label: 'Harvest', value: profile.harvest_time },
        ].map((stat) => (
          <div key={stat.label} className="glass-card glass-card-hover profile-stat-card">
            <p className="profile-stat-label">{stat.label}</p>
            <p className="profile-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Yield */}
      {profile.yield_estimate && (
        <div className="glass-card gradient-subtle" style={{ padding: '1.25rem', border: '1px solid var(--forest-200)' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.25rem' }}>Expected Yield</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)' }}>{profile.yield_estimate}</p>
        </div>
      )}

      {/* Diseases */}
      {profile.common_diseases?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="section-title mb-4">Common Diseases</h3>
          <div>
            {profile.common_diseases.map((disease, i) => (
              <div key={i} className="disease-card">
                <h4>{disease.name}</h4>
                <p><span style={{ fontWeight: '500' }}>Symptoms:</span> {disease.symptoms}</p>
                <p className="prevention"><span style={{ fontWeight: '500' }}>Prevention:</span> {disease.prevention}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pests & Companions */}
      <div className="pests-companions-grid">
        {profile.common_pests?.length > 0 && (
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.75rem' }}>Common Pests</h3>
            <div className="tag-grid">
              {profile.common_pests.map((pest, i) => (
                <span key={i} className="badge badge-yellow">{pest}</span>
              ))}
            </div>
          </div>
        )}
        {profile.companion_plants?.length > 0 && (
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.75rem' }}>Companion Plants</h3>
            <div className="tag-grid">
              {profile.companion_plants.map((plant, i) => (
                <span key={i} className="badge badge-green">{plant}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nutrition */}
      {profile.nutritional_needs && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.5rem' }}>Nutritional Needs</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)', lineHeight: '1.6' }}>{profile.nutritional_needs}</p>
        </div>
      )}

      {/* Care Tips */}
      {profile.care_tips?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.75rem' }}>Care Tips</h3>
          <div>
            {profile.care_tips.map((tip, i) => (
              <div key={i} className="list-item">
                <span className="list-item-icon">›</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EncyclopediaPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filteredCrops = commonCrops.filter(
    crop => crop.name.toLowerCase().includes(search.toLowerCase()) ||
            crop.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredCrops.map(c => c.category))];

  const handleCropSelect = async (crop) => {
    setSelectedCrop(crop);
    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const result = await generateCropProfile(crop.name, lang);
      setProfile(result);
    } catch (err) {
      setError('Failed to generate crop profile. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-translate if language changes
  useEffect(() => {
    if (selectedCrop && profile && !loading) {
      handleCropSelect(selectedCrop);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleBack = () => {
    setSelectedCrop(null);
    setProfile(null);
    setError(null);
  };

  return (
    <div className="page-transition page-bottom-padding">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)' }}>Crop Encyclopedia</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', marginTop: '0.25rem' }}>
          Search crops and get AI-generated growing guides
        </p>
      </div>

      {selectedCrop && (
        <button onClick={handleBack} className="back-btn">
          <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
            <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to crops
        </button>
      )}

      {!selectedCrop && (
        <>
          {/* Search Bar */}
          <div className="search-bar-wrapper">
            <svg viewBox="0 0 16 16" fill="none" className="search-bar-icon" style={{ width: '1rem', height: '1rem', color: 'var(--stone-400)' }} stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="5"/>
              <path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              id="crop-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crops by name or category..."
              className="input-field search-bar-input"
            />
          </div>

          {/* Crop Grid by Category */}
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h2 className="category-title">{category}</h2>
              <div className="crop-grid">
                {filteredCrops
                  .filter(c => c.category === category)
                  .map((crop) => (
                    <button
                      key={crop.name}
                      onClick={() => handleCropSelect(crop)}
                      className="glass-card glass-card-hover crop-grid-item"
                      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ height: '16rem', width: '100%', position: 'relative' }}>
                        <img 
                          src={crop.image} 
                          alt={crop.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                        <span style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', color: 'white', fontWeight: '600', fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {crop.name}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}

          {filteredCrops.length === 0 && (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <p style={{ color: 'var(--stone-500)', fontSize: '0.875rem' }}>No crops found matching "{search}"</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', marginTop: '0.25rem' }}>Try a different search term</p>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="glass-card text-center" style={{ padding: '3rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--stone-600)', fontWeight: '500', fontSize: '0.875rem' }}>
            Generating profile for {selectedCrop?.name}...
          </p>
        </div>
      )}

      {error && (
        <div className="glass-card error-card">
          <p style={{ fontSize: '0.875rem', color: 'var(--danger-700)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="status-dot status-dot-red" /> {error}
          </p>
          <button onClick={() => handleCropSelect(selectedCrop)} className="error-retry-btn">
            Try again
          </button>
        </div>
      )}

      {profile && <CropProfileDisplay profile={profile} />}
    </div>
  );
}

import { useLanguage } from '../context/LanguageContext';

// Generate mock product data from scan results
function generateProducts(scanData) {
  const fertilizers = [];
  const pesticides = [];
  const organic = [];

  // Generate fertilizer suggestions based on the scan
  if (scanData.fertilizer_suggestions) {
    const ferts = scanData.fertilizer_suggestions.split(/[,;.]/).filter(f => f.trim().length > 3);
    ferts.slice(0, 3).forEach((f, i) => {
      fertilizers.push({
        name: f.trim(),
        brand: ['CropGuard Pro', 'AgriBest', 'FarmFirst'][i % 3],
        price: (Math.floor(Math.random() * 500) + 150),
        unit: 'per kg',
        rating: (4.0 + Math.random() * 0.8).toFixed(1),
      });
    });
  }

  // If few fertilizers, add generic ones
  if (fertilizers.length < 2) {
    fertilizers.push(
      { name: 'NPK 19-19-19 Fertilizer', brand: 'CropGuard Pro', price: 280, unit: 'per kg', rating: '4.5' },
      { name: 'DAP (Diammonium Phosphate)', brand: 'AgriBest', price: 350, unit: 'per bag', rating: '4.3' },
    );
  }

  // Pesticides from scan
  if (scanData.recommended_pesticides?.length > 0) {
    scanData.recommended_pesticides.forEach(p => {
      pesticides.push({
        name: p.name,
        type: p.type,
        brand: 'CropShield',
        price: (Math.floor(Math.random() * 400) + 200),
        unit: 'per liter',
        rating: (4.0 + Math.random() * 0.8).toFixed(1),
      });
    });
  }

  // Organic alternatives from scan
  if (scanData.organic_alternatives?.length > 0) {
    scanData.organic_alternatives.forEach(alt => {
      organic.push({
        name: alt,
        brand: 'GreenFarm Organics',
        price: (Math.floor(Math.random() * 300) + 100),
        unit: 'per pack',
        rating: (4.0 + Math.random() * 0.9).toFixed(1),
      });
    });
  }

  return { fertilizers, pesticides, organic };
}

function ProductCard({ product, t }) {
  return (
    <div className="eshop-product-card">
      {/* Image placeholder */}
      <div className="eshop-product-image">
        <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--forest-400)' }} stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <path d="M8 17l3-4 2 2 3-4 3 4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
        </svg>
      </div>
      <div className="eshop-product-info">
        <h4 className="eshop-product-name">{product.name}</h4>
        <p className="eshop-product-brand">{product.brand}</p>
        <div className="eshop-product-footer">
          <div>
            <span className="eshop-product-price">₹{product.price}</span>
            <span className="eshop-product-unit"> {product.unit}</span>
          </div>
          <span className="eshop-product-rating">★ {product.rating}</span>
        </div>
        <button className="eshop-cart-btn" disabled>
          {t('eshop.addToCart')}
          <span className="eshop-coming-soon">{t('eshop.comingSoon')}</span>
        </button>
      </div>
    </div>
  );
}

export default function EShopWindow({ scanData, onClose }) {
  const { t } = useLanguage();

  if (!scanData) return null;

  const { fertilizers, pesticides, organic } = generateProducts(scanData);

  return (
    <div className="eshop-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="eshop-window">
        {/* Header */}
        <div className="eshop-header">
          <div>
            <h2 className="eshop-title">{t('eshop.title')}</h2>
            <p className="eshop-subtitle">
              {t('eshop.subtitle')} — {scanData.crop_name}
            </p>
          </div>
          <button onClick={onClose} className="eshop-close-btn" aria-label="Close shop">
            <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="eshop-body">
          {/* Coming Soon Banner */}
          <div className="eshop-banner">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round"/>
            </svg>
            <span>AgriLens E-Shop is coming soon! Product listings are based on your scan results.</span>
          </div>

          {/* Fertilizers */}
          {fertilizers.length > 0 && (
            <div className="eshop-section">
              <h3 className="eshop-section-title">{t('eshop.fertilizers')}</h3>
              <div className="eshop-products-grid">
                {fertilizers.map((p, i) => <ProductCard key={i} product={p} t={t} />)}
              </div>
            </div>
          )}

          {/* Pesticides */}
          {pesticides.length > 0 && (
            <div className="eshop-section">
              <h3 className="eshop-section-title">{t('eshop.pesticides')}</h3>
              <div className="eshop-products-grid">
                {pesticides.map((p, i) => <ProductCard key={i} product={p} t={t} />)}
              </div>
            </div>
          )}

          {/* Organic */}
          {organic.length > 0 && (
            <div className="eshop-section">
              <h3 className="eshop-section-title">{t('eshop.organic')}</h3>
              <div className="eshop-products-grid">
                {organic.map((p, i) => <ProductCard key={i} product={p} t={t} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

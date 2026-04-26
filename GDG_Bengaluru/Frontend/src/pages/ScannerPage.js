import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ImageUploader from '../components/ImageUploader';
import CropReport from '../components/CropReport';
import EShopWindow from '../components/EShopWindow';
import { SkeletonReport } from '../components/Skeletons';
import { analyzeCropImage } from '../services/geminiApi';

export default function ScannerPage() {
  const { saveScanResult } = useAuth();
  const { t, lang } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [showShop, setShowShop] = useState(false);

  const [currentScan, setCurrentScan] = useState(null);

  // Auto-translate if language changes while a report is showing
  useEffect(() => {
    if (currentScan && report && !isProcessing) {
      const reAnalyze = async () => {
        setIsProcessing(true);
        try {
          const result = await analyzeCropImage(currentScan.base64, currentScan.mimeType, lang);
          setReport(result);
          saveScanResult(result, currentScan.dataUrl);
        } catch (err) {
          console.error('Translation re-analysis failed:', err);
        } finally {
          setIsProcessing(false);
        }
      };
      reAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleImageSelect = async (base64, mimeType, dataUrl) => {
    setCurrentScan({ base64, mimeType, dataUrl });
    setIsProcessing(true);
    setError(null);
    setReport(null);
    setImageUrl(dataUrl);

    try {
      const result = await analyzeCropImage(base64, mimeType, lang);
      setReport(result);
      saveScanResult(result, dataUrl);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err.message.includes('API') || err.message.includes('Gemini') || err.message.includes('quota') || err.message.includes('429')
          ? 'API Quota Exceeded: The AI service has reached its request limit. Please try again later or use a different API key.'
          : 'Failed to analyze the image. Please try again with a clearer photo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setReport(null);
    setError(null);
    setImageUrl(null);
    setShowShop(false);
    setCurrentScan(null);
  };

  return (
    <div className="page-transition page-bottom-padding" style={{ maxWidth: '56rem', margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--stone-900)' }}>{t('scanner.title')}</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', marginTop: '0.25rem' }}>
          {t('scanner.subtitle')}
        </p>
      </div>

      {/* Upload Section */}
      {!report && (
        <div className="mb-6">
          <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && <SkeletonReport />}

      {/* Error State */}
      {error && (
        <div className="glass-card error-card mb-4">
          <div className="error-card-inner">
            <span className="status-dot status-dot-red" style={{ marginTop: '0.375rem' }} />
            <div>
              <h3>{t('scanner.failed')}</h3>
              <p>{error}</p>
              <button onClick={resetScan} className="error-retry-btn">
                {t('scanner.tryAgain')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <>
          <div className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={resetScan} className="back-btn">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('scanner.scanAnother')}
            </button>
            <button
              onClick={() => setShowShop(true)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
            >
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '0.875rem', height: '0.875rem' }} stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1h2l1.5 8h8L15 4H4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="13" r="1"/>
                <circle cx="12" cy="13" r="1"/>
              </svg>
              {t('scanner.shopBtn')}
            </button>
          </div>
          <CropReport data={report} imageUrl={imageUrl} onReset={() => setReport(null)} />
        </>
      )}

      {/* E-Shop Window */}
      {showShop && report && (
        <EShopWindow scanData={report} onClose={() => setShowShop(false)} />
      )}

      {/* Tips Section */}
      {!report && !isProcessing && !error && (
        <div className="mt-8">
          <h2 className="section-title mb-4">{t('scanner.tips')}</h2>
          <div className="tips-grid">
            {[
              { title: 'Good Lighting', desc: 'Take photos in natural daylight for accurate color detection' },
              { title: 'Close-Up Shots', desc: 'Capture affected leaves or stems up close for better analysis' },
              { title: 'Clear Focus', desc: 'Ensure the image is sharp and not blurry for precise identification' },
              { title: 'Show Symptoms', desc: 'Include discolored, spotted, or wilting areas in the frame' },
            ].map((tip) => (
              <div key={tip.title} className="glass-card glass-card-hover tip-card">
                <div className="tip-icon">
                  <div className="tip-icon-dot" />
                </div>
                <div>
                  <h3 className="tip-title">{tip.title}</h3>
                  <p className="tip-desc">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

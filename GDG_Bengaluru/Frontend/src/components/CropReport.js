import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLanguage } from '../context/LanguageContext';

function UrgencyBadge({ level }) {
  const config = {
    'act now': { className: 'badge-red', dot: 'status-dot-red' },
    'monitor': { className: 'badge-yellow', dot: 'status-dot-yellow' },
    'routine': { className: 'badge-green', dot: 'status-dot-green' },
  };
  const c = config[level?.toLowerCase()] || config['routine'];
  return (
    <span className={`badge ${c.className}`}>
      <span className={`status-dot ${c.dot}`} />
      {level}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const config = {
    'severe': 'badge-red',
    'moderate': 'badge-yellow',
    'mild': 'badge-yellow',
    'none': 'badge-green',
  };
  return (
    <span className={`badge ${config[severity?.toLowerCase()] || 'badge-green'}`}>
      {severity}
    </span>
  );
}

function PesticideCard({ pesticide, t }) {
  return (
    <div className="pesticide-card">
      <div className="pesticide-header">
        <h4 className="pesticide-name">{pesticide.name}</h4>
      </div>
      <div className="pesticide-details">
        <div className="pesticide-detail-row">
          <span className="pesticide-detail-label">{t('report.type')}:</span>
          <span style={{ textTransform: 'capitalize' }}>{pesticide.type}</span>
        </div>
        <div className="pesticide-detail-row">
          <span className="pesticide-detail-label">{t('report.dosage')}:</span>
          <span className="pesticide-dosage">{pesticide.dosage}</span>
        </div>
        <div className="pesticide-detail-row">
          <span className="pesticide-detail-label">{t('report.apply')}:</span>
          <span>{pesticide.application_method}</span>
        </div>
        <div className="pesticide-detail-row">
          <span className="pesticide-detail-label">{t('report.frequency')}:</span>
          <span>{pesticide.frequency}</span>
        </div>
        {pesticide.precautions && (
          <div className="pesticide-precaution">
            {t('report.warning')}: {pesticide.precautions}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CropReport({ data, imageUrl, onReset }) {
  const { t } = useLanguage();
  const reportRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#FAFAF9',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `agrilens-report-${data.crop_name || 'crop'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#FAFAF9',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`agrilens-report-${data.crop_name || 'crop'}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgriLens Report: ${data.crop_name}`,
          text: `Crop: ${data.crop_name}\nDisease: ${data.disease_detected}\nUrgency: ${data.urgency_level}\n\nAnalyzed by AgriLens`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share error:', err);
      }
    } else {
      const text = `AgriLens Report\nCrop: ${data.crop_name}\nDisease: ${data.disease_detected}\nSeverity: ${data.disease_severity}\nUrgency: ${data.urgency_level}`;
      navigator.clipboard.writeText(text);
      alert('Report summary copied to clipboard!');
    }
  };

  if (!data) return null;

  return (
    <div className="page-transition">
      {/* Image Preview Modal */}
      {showPreview && imageUrl && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)', padding: '1rem'
          }}
          onClick={() => setShowPreview(false)}
        >
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <button 
              onClick={() => setShowPreview(false)}
              style={{
                position: 'absolute', top: '-2.5rem', right: '0', color: 'white',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '500'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.5rem', height: '1.5rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('report.close')}
            </button>
            <img 
              src={imageUrl} 
              alt="Full size crop" 
              style={{ 
                maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', 
                borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="report-actions">
        <button onClick={handleDownloadImage} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
          {t('report.saveAsImage')}
        </button>
        <button onClick={handleDownloadPDF} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
          {t('report.downloadPdf')}
        </button>
        <button onClick={handleShare} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
          {t('report.share')}
        </button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-4">
        {/* Header Card */}
        <div className="glass-card report-header-card">
          <div className="report-header-content">
            {imageUrl && (
              <div 
                className="report-header-image-wrapper hover-scale" 
                onClick={() => setShowPreview(true)}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: '12px' }}
                title="Click to view full image"
              >
                <img src={imageUrl} alt="Scanned crop" className="report-header-image" />
                <div style={{
                  position: 'absolute', bottom: '0.25rem', right: '0.25rem', 
                  background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '4px',
                  padding: '2px 4px', pointerEvents: 'none'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div className="report-badges">
                <h2 className="report-crop-name">{data.crop_name}</h2>
                <UrgencyBadge level={data.urgency_level} />
              </div>
              <div className="report-badges">
                <span className="badge badge-blue">{data.crop_age_estimate}</span>
                <SeverityBadge severity={data.disease_severity} />
              </div>
              <p className="report-disease-desc">{data.disease_description}</p>
            </div>
          </div>
        </div>

        {/* Disease & Treatment */}
        {data.disease_detected?.toLowerCase() !== 'healthy' && (
          <div className="glass-card report-section">
            <h3 className="section-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {t('report.diseaseDetected')}:
              <span style={{ color: data.disease_severity === 'severe' ? 'var(--danger-600)' : 'var(--bronze-600)' }}>
                {data.disease_detected}
              </span>
            </h3>

            <div className="mb-4">
              <h4 style={{ fontWeight: '600', color: 'var(--stone-700)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{t('report.treatmentPlan')}</h4>
              <div>
                {data.treatment_plan?.map((step, i) => (
                  <div key={i} className="report-treatment-step">
                    <span className="report-step-number gradient-primary">{i + 1}</span>
                    <span className="report-step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pesticides */}
        {data.recommended_pesticides?.length > 0 && (
          <div className="glass-card report-section">
            <h3 className="section-title mb-4">{t('report.recommendedPesticides')}</h3>
            <div className="pesticide-grid">
              {data.recommended_pesticides.map((p, i) => (
                <PesticideCard key={i} pesticide={p} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* Organic Alternatives */}
        {data.organic_alternatives?.length > 0 && (
          <div className="glass-card report-section">
            <h3 className="section-title mb-3">{t('report.organicAlternatives')}</h3>
            <div>
              {data.organic_alternatives.map((alt, i) => (
                <div key={i} className="list-item">
                  <span className="list-item-icon">›</span>
                  <span>{alt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fertilizer Suggestions */}
        {data.fertilizer_suggestions && (
          <div className="glass-card report-section">
            <h3 className="section-title mb-3">{t('report.fertilizerSuggestions')}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)', lineHeight: '1.6' }}>{data.fertilizer_suggestions}</p>
          </div>
        )}

        {/* General Tips */}
        {data.general_crop_tips?.length > 0 && (
          <div className="glass-card report-section">
            <h3 className="section-title mb-3">{t('report.cropCareTips')}</h3>
            <div className="tips-grid">
              {data.general_crop_tips.map((tip, i) => (
                <div key={i} className="list-item-bg">
                  <div className="list-item">
                    <span className="list-item-icon">•</span>
                    <span>{tip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="report-footer">
          Analyzed by AgriLens AI — {new Date().toLocaleDateString()}
        </div>

        {/* Bottom Actions */}
        {onReset && (
          <div style={{ marginTop: '2rem', paddingBottom: '2rem', textAlign: 'center' }}>
            <button 
              onClick={onReset} 
              className="btn-primary" 
              style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg viewBox="0 0 24 24" fill="none" style={{ width: '1.25rem', height: '1.25rem' }} stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Scan another leaf
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

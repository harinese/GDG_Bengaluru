import { useRef, useState, useCallback } from 'react';

export default function ImageUploader({ onImageSelect, isProcessing }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const compressImage = useCallback((file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            } else {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ dataUrl: compressed, base64: compressed.split(',')[1], mimeType: 'image/jpeg' });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const { dataUrl, base64, mimeType } = await compressImage(file);
    setPreview(dataUrl);
    onImageSelect(base64, mimeType, dataUrl);
  }, [onImageSelect, compressImage]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div style={{ width: '100%' }}>
      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`uploader-dropzone ${dragActive ? 'drag-active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="uploader-icon-box">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '2rem', height: '2rem', color: 'var(--forest-500)' }} stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--stone-800)', marginBottom: '0.25rem' }}>
            Drop your crop photo here
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--stone-400)', marginBottom: '1.5rem' }}>
            or click to browse — supports JPEG, PNG, WebP
          </p>
          <div className="uploader-buttons">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Upload Photo
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              className="btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              Take Photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="crop-file-upload"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="crop-camera-capture"
          />
        </div>
      ) : (
        <div className="uploader-preview">
          <img src={preview} alt="Crop preview" />
          {isProcessing && (
            <div className="uploader-processing-overlay">
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div className="spinner spinner-sm animate-spin-slow" style={{
                  width: '2.5rem', height: '2.5rem',
                  borderWidth: '3px',
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  marginBottom: '0.75rem',
                  display: 'inline-block'
                }} />
                <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>Analyzing your crop...</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>This may take a few seconds</p>
              </div>
            </div>
          )}
          {!isProcessing && (
            <button onClick={clearImage} className="uploader-clear-btn" title="Remove image">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

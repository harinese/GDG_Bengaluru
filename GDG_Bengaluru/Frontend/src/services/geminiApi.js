/**
 * geminiApi.js  —  Frontend service
 * All Gemini calls are now proxied through the Python backend.
 * Backend endpoints:
 *   POST /api/analyze-crop      → crop image disease analysis
 *   POST /api/irrigation-plan   → 7-day irrigation schedule
 *   POST /api/crop-profile      → full agronomic crop profile
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// ── Utility: handle API response ─────────────────────────────────────────────
async function apiPost(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Backend error: ${response.status}`);
  }

  return response.json();
}

// ── Crop Image Analysis ───────────────────────────────────────────────────────
export async function analyzeCropImage(base64Image, mimeType = 'image/jpeg', language = 'en') {
  return apiPost('/api/analyze-crop', {
    base64_image: base64Image,
    mime_type: mimeType,
    language: language,
  });
}

// ── Irrigation Plan ───────────────────────────────────────────────────────────
export async function generateIrrigationPlan(cropName, weatherData, language = 'en') {
  return apiPost('/api/irrigation-plan', {
    crop_name: cropName,
    weather_data: weatherData,
    language: language,
  });
}

// ── Crop Profile ──────────────────────────────────────────────────────────────
export async function generateCropProfile(cropName, language = 'en') {
  return apiPost('/api/crop-profile', {
    crop_name: cropName,
    language: language,
  });
}

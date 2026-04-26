/**
 * newsApi.js  —  Frontend service
 * Agriculture news is now fetched from the Python backend.
 * Backend endpoint:
 *   GET /api/news  → GNews articles enriched with Pixabay images
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export async function getAgricultureNews(language = 'en') {
  try {
    const response = await fetch(`${API_BASE}/api/news?language=${language}`, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const articles = await response.json();
    return articles;
  } catch (err) {
    console.warn('News fetch failed:', err.message);
    return getFallbackNews();
  }
}

// ── Static fallback (shown when backend is unreachable) ───────────────────────
function getFallbackNews() {
  return [
    {
      title: 'New Bio-Pesticide Approved for Organic Farming',
      description: 'A bio-pesticide from neem extract has been approved for organic farming, offering effective pest control without harmful chemicals.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1592982537447-6f2ae8c1c5bb?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'AgriNews', url: '#' },
    },
    {
      title: 'Government Launches New Crop Insurance Scheme',
      description: 'A comprehensive crop insurance scheme protects farmers from natural calamities, pests, and diseases.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'FarmPolicy', url: '#' },
    },
    {
      title: 'Drip Irrigation Saves 40% Water in Summer Crops',
      description: 'Drip irrigation saves up to 40% water compared to flood irrigation while increasing crop yields by 20-30%.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'WaterWise', url: '#' },
    },
    {
      title: 'AI-Powered Crop Monitoring Gains Traction',
      description: 'AI is revolutionizing agriculture with smart disease detection and irrigation optimization.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad849?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'TechFarm', url: '#' },
    },
    {
      title: 'Rising Demand for Organic Vegetables in Urban Markets',
      description: 'Urban consumers are increasingly seeking organic vegetables, creating new opportunities for farmers.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1563968743333-044cef8528f8?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'MarketWatch', url: '#' },
    },
    {
      title: 'Smart Greenhouse Technology Doubles Winter Yield',
      description: 'IoT-enabled greenhouses report 2x yield improvements through automated climate control and LED lighting.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=70',
      publishedAt: new Date().toISOString(),
      source: { name: 'AgriTech', url: '#' },
    },
  ];
}

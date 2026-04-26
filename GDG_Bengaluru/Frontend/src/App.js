import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import AskAgent from './components/AskAgent';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import WeatherPage from './pages/WeatherPage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import CommunityPage from './pages/CommunityPage';
import MyCropPage from './pages/MyCropPage';
import SplashScreen from './components/SplashScreen';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div style={{
        transition: 'opacity 0.5s ease 0.3s',
        opacity: showSplash ? 0 : 1,
        height: showSplash ? 0 : 'auto',
        overflow: showSplash ? 'hidden' : 'visible',
      }}>
        {!isOnline && <OfflineBanner />}
        <Routes>
          {/* Public */}
          <Route
            path="/landing"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          {/* Protected */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/my-crop" element={<MyCropPage />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/weather" element={<WeatherPage />} />
                    <Route path="/encyclopedia" element={<EncyclopediaPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                  </Routes>
                </main>
                <AskAgent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

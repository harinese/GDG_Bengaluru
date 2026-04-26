import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'agrilens_auth_token';
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function loadToken() {
  return localStorage.getItem(STORAGE_KEY) || null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadToken());
  const [farmer, setFarmer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session Validation on Mount ──
  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      
      // Validate token securely via Backend
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Session Expired');
        return res.json();
      })
      .then(data => {
        setFarmer(data.profile);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Session check failed:', err);
        logout();
        setIsLoading(false);
      });
      
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setFarmer(null);
      setIsLoading(false);
    }
  }, [token]);

  // ── Sync with Backend ──
  const syncWithBackend = async (profile) => {
    if (!profile || !token) return;
    try {
      await fetch(`${API_BASE}/api/auth/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ profile }),
      });
    } catch (err) {
      console.error('FastAPI Auth sync error:', err);
    }
  };

  const register = async (profileData) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileData.name,
        phone: profileData.phone,
        password: profileData.password,
        location: profileData.location || '',
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    setToken(data.token);
    setFarmer(data.profile);
    return data.profile;
  };

  const login = async (phone, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    setToken(data.token);
    setFarmer(data.profile);
    return data.profile;
  };

  const logout = () => {
    setToken(null);
    setFarmer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (updates) => {
    const newProfile = { ...farmer, ...updates };
    setFarmer(newProfile);
    syncWithBackend(newProfile);
  };

  const saveScanResult = (scanData, imageUrl) => {
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageUrl,
      ...scanData,
    };
    const history = [entry, ...(farmer?.scanHistory || [])].slice(0, 20);
    const newProfile = {
      ...farmer,
      scanHistory: history,
      currentCrop: {
        name: scanData.crop_name,
        lastScan: entry,
        updatedAt: new Date().toISOString(),
      },
    };
    setFarmer(newProfile);
    syncWithBackend(newProfile);
  };

  const setCurrentCrop = (cropName) => {
    const newProfile = {
      ...farmer,
      currentCrop: {
        ...(farmer?.currentCrop || {}),
        name: cropName,
        updatedAt: new Date().toISOString(),
      },
    };
    setFarmer(newProfile);
    syncWithBackend(newProfile);
  };

  const value = {
    farmer,
    token,
    isAuthenticated: !!farmer,
    isLoading,
    register,
    login,
    logout,
    updateProfile,
    saveScanResult,
    setCurrentCrop,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

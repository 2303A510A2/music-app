import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const data = {
      userId: userData.userId,
      fullName: userData.fullName,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      adminStatus: userData.adminStatus || 'none'
    };
    localStorage.setItem('authUser', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    setUser(null);
  };

  const updateProfile = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('authUser', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

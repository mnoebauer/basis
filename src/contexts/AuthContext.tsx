import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedLoginState = localStorage.getItem('basisi_logged_in');
    if (savedLoginState === 'true') {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('basisi_logged_in', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('basisi_logged_in');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

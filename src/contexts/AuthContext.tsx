import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  mode: 'local' | 'cloud' | null;
  email: string | null;
  localPath: string | null;
  login: (mode: 'local' | 'cloud', email?: string, localPath?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<'local' | 'cloud' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedLoginState = localStorage.getItem('basisi_logged_in');
    const savedMode = localStorage.getItem('basisi_mode') as 'local' | 'cloud' | null;
    const savedEmail = localStorage.getItem('basisi_email');
    const savedLocalPath = localStorage.getItem('basisi_localPath');
    
    if (savedLoginState === 'true') {
      setIsLoggedIn(true);
      if (savedMode) setMode(savedMode);
      if (savedEmail) setEmail(savedEmail);
      if (savedLocalPath) setLocalPath(savedLocalPath);
    }
    setIsLoading(false);
  }, []);

  const login = (newMode: 'local' | 'cloud', newEmail?: string, newLocalPath?: string) => {
    setIsLoggedIn(true);
    setMode(newMode);
    if (newEmail) setEmail(newEmail);
    if (newLocalPath) setLocalPath(newLocalPath);
    
    localStorage.setItem('basisi_logged_in', 'true');
    localStorage.setItem('basisi_mode', newMode);
    if (newEmail) localStorage.setItem('basisi_email', newEmail);
    if (newLocalPath) localStorage.setItem('basisi_localPath', newLocalPath);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setMode(null);
    setEmail(null);
    setLocalPath(null);
    localStorage.removeItem('basisi_logged_in');
    localStorage.removeItem('basisi_mode');
    localStorage.removeItem('basisi_email');
    localStorage.removeItem('basisi_localPath');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, mode, email, localPath, login, logout, isLoading }}>
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

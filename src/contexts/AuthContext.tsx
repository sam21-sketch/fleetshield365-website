import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  company_name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  subscription_status: string;
  vehicle_count: number;
  max_vehicles: number;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company_name: string;
  vehicle_count: number;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<{ checkout_url: string }>;
  logout: () => void;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setCompany(response.data.company);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false) => {
    const response = await api.post('/auth/login', { 
      email: emailOrUsername, 
      password,
      remember_me: rememberMe 
    });
    localStorage.setItem('token', response.data.access_token);
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    const originUrl = window.location.origin;
    const response = await api.post('/auth/register-company', { ...data, origin_url: originUrl });
    
    // For free model, automatically log in after registration
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      await fetchUser();
    }
    
    return { checkout_url: response.data.checkout_url };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
  };

  const refreshCompany = async () => {
    if (user) {
      await fetchUser();
    }
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, register, logout, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

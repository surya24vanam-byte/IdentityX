import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details on boot if token exists
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setSession(res.data.session);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      console.warn('Failed to verify token:', err);
      // Invalidate if token is unserviceable
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login action
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    
    // Check if MFA is required
    if (res.data?.mfa_required) {
      return {
        mfa_required: true,
        user_id: res.data.user_id,
        email: res.data.email,
        demo_otp: res.data.demo_otp
      };
    }

    // Direct Login Successful
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(accessToken);
    setUser(res.data.user);
    setSession(res.data.session);

    return {
      mfa_required: false,
      user: res.data.user
    };
  };

  // Complete MFA Login
  const completeMfaLogin = async (userId, otpCode) => {
    const res = await api.post('/auth/verify-otp', {
      user_id: userId,
      otp_code: otpCode
    });

    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(accessToken);
    setUser(res.data.user);
    setSession(res.data.session);

    return res.data.user;
  };

  // Register action
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res;
  };

  // Logout action
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setSession(null);
    }
  };

  // Helper check methods
  const hasRole = useCallback((roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.toUpperCase() === roleName.toUpperCase());
  }, [user]);

  const hasPermission = useCallback((permName) => {
    if (!user || !user.permissions) return false;
    return user.permissions.some((p) => p.toUpperCase() === permName.toUpperCase());
  }, [user]);

  const isAdmin = hasRole('ADMIN');

  const value = {
    user,
    session,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin,
    login,
    completeMfaLogin,
    register,
    logout,
    refreshUser,
    hasRole,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

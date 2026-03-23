import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * Authentication Provider
 * Manages authentication state and token storage
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      // Verify token and load user
      fetchCurrentUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(authToken);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    const { token: newToken, user: newUser } = data;

    // Store token
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);

    return data;
  };

  const signup = async (email, password, name, mosque) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, mosque: mosque || undefined }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    const { token: newToken, user: newUser } = data;

    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);

    return data;
  };

  const requestPasswordReset = async (email) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }

    return response.json();
  };

  const resetPassword = async (token, newPassword) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  };

  const socialLogin = async (provider) => {
    // For local development, show a helpful message
    if (import.meta.env.MODE === 'development') {
      throw new Error(`${provider} login requires AWS Cognito setup. In production, this will redirect to Cognito Hosted UI.`);
    }

    // In production, this would redirect to Cognito OAuth URL
    // const cognitoUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/authorize?identity_provider=${provider}&...`;
    // window.location.href = cognitoUrl;
    
    throw new Error('Social login not yet configured');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    requestPasswordReset,
    resetPassword,
    socialLogin,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

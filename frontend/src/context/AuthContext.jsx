import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // In a real app, you would validate the token with your backend
      // or decode it to get user information
      setToken(storedToken);
      // For now, we'll just set a placeholder email
      // In a real app, you would get this from the token or fetch user data
      setUser({ email: 'user@example.com' });
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      // For now, just set the email from the login form
      // In a real app, you would decode the JWT or fetch user data
      setUser({ email });
      
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    // Add a method to check if user has specific role
    hasRole: (role) => {
      // In a real app, you would check the user's roles from the token or user object
      // For now, we'll just return true if the user is authenticated
      return !!token;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;

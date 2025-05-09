import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

const authSlice = (set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  initialized: false,
  authenticated: false,
  colorMode: localStorage.getItem('colorMode') || 'light',
  
  // Set color mode
  setColorMode: (mode) => {
    localStorage.setItem('colorMode', mode);
    set(state => {
      state.authSlice.colorMode = mode;
    });
  },

  // Initialize user from token
  loadUserProfile: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set(state => {
        state.authSlice.initialized = true;
        state.authSlice.authenticated = false;
      });
      return;
    }

    try {
      // Check token expiration
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        set(state => {
          state.authSlice.token = null;
          state.authSlice.user = null;
          state.authSlice.authenticated = false;
          state.authSlice.initialized = true;
        });
        return;
      }

      // Check if this is an admin token
      const isAdminToken = decoded.role === 'admin';

      if (isAdminToken) {
        // Admin is authenticated, no need to fetch profile
        set(state => {
          state.authSlice.user = { 
            uid: decoded.sub,
            role: 'admin', 
            username: 'Administrator' 
          };
          state.authSlice.authenticated = true;
          state.authSlice.initialized = true;
        });
        return;
      }

      // Token is valid, fetch regular user profile
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set(state => {
        state.authSlice.user = response.data;
        state.authSlice.authenticated = true;
        state.authSlice.initialized = true;
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      localStorage.removeItem('token');
      set(state => {
        state.authSlice.token = null;
        state.authSlice.user = null;
        state.authSlice.authenticated = false;
        state.authSlice.initialized = true;
      });
    }
  },

  // Get current user role
  getUserRole: () => {
    const { user } = get().authSlice;
    return user?.role || null;
  },

  // Check if user has a specific role
  hasRole: (role) => {
    const { user } = get().authSlice;
    return user?.role === role;
  },

  // Check if user is an admin
  isAdmin: () => {
    const { user } = get().authSlice;
    return user?.role === 'admin';
  },

  // Check if user is a moderator
  isModerator: () => {
    const { user } = get().authSlice;
    return user?.role === 'moderator';
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set(state => {
        state.authSlice.token = token;
        state.authSlice.user = user;
        state.authSlice.authenticated = true;
      });
      
      // Check if the user is an admin and include this information in the response
      const isUserAdmin = user.role === 'admin';
      
      return { success: true, isAdmin: isUserAdmin };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set(state => {
        state.authSlice.token = token;
        state.authSlice.user = user;
        state.authSlice.authenticated = true;
      });
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    set(state => {
      state.authSlice.token = null;
      state.authSlice.user = null;
      state.authSlice.authenticated = false;
    });
  },

  // Generate key pair for secure messaging
  generateKeyPair: async () => {
    try {
      const token = get().authSlice.token;
      const response = await axios.post(`${API_URL}/auth/generateKeyPair`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => {
        state.authSlice.user = {
          ...state.authSlice.user,
          hasKeyPair: true
        };
      });
      
      return { success: true, keyPair: response.data };
    } catch (error) {
      console.error('Error generating key pair:', error);
      const message = error.response?.data?.error || 'Failed to generate key pair';
      toast.error(message);
      return { success: false, message };
    }
  }
});

export default authSlice; 
import axios from "axios";
import { api } from "../api/axios";
import jwtDecode from "jwt-decode";
import { toast } from "react-toastify";
import { generateKeyPair as generateCryptoKeyPair } from "../utils/crypto";

const API_URL = import.meta.env.VITE_API_URL;

const authSlice = (set, get) => ({
  token: localStorage.getItem("token"),
  user: null,
  initialized: false,
  authenticated: false,
  colorMode: localStorage.getItem("colorMode") || "light",
  authLoading: false,
  authError: null,

  // Set color mode
  setColorMode: (mode) => {
    localStorage.setItem("colorMode", mode);
    set((state) => {
      state.authSlice.colorMode = mode;
    });
  },

  // Initialize user from token
  loadUserProfile: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set((state) => {
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
        localStorage.removeItem("token");
        set((state) => {
          state.authSlice.token = null;
          state.authSlice.user = null;
          state.authSlice.authenticated = false;
          state.authSlice.initialized = true;
        });
        return;
      }

      // Check if this is an admin token
      const isAdminToken = decoded.role === "admin";

      if (isAdminToken) {
        // Admin is authenticated, no need to fetch profile
        set((state) => {
          state.authSlice.user = {
            uid: decoded.sub,
            role: "admin",
            username: "Administrator",
          };
          state.authSlice.authenticated = true;
          state.authSlice.initialized = true;
        });
        return;
      }

      // Token is valid, fetch regular user profile
      const response = await api.get(`/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => {
        state.authSlice.user = response.data;
        state.authSlice.authenticated = true;
        state.authSlice.initialized = true;
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      localStorage.removeItem("token");
      set((state) => {
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
    return user?.role === "admin";
  },

  // Check if user is a moderator
  isModerator: () => {
    const { user } = get().authSlice;
    return user?.role === "moderator";
  },

  // Login user
  login: async ({ email, password, verificationCode }) => {
    set((state) => {
      state.authSlice.authLoading = true;
      state.authSlice.authError = null;
    });

    try {
      const response = await api.post('/auth/login', { email, password, verificationCode });
      console.log('Login response:', response.data);
      
      // If verification is required, return without setting auth state
      if (response.data.requiresVerification) {
        set((state) => {
          state.authSlice.authLoading = false;
        });
        return { 
          success: true, 
          requiresVerification: true, 
          message: response.data.message 
        };
      }

      // Only set auth state if verification is complete and login successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        set((state) => {
          state.authSlice.token = response.data.token;
          state.authSlice.user = response.data.user;
          state.authSlice.authenticated = true;
          state.authSlice.authLoading = false;
          // Reset any error state
          state.authSlice.authError = null;
        });
        
        return { success: true };
      }
      
      set((state) => {
        state.authSlice.authLoading = false;
        state.authSlice.authError = 'Authentication failed';
      });
      
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      // Handle rate limiting errors
      if (error.response?.status === 429) {
        const timeRemaining = error.response?.data?.timeRemaining;
        const waitMessage = error.response?.data?.message || 'Please wait before requesting another code';
        
        set((state) => {
          state.authSlice.authLoading = false;
          state.authSlice.authError = waitMessage;
        });
        
        return { 
          success: false, 
          error: waitMessage,
          timeRemaining,
          requiresVerification: true
        };
      }
      
      set((state) => {
        state.authSlice.authLoading = false;
        state.authSlice.authError = errorMessage;
      });
      
      return { success: false, error: errorMessage };
    }
  },

  // Register new user
  register: async ({ email, password, name, role, verificationCode }) => {
    set((state) => {
      state.authSlice.authLoading = true;
      state.authSlice.authError = null;
    });

    try {
      const response = await api.post('/auth/register', { email, password, name, role, verificationCode });
      console.log('Register response:', response.data);
      
      // If verification is required, return without setting auth state
      if (response.data.requiresVerification) {
        set((state) => {
          state.authSlice.authLoading = false;
        });
        return { 
          success: true, 
          requiresVerification: true, 
          message: response.data.message 
        };
      }

      // Only set auth state if verification is complete and registration successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        set((state) => {
          state.authSlice.token = response.data.token;
          state.authSlice.user = response.data.user;
          state.authSlice.authenticated = true;
          state.authSlice.authLoading = false;
          // Reset any error state
          state.authSlice.authError = null;
        });
        
        return { success: true };
      }
      
      set((state) => {
        state.authSlice.authLoading = false;
        state.authSlice.authError = 'Registration failed';
      });
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      
      // Handle rate limiting errors
      if (error.response?.status === 429) {
        const timeRemaining = error.response?.data?.timeRemaining;
        const waitMessage = error.response?.data?.message || 'Please wait before requesting another code';
        
        set((state) => {
          state.authSlice.authLoading = false;
          state.authSlice.authError = waitMessage;
        });
        
        return { 
          success: false, 
          error: waitMessage,
          timeRemaining,
          requiresVerification: true
        };
      }
      
      set((state) => {
        state.authSlice.authLoading = false;
        state.authSlice.authError = errorMessage;
      });
      
      return { success: false, error: errorMessage };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("token");
    set((state) => {
      state.authSlice.token = null;
      state.authSlice.user = null;
      state.authSlice.authenticated = false;
    });
  },

  // Generate key pair for secure messaging
  generateKeyPair: async () => {
    try {
      // Generate key pair using Web Crypto API
      const { publicKey } = await generateCryptoKeyPair();

      // Send public key to server
      const token = get().authSlice.token;
      const response = await axios.post(
        `${API_URL}/auth/generateKeyPair`,
        { publicKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      set((state) => {
        state.authSlice.user = {
          ...state.authSlice.user,
          hasKeyPair: true,
        };
      });

      toast.success("Key pair generated successfully");
      return { success: true, keyPair: response.data };
    } catch (error) {
      console.error("Error generating key pair:", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        "Failed to generate key pair";
      return { success: false, message };
    }
  },
});

export default authSlice;

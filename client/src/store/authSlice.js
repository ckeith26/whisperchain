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
  login: async (credentials) => {
    try {
      const response = await api.post(`/auth/login`, credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);

      set((state) => {
        state.authSlice.token = token;
        state.authSlice.user = user;
        state.authSlice.authenticated = true;
      });

      // Check if the user is an admin and include this information in the response
      const isUserAdmin = user.role === "admin";

      return { success: true, isAdmin: isUserAdmin };
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.error || "Login failed. Please try again.";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post(`/auth/register`, userData);
      const { token, user } = response.data;

      localStorage.setItem("token", token);

      set((state) => {
        state.authSlice.token = token;
        state.authSlice.user = user;
        state.authSlice.authenticated = true;
      });

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.error || "Registration failed. Please try again.";
      toast.error(message);
      return { success: false, message };
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

import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../store';

// Get the API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 55000, // 60 seconds timeout
});

// Flag to prevent multiple logout calls
let isLoggingOut = false;

// Setup response interceptor for connection error handling
const setupInterceptors = () => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Network errors, ECONNREFUSED, or timeout errors indicate API is unreachable
      const isConnectionError = 
        !error.response || 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK' ||
        (error.message && (
          error.message.includes('Network Error') || 
          error.message.includes('timeout') ||
          error.message.includes('Connection refused')
        ));

      if (isConnectionError && !isLoggingOut) {
        isLoggingOut = true;
        
        // Get the logout function from the store
        const { logout } = useStore.getState().authSlice;
        
        // Only log out if we're authenticated (avoid unnecessary logouts)
        const { authenticated } = useStore.getState().authSlice;
        if (authenticated) {
          toast.error('Connection to server lost. You have been signed out.');
          logout();
        } else {
          toast.error('Unable to connect to the server. Please try again later.');
        }
        
        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      }
      
      return Promise.reject(error);
    }
  );
};

export { api, setupInterceptors }; 
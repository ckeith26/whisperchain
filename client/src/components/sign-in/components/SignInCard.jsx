import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  TextField,
  Button,
  Link,
  Typography,
  Paper,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store';

export default function SignInCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiWarmupTime, setApiWarmupTime] = useState(0);
  const login = useStore((state) => state.authSlice.login);

  // Reset timer when component unmounts
  useEffect(() => {
    let timer;
    if (loading) {
      setApiWarmupTime(0);
      timer = setInterval(() => {
        setApiWarmupTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setApiWarmupTime(0);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });
      if (result.success) {
        if (result.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/messages');
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        minWidth: { xs: '100%', sm: '400px' },
        maxWidth: '500px',
        position: 'relative',
      }}
    >
      <Typography component="h1" variant="h4" color="primary" align="center" gutterBottom>
        Sign In
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Enter your credentials to access WhisperChain+
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link 
              onClick={() => navigate('/signup')} 
              variant="body2"
              sx={{ cursor: 'pointer' }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
      
      {/* Enhanced loading indicator with API warmup message */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          position: 'absolute',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 'inherit'
        }}
        open={loading}
      >
        <CircularProgress color="inherit" size={60} />
        <Box sx={{ mt: 3, textAlign: 'center', px: 3 }}>
          <Typography variant="h6" gutterBottom>
            Signing In...
          </Typography>
          {apiWarmupTime > 3 && (
            <Typography variant="body2">
              Please wait while the API is warming up ({apiWarmupTime}s)
            </Typography>
          )}
          {apiWarmupTime > 10 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              The API may take up to 30 seconds to start after inactivity
            </Typography>
          )}
        </Box>
      </Backdrop>
    </Paper>
  );
}
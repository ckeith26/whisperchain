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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Backdrop,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store';

export default function SignUpCard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredRole: 'recipient', // Default role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiWarmupTime, setApiWarmupTime] = useState(0);
  const register = useStore((state) => state.authSlice.register);

  // Timer for API warmup notification
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiWarmupTime(0);

    try {
      const { confirmPassword, preferredRole, ...registrationData } = formData;
      // Map the form fields to what the backend expects
      const userData = {
        name: formData.username, // Map username to name
        email: formData.email,
        password: formData.password,
        role: formData.preferredRole // Map preferredRole to role
      };
      
      const result = await register(userData);
      if (result.success) {
        navigate('/messages');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
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
        minWidth: { xs: '100%', sm: '450px' },
        maxWidth: '550px',
        position: 'relative',
      }}
    >
      <Typography component="h1" variant="h4" color="primary" align="center" gutterBottom>
        Create Account
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Join WhisperChain+ for secure, anonymous messaging
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="preferred-role-label">Preferred Role</InputLabel>
              <Select
                labelId="preferred-role-label"
                id="preferredRole"
                name="preferredRole"
                value={formData.preferredRole}
                label="Preferred Role"
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="sender">Sender</MenuItem>
                <MenuItem value="recipient">Recipient</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link 
              onClick={() => navigate('/signin')} 
              variant="body2"
              sx={{ cursor: 'pointer' }}
            >
              Sign In
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
            Creating Your Account...
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
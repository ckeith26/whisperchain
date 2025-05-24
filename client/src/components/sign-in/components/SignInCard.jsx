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
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../../store';
import { toast } from 'react-toastify';

export default function SignInCard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [apiWarmupTime, setApiWarmupTime] = useState(0);
  const login = useStore((state) => state.authSlice.login);

  // Timer for API warmup notification
  useEffect(() => {
    let timer;
    if (loading) {
      setApiWarmupTime(0);
      timer = setInterval(() => {
        setApiWarmupTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [loading]);

  // Debug - print state changes
  useEffect(() => {
    console.log("Verification sent state:", verificationSent);
  }, [verificationSent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For verification code, only allow numbers and limit to 6 digits
    if (name === 'verificationCode') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= 6) {
        setFormData((prev) => ({
          ...prev,
          [name]: numbersOnly,
        }));
      }
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("=== SIGN IN SUBMIT ===");
    console.log("Current state:", { 
      verificationSent, 
      email: formData.email, 
      password: formData.password ? "[PRESENT]" : "[MISSING]",
      verificationCode: formData.verificationCode
    });
    
    // First validation - check if we need initial fields or verification code
    if (!verificationSent && (!formData.email || !formData.password)) {
      setError('Email and password are required');
      return;
    }
    
    // Second validation - if verification was sent, check if code is provided
    if (verificationSent && formData.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await login({
        email: formData.email,
        password: formData.password,
        verificationCode: verificationSent ? formData.verificationCode : undefined,
      });

      console.log('Login result:', result);

      if (result.requiresVerification) {
        console.log("Setting verification sent to TRUE");
        setVerificationSent(true);
        
        // IMPORTANT: Keep the action=signin in the URL to prevent the modal from closing
        if (searchParams.get('action') !== 'signin') {
          setSearchParams({ action: 'signin' });
        }
        
        toast.success('Verification code sent to your email');
        setLoading(false);
        return;
      }

      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.error || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Debug render states
  console.log("Rendering SignInCard with verification state:", verificationSent);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
      }}
    >
      <Typography component="h1" variant="h5" gutterBottom>
        {verificationSent ? 'Enter Verification Code' : 'Sign In'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        {!verificationSent ? (
          // Initial state - email/password form
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
          </>
        ) : (
          // Verification state - code input
          <>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              A verification code has been sent to {formData.email}
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleChange}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
              helperText="Enter the 6-digit code sent to your email"
              autoFocus
            />
          </>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || (verificationSent && formData.verificationCode.length !== 6)}
        >
          {loading ? <CircularProgress size={24} /> : verificationSent ? 'Verify & Sign In' : 'Sign In'}
        </Button>

        <Box textAlign="center">
          <Link href="/sign-up" variant="body2">
            Don't have an account? Sign up
          </Link>
        </Box>
      </Box>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && apiWarmupTime > 5}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            API is warming up... Please wait ({apiWarmupTime}s)
          </Typography>
        </Box>
      </Backdrop>
    </Paper>
  );
}
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useStore from "../../../store";
import { toast } from "react-toastify";

export default function SignUpCard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredRole: "recipient",
    verificationCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [apiWarmupTime, setApiWarmupTime] = useState(0);
  const register = useStore((state) => state.authSlice.register);

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
    console.log("SignUpCard - Verification sent state:", verificationSent);
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

  const validateForm = () => {
    if (!verificationSent) {
      if (
        !formData.username ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("All fields are required");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return false;
      }
    } else {
      // When verification code is required
      if (formData.verificationCode.length !== 6) {
        setError("Please enter the 6-digit verification code");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      // Send registration request with verification code if present
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.username,
        role: formData.preferredRole,
        verificationCode: verificationSent ? formData.verificationCode : undefined,
      });

      console.log('Registration result:', result);

      if (result.requiresVerification) {
        console.log("SignUpCard - Setting verification sent to TRUE");
        setVerificationSent(true);
        toast.success('Verification code sent to your email');
        setLoading(false);
        return;
      }

      if (result.success) {
        navigate("/chat");
      } else {
        setError(result.error || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  // Debug render states
  console.log("Rendering SignUpCard with verification state:", verificationSent);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: 400,
        mx: "auto",
        mt: 4,
      }}
    >
      <Typography component="h1" variant="h5" gutterBottom>
        {verificationSent ? "Enter Verification Code" : "Sign Up"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        {!verificationSent ? (
          // Initial state - registration form
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
            />
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Preferred Role</InputLabel>
              <Select
                name="preferredRole"
                value={formData.preferredRole}
                onChange={handleChange}
                label="Preferred Role"
              >
                <MenuItem value="recipient">Recipient</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </>
        ) : (
          // Verification state - code input
          <>
            <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
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
          {loading ? (
            <CircularProgress size={24} />
          ) : verificationSent ? (
            'Verify & Sign Up'
          ) : (
            'Sign Up'
          )}
        </Button>

        <Grid container justifyContent="flex-end">
          <Grid item>
            <Link href="/sign-in" variant="body2">
              Already have an account? Sign in
            </Link>
          </Grid>
        </Grid>
      </Box>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && apiWarmupTime > 5}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            API is warming up... Please wait ({apiWarmupTime}s)
          </Typography>
        </Box>
      </Backdrop>
    </Paper>
  );
}

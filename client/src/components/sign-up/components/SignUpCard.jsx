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
    preferredRole: "recipient", // Default role
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiWarmupTime(0);

    try {
      const { confirmPassword, preferredRole, ...registrationData } = formData;
      // Map the form fields to what the backend expects
      const userData = {
        name: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.preferredRole,
      };

      const result = await register(userData);
      if (result.success) {
        navigate("/messages");
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        minWidth: { xs: "100%", sm: "450px" },
        maxWidth: "550px",
        position: "relative",
      }}
    >
      <Typography
        component="h1"
        variant="h4"
        color="primary"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Create Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="username"
              label="Username"
              fullWidth
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              type="email"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="password"
              label="Password"
              fullWidth
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              type="password"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="confirmPassword"
              label="Confirm Password"
              fullWidth
              value={formData.confirmPassword}
              onChange={handleChange}
              variant="outlined"
              type="password"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">I want to...</InputLabel>
              <Select
                labelId="role-select-label"
                name="preferredRole"
                value={formData.preferredRole}
                onChange={handleChange}
                label="I want to..."
              >
                <MenuItem value="recipient">Receive Messages</MenuItem>
                <MenuItem value="moderator">Help Moderate Content</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>

        <Box textAlign="center">
          <Link href="/login" variant="body2">
            Already have an account? Sign in
          </Link>
        </Box>
      </form>

      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
        }}
        open={loading && apiWarmupTime >= 3}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
          Our API might be warming up...
          <br />
          This could take up to 30 seconds.
        </Typography>
      </Backdrop>
    </Paper>
  );
}

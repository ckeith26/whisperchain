import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Paper, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  backgroundColor: 'rgba(13, 37, 56, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const AdminLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const adminLogin = useStore(state => state.authSlice.adminLogin);
  const authenticated = useStore(state => state.authSlice.authenticated);
  const isAdmin = useStore(state => state.authSlice.isAdmin);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Redirect if already authenticated as admin
  React.useEffect(() => {
    if (authenticated && isAdmin()) {
      navigate('/admin');
    }
  }, [authenticated, isAdmin, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await adminLogin({ username, password });
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <StyledPaper>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 4
        }}>
          <SecurityIcon sx={{ fontSize: 48, color: '#ffffff', mb: 2 }} />
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              letterSpacing: '0.5px',
              mb: 1
            }}
          >
            WhisperChain+
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AdminPanelSettingsIcon /> Admin Login
          </Typography>
        </Box>
        
        <Box 
          component="form"
          onSubmit={handleSubmit}
          sx={{ 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3
          }}
        >
          {error && (
            <Typography 
              color="error" 
              sx={{ 
                bgcolor: 'rgba(211, 47, 47, 0.1)', 
                p: 2, 
                borderRadius: 1,
                textAlign: 'center'
              }}
            >
              {error}
            </Typography>
          )}
          
          <TextField
            label="Admin Username"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            InputProps={{
              sx: { color: '#ffffff' }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              }
            }}
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              sx: { color: '#ffffff' }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              }
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 1, mb: 2, py: 1.5, borderRadius: '8px' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          
          <Button
            variant="text"
            onClick={() => navigate('/')}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: '#ffffff',
                bgcolor: 'transparent'
              }
            }}
          >
            Return to Homepage
          </Button>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default AdminLogin; 
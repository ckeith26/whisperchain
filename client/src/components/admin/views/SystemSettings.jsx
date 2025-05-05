import React, { useState, useEffect } from 'react';
import { 
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CachedIcon from '@mui/icons-material/Cached';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../../../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    minMessageLength: 20,
    maxMessageLength: 500,
    roundDuration: 7, // days
    autoPublishRounds: true,
    requireEmailVerification: true,
    autoApproveRegistrations: false
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rotationInProgress, setRotationInProgress] = useState(false);
  const { token } = useStore(state => state.authSlice);

  useEffect(() => {
    fetchSystemSettings();
  }, [token]);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      // Using mock data for now
      setTimeout(() => {
        setSettings({
          minMessageLength: 20,
          maxMessageLength: 500,
          roundDuration: 7,
          autoPublishRounds: true,
          requireEmailVerification: true,
          autoApproveRegistrations: false
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching system settings:', err);
      toast.error('Could not load system settings');
      setLoading(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would save to the API
      /*
      await axios.post(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      
      setTimeout(() => {
        toast.success('System settings updated successfully');
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save system settings');
      setLoading(false);
    }
  };

  const openConfirmationDialog = (action) => {
    setConfirmAction(action);
    setIsDialogOpen(true);
  };

  const closeConfirmationDialog = () => {
    setIsDialogOpen(false);
    setConfirmAction(null);
  };

  const rotateKeys = async () => {
    try {
      setRotationInProgress(true);
      // In a real implementation, this would call an API endpoint
      /*
      await axios.post(`${API_URL}/admin/rotateKeys`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('System keys rotated successfully');
      closeConfirmationDialog();
    } catch (err) {
      console.error('Error rotating keys:', err);
      toast.error('Failed to rotate system keys');
    } finally {
      setRotationInProgress(false);
    }
  };

  const rotatePolicy = async () => {
    try {
      setRotationInProgress(true);
      // In a real implementation, this would call an API endpoint
      /*
      await axios.post(`${API_URL}/admin/rotatePolicy`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('System policy rotated successfully');
      closeConfirmationDialog();
    } catch (err) {
      console.error('Error rotating policy:', err);
      toast.error('Failed to rotate system policy');
    } finally {
      setRotationInProgress(false);
    }
  };

  const getConfirmationDialogContent = () => {
    switch (confirmAction) {
      case 'rotateKeys':
        return {
          title: 'Rotate Encryption Keys',
          message: 'This will generate new encryption keys for the system. All users will need to re-register their public keys. Are you sure you want to continue?',
          action: rotateKeys
        };
      case 'rotatePolicy':
        return {
          title: 'Rotate System Policy',
          message: 'This will update the system policy and may affect message delivery and round processing. Are you sure you want to continue?',
          action: rotatePolicy
        };
      default:
        return { title: '', message: '', action: () => {} };
    }
  };

  return (
    <>
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'rgba(22, 28, 36, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          System Settings
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Important</AlertTitle>
              Changes to these settings may affect system security and performance. Proceed with caution.
            </Alert>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Message Configuration
              </Typography>
              
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  label="Minimum Message Length"
                  name="minMessageLength"
                  type="number"
                  value={settings.minMessageLength}
                  onChange={handleSettingChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  helperText="Minimum number of characters for messages"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255,255,255,0.5)',
                    },
                  }}
                />
                
                <TextField
                  label="Maximum Message Length"
                  name="maxMessageLength"
                  type="number"
                  value={settings.maxMessageLength}
                  onChange={handleSettingChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 100, max: 2000 } }}
                  helperText="Maximum number of characters for messages"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255,255,255,0.5)',
                    },
                  }}
                />
              </Stack>
            </Box>
            
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Round Configuration
              </Typography>
              
              <Stack spacing={3} sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Round Duration</InputLabel>
                  <Select
                    name="roundDuration"
                    value={settings.roundDuration}
                    onChange={handleSettingChange}
                    label="Round Duration"
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    <MenuItem value={1}>1 day</MenuItem>
                    <MenuItem value={3}>3 days</MenuItem>
                    <MenuItem value={7}>1 week</MenuItem>
                    <MenuItem value={14}>2 weeks</MenuItem>
                    <MenuItem value={30}>1 month</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.autoPublishRounds}
                      onChange={handleSettingChange}
                      name="autoPublishRounds"
                      color="primary"
                    />
                  }
                  label="Auto-publish completed rounds"
                  sx={{ color: 'white' }}
                />
              </Stack>
            </Box>
            
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Registration Settings
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.requireEmailVerification}
                      onChange={handleSettingChange}
                      name="requireEmailVerification"
                      color="primary"
                    />
                  }
                  label="Require email verification"
                  sx={{ color: 'white' }}
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.autoApproveRegistrations}
                      onChange={handleSettingChange}
                      name="autoApproveRegistrations"
                      color="primary"
                    />
                  }
                  label="Auto-approve new registrations"
                  sx={{ color: 'white' }}
                />
              </Stack>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={saveSettings}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
      
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'rgba(22, 28, 36, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          System Security
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Security Warning</AlertTitle>
          The following actions affect system security. Use with caution and only when necessary.
        </Alert>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<VpnKeyIcon />}
            onClick={() => openConfirmationDialog('rotateKeys')}
            sx={{ px: 3, py: 1 }}
          >
            Rotate Encryption Keys
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            startIcon={<SecurityIcon />}
            onClick={() => openConfirmationDialog('rotatePolicy')}
            sx={{ px: 3, py: 1 }}
          >
            Rotate System Policy
          </Button>
        </Stack>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={closeConfirmationDialog}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(22, 28, 36, 0.95)',
            color: 'white',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          {getConfirmationDialogContent().title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="white">
            {getConfirmationDialogContent().message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeConfirmationDialog} 
            color="inherit"
            variant="outlined"
            disabled={rotationInProgress}
          >
            Cancel
          </Button>
          <Button 
            onClick={getConfirmationDialogContent().action} 
            color="error"
            variant="contained"
            disabled={rotationInProgress}
            startIcon={rotationInProgress ? <CircularProgress size={20} color="inherit" /> : <CachedIcon />}
          >
            {rotationInProgress ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SystemSettings; 
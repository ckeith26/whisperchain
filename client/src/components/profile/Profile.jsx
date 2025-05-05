import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Avatar, 
  Button, 
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  CircularProgress
} from '@mui/material';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AppAppBar from '../shared-components/AppAppBar/AppAppBar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, generateKeyPair } = useStore(state => state.authSlice);
  const [generating, setGenerating] = React.useState(false);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGenerateKeyPair = async () => {
    setGenerating(true);
    try {
      await generateKeyPair();
    } catch (error) {
      console.error('Error generating key pair:', error);
    } finally {
      setGenerating(false);
    }
  };

  // First letter of username for avatar
  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <AppAppBar />
      <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" mb={4}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                mr: { xs: 0, sm: 4 },
                mb: { xs: 2, sm: 0 }
              }}
            >
              {avatarLetter}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {user.username}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email}
              </Typography>
              <Box mt={1}>
                <Chip 
                  label={user.role ? user.role.toUpperCase() : 'USER'} 
                  color="primary" 
                  size="small"
                />
                {user.hasKeyPair && (
                  <Chip 
                    icon={<KeyIcon />} 
                    label="Key Pair Created" 
                    color="success" 
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Username" 
                    secondary={user.username} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Email" 
                    secondary={user.email} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Role" 
                    secondary={user.role ? user.role.toUpperCase() : 'USER'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Key Pair Status" 
                    secondary={user.hasKeyPair ? 'Generated' : 'Not Generated'} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Account Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                {!user.hasKeyPair && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<KeyIcon />}
                    onClick={handleGenerateKeyPair}
                    disabled={generating}
                  >
                    {generating ? 'Generating...' : 'Generate Key Pair'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/messages')}
                >
                  Go to Messages
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default Profile; 
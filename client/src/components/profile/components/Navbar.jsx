import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MessageIcon from '@mui/icons-material/Message';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import useStore from '../../../store';

const Navbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useStore(state => state.authSlice);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/');
  };

  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <AppBar position="fixed" sx={{ bgcolor: theme.palette.primary.main }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          WhisperChain+
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Button 
            color="inherit" 
            startIcon={<HomeIcon />} 
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            startIcon={<MessageIcon />} 
            onClick={() => navigate('/messages')}
          >
            Messages
          </Button>
          <Button 
            color="inherit" 
            startIcon={<AccountCircleIcon />} 
            onClick={() => navigate('/profile')}
          >
            Profile
          </Button>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton 
            color="inherit" 
            onClick={handleMenuOpen}
            size="small"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {avatarLetter}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/'); }}>
              <HomeIcon fontSize="small" sx={{ mr: 1 }} /> Home
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/messages'); }}>
              <MessageIcon fontSize="small" sx={{ mr: 1 }} /> Messages
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 
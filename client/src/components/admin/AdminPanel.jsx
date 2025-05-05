import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import SecurityIcon from '@mui/icons-material/Security';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import UserManagement from './views/UserManagement';
import SystemSettings from './views/SystemSettings';

const drawerWidth = 240;

const AdminPanel = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { authenticated, isAdmin, user, logout } = useStore(state => state.authSlice);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authenticated || !isAdmin()) {
      navigate('/admin/login');
    }
  }, [authenticated, isAdmin, navigate]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangeView = (view) => {
    setActiveView(view);
    setMobileOpen(false);
  };
  
  const drawer = (
    <Box sx={{ bgcolor: 'rgba(13, 37, 56, 0.95)', height: '100%', color: 'white' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon fontSize="large" />
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          Admin Panel
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List>
        <ListItem 
          button 
          selected={activeView === 'dashboard'} 
          onClick={() => handleChangeView('dashboard')}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem 
          button 
          selected={activeView === 'users'} 
          onClick={() => handleChangeView('users')}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </ListItem>
        <ListItem 
          button 
          selected={activeView === 'messages'} 
          onClick={() => handleChangeView('messages')}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <MessageIcon />
          </ListItemIcon>
          <ListItemText primary="Messages" />
        </ListItem>
        <ListItem 
          button 
          selected={activeView === 'settings'} 
          onClick={() => handleChangeView('settings')}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 'auto' }} />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon sx={{ color: 'white' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );
  
  if (!authenticated || !isAdmin()) {
    return null; // Will redirect via useEffect
  }

  // Render the appropriate view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'messages':
        return (
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'rgba(22, 28, 36, 0.9)', 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Typography variant="h5" gutterBottom>
              Message Management
            </Typography>
            <Typography variant="body1">
              This feature will allow monitoring and managing message rounds.
            </Typography>
          </Paper>
        );
      case 'dashboard':
      default:
        return (
          <Paper sx={{ 
            p: 3, 
            bgcolor: 'rgba(22, 28, 36, 0.9)', 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to the WhisperChain+ Admin Panel. Here you can manage users, view messages, and configure system settings.
            </Typography>
            
            <Box sx={{ 
              mt: 4, 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}>
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.2)',
              }}>
                <Typography variant="h6" gutterBottom>
                  Users
                </Typography>
                <Typography variant="h4">0</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total registered users
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(76, 175, 80, 0.2)',
              }}>
                <Typography variant="h6" gutterBottom>
                  Messages
                </Typography>
                <Typography variant="h4">0</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total secure messages
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(211, 47, 47, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.2)',
              }}>
                <Typography variant="h6" gutterBottom>
                  Flagged Content
                </Typography>
                <Typography variant="h4">0</Typography>
                <Typography variant="body2" color="textSecondary">
                  Messages requiring review
                </Typography>
              </Paper>
            </Box>
          </Paper>
        );
    }
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(13, 37, 56, 0.95)',
          boxShadow: 2,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            WhisperChain+ Administration
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name || user?.email || ''}</Typography>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {(user?.name || user?.email || '?')?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'rgba(13, 37, 56, 0.95)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'rgba(13, 37, 56, 0.95)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          color: 'white',
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          {renderView()}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminPanel; 
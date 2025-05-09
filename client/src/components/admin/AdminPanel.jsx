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
  useTheme,
  CircularProgress
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
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';
const drawerWidth = 240;

const AdminPanel = ({ view }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { authenticated, isAdmin, isModerator, user, logout } = useStore(state => state.authSlice);
  const { token } = useStore(state => state.authSlice);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({
    userCount: 0,
    moderatorCount: 0,
    suspendedUserCount: 0,
    moderatorRequestCount: 0,
    messageCount: 0,
    flaggedCount: 0,
    loading: true
  });
  
  // Set initial view based on prop or user role
  useEffect(() => {
    if (view && ['dashboard', 'users', 'settings', 'messages'].includes(view)) {
      setActiveView(view);
    } else if (authenticated && isModerator() && !isAdmin()) {
      setActiveView('messages');
    }
  }, [authenticated, isAdmin, isModerator, view]);
  
  // Redirect if not authenticated or not admin/moderator
  useEffect(() => {
    if (!authenticated || (!isAdmin() && !isModerator())) {
      navigate('/');
    }
  }, [authenticated, isAdmin, isModerator, navigate]);

  // Fetch dashboard statistics
  useEffect(() => {
    if (authenticated && isAdmin() && activeView === 'dashboard') {
      fetchDashboardStats();
    }
  }, [authenticated, isAdmin, activeView, token]);

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        userCount: response.data.userCount || 0,
        moderatorCount: response.data.moderatorCount || 0,
        suspendedUserCount: response.data.suspendedUserCount || 0,
        moderatorRequestCount: response.data.moderatorRequestCount || 0,
        messageCount: response.data.messageCount || 0,
        flaggedCount: response.data.flaggedCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };
  
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
    
    // Navigate to the corresponding URL
    navigate(`/admin/${view === 'dashboard' ? '' : view}`);
  };
  
  const drawer = (
    <Box sx={{ bgcolor: 'rgba(13, 37, 56, 0.95)', height: '100%', color: 'white' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon fontSize="large" />
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          {isAdmin() ? "Admin Panel" : "Moderator Panel"}
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List>
        {isAdmin() && (
          <>
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
              selected={activeView === 'settings'} 
              onClick={() => handleChangeView('settings')}
              sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </>
        )}
        {isModerator() && (
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
        )}
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
  
  if (!authenticated || (!isAdmin() && !isModerator())) {
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
            <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
              Message Management
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              This feature will allow monitoring.
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
            <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
              Dashboard
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: 'white' }}>
              Welcome to the WhisperChain+ Admin Panel. Here you can manage users, view messages, and configure system settings.
            </Typography>
            
            <Box sx={{ 
              mt: 4, 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              mb: 3
            }}>
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Regular Users
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.userCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Active regular users
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(233, 30, 99, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(233, 30, 99, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Moderators
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.moderatorCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Platform moderators
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Moderator Requests
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.moderatorRequestCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Pending moderator requests
                </Typography>
              </Paper>
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}>
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(76, 175, 80, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Messages
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.messageCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Total secure messages
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(211, 47, 47, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Flagged Content
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.flaggedCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Messages requiring review
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)',
                position: 'relative'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Suspended Users
                </Typography>
                {stats.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Typography variant="h4" sx={{ color: 'white' }}>{stats.suspendedUserCount}</Typography>
                )}
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Currently suspended accounts
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
            WhisperChain+ {isAdmin() ? "Administration" : "Moderation"}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name || user?.email || ''}</Typography>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user && (user.name?.charAt(0) || user.email?.charAt(0) || 'A').toUpperCase()}
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
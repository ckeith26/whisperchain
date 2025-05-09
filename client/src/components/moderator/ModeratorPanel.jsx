import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  useTheme,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';
import GavelIcon from '@mui/icons-material/Gavel';
import MenuIcon from '@mui/icons-material/Menu';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import FlaggedMessages from './views/FlaggedMessages';
import AuditLogs from './views/AuditLogs';

const drawerWidth = 240;

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderator-tabpanel-${index}`}
      aria-labelledby={`moderator-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ModeratorPanel = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { authenticated, isModerator, user, logout } = useStore(state => state.authSlice);
  const { flaggedMessageCount, fetchFlaggedMessageCount } = useStore(state => state.userSlice);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Redirect if not authenticated or not moderator
  useEffect(() => {
    if (!authenticated || (!isModerator() && user?.role !== 'ADMIN')) {
      navigate('/');
    }
  }, [authenticated, isModerator, navigate, user]);

  // Fetch flagged message count on load
  useEffect(() => {
    if (authenticated && (isModerator() || user.role === 'ADMIN')) {
      fetchFlaggedMessageCount();
      
      // Set up interval to check flagged messages periodically
      const interval = setInterval(() => {
        fetchFlaggedMessageCount();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [authenticated, isModerator, fetchFlaggedMessageCount, user]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const drawer = (
    <Box sx={{ bgcolor: 'rgba(13, 37, 56, 0.95)', height: '100%', color: 'white' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <GavelIcon fontSize="large" />
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          Moderator Panel
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List>
        <ListItem 
          button 
          selected={tabValue === 0} 
          onClick={() => setTabValue(0)}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Badge 
              badgeContent={flaggedMessageCount} 
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  right: -3,
                  top: 3,
                }
              }}
            >
              <FlagIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Flagged Messages
                {flaggedMessageCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                    }}
                  >
                    {flaggedMessageCount > 99 ? '99+' : flaggedMessageCount}
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
        <ListItem 
          button 
          selected={tabValue === 1} 
          onClick={() => setTabValue(1)}
          sx={{ '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="Audit Logs" />
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
  
  if (!authenticated || (!isModerator() && user?.role !== 'ADMIN')) {
    return null; // Will redirect via useEffect
  }
  
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
            WhisperChain+ Moderation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name || user?.email}</Typography>
            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
              {(user?.name || user?.email)?.charAt(0).toUpperCase() || 'M'}
            </Avatar>
          </Box>
        </Toolbar>
        <Box 
          sx={{ 
            bgcolor: 'rgba(13, 37, 56, 0.8)', 
            display: { xs: 'block', sm: 'none' } 
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab icon={
              <Badge 
                badgeContent={flaggedMessageCount} 
                color="error"
                max={99}
              >
                <FlagIcon />
              </Badge>
            } 
            label="Flagged" />
            <Tab icon={<HistoryIcon />} label="Audit Logs" />
          </Tabs>
        </Box>
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
          mt: { xs: tabValue === 0 ? 13 : 13, sm: 8 },
        }}
      >
        <Container maxWidth="lg">
          <TabPanel value={tabValue} index={0}>
            <FlaggedMessages />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AuditLogs />
          </TabPanel>
        </Container>
      </Box>
    </Box>
  );
};

export default ModeratorPanel; 
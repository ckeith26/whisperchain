import React, { useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Container,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Tooltip,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Badge
} from '@mui/material';
import useStore from '../../../store';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HomeIcon from '@mui/icons-material/Home';
import MessageIcon from '@mui/icons-material/Message';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(8px)',
  border: '1px solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  backgroundColor: alpha('#050e1a', 0.5),
  boxShadow: theme.shadows[3],
  padding: '8px 12px',
}));

const AppAppBar = ({
  openSignIn,
  setOpenSignIn,
  openSignUp,
  setOpenSignUp,
  openForgotPassword,
  setOpenForgotPassword,
  handleOpenSignIn,
  handleCloseSignIn,
  handleOpenSignUp,
  handleCloseSignUp,
  handleOpenForgotPassword,
  handleCloseForgotPassword,
  switchToSignIn,
  switchToSignUp,
  role,
  setRole,
  emailInput
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, user, login, register, logout } = useStore(state => state.authSlice);
  const { unreadMessageCount, flaggedMessageCount } = useStore(state => state.userSlice);
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  
  // Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState(emailInput || '');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState(role || 'user');
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create local state and handlers if props are not provided
  const [localOpenSignIn, setLocalOpenSignIn] = useState(false);
  const [localOpenSignUp, setLocalOpenSignUp] = useState(false);
  const [localOpenForgotPassword, setLocalOpenForgotPassword] = useState(false);
  const [localRole, setLocalRole] = useState('user');
  const [localEmail, setLocalEmail] = useState('');
  
  // Use provided props or local state/handlers
  const effectiveOpenSignIn = openSignIn !== undefined ? openSignIn : localOpenSignIn;
  const effectiveSetOpenSignIn = setOpenSignIn || setLocalOpenSignIn;
  
  const effectiveOpenSignUp = openSignUp !== undefined ? openSignUp : localOpenSignUp;
  const effectiveSetOpenSignUp = setOpenSignUp || setLocalOpenSignUp;
  
  const effectiveOpenForgotPassword = openForgotPassword !== undefined ? openForgotPassword : localOpenForgotPassword;
  const effectiveSetOpenForgotPassword = setOpenForgotPassword || setLocalOpenForgotPassword;
  
  const effectiveRole = role !== undefined ? role : registerRole;
  const effectiveSetRole = (newRole) => {
    if (setRole) setRole(newRole);
    setRegisterRole(newRole);
    if (setLocalRole) setLocalRole(newRole);
  };
  
  const effectiveEmail = emailInput || registerEmail;
  
  // Form handlers
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await login({ 
        email: loginEmail, 
        password: loginPassword 
      });
      
      if (response.success) {
        // Add a small delay before closing dialog to ensure state updates
        setTimeout(() => {
          effectiveHandleCloseSignIn();
          setLoginEmail('');
          setLoginPassword('');
          
          // Redirect to admin page if user is an admin
          if (response.isAdmin) {
            navigate('/admin');
          }
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await register({
        email: registerEmail,
        password: registerPassword,
        role: registerRole
      });
      
      if (response.success) {
        effectiveHandleCloseSignUp();
        setRegisterEmail('');
        setRegisterPassword('');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetPassword = (e) => {
    e.preventDefault();
    // This would typically call a password reset function from the store
    // For now, we'll just close the dialog
    console.log('Reset password for:', resetEmail);
    effectiveHandleCloseForgotPassword();
    setResetEmail('');
  };
  
  // Default handlers if not provided via props
  const defaultHandleOpenSignIn = () => {
    effectiveSetOpenSignUp(false);
    effectiveSetOpenForgotPassword(false);
    effectiveSetOpenSignIn(true);
    navigate('/signin', { replace: true });
  };
  
  const defaultHandleCloseSignIn = () => {
    effectiveSetOpenSignIn(false);
    navigate('/', { replace: true });
  };
  
  const defaultHandleOpenSignUp = () => {
    effectiveSetOpenSignIn(false);
    effectiveSetOpenForgotPassword(false);
    effectiveSetOpenSignUp(true);
    navigate('/signup', { replace: true });
  };
  
  const defaultHandleCloseSignUp = () => {
    effectiveSetOpenSignUp(false);
    navigate('/', { replace: true });
  };
  
  const defaultHandleOpenForgotPassword = () => {
    effectiveSetOpenSignIn(false);
    effectiveSetOpenSignUp(false);
    effectiveSetOpenForgotPassword(true);
    navigate('/reset-password', { replace: true });
  };
  
  const defaultHandleCloseForgotPassword = () => {
    effectiveSetOpenForgotPassword(false);
    navigate('/', { replace: true });
  };
  
  const defaultSwitchToSignUp = () => {
    effectiveSetOpenSignIn(false);
    effectiveSetOpenSignUp(true);
    navigate('/signup', { replace: true });
  };
  
  const defaultSwitchToSignIn = () => {
    effectiveSetOpenSignUp(false);
    effectiveSetOpenForgotPassword(false);
    effectiveSetOpenSignIn(true);
    navigate('/signin', { replace: true });
  };
  
  // Use provided handlers or defaults
  const effectiveHandleOpenSignIn = handleOpenSignIn || defaultHandleOpenSignIn;
  const effectiveHandleCloseSignIn = handleCloseSignIn || defaultHandleCloseSignIn;
  const effectiveHandleOpenSignUp = handleOpenSignUp || defaultHandleOpenSignUp;
  const effectiveHandleCloseSignUp = handleCloseSignUp || defaultHandleCloseSignUp;
  const effectiveHandleOpenForgotPassword = handleOpenForgotPassword || defaultHandleOpenForgotPassword;
  const effectiveHandleCloseForgotPassword = handleCloseForgotPassword || defaultHandleCloseForgotPassword;
  const effectiveSwitchToSignUp = switchToSignUp || defaultSwitchToSignUp;
  const effectiveSwitchToSignIn = switchToSignIn || defaultSwitchToSignIn;

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/');
  };

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const navigateTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'W');

  const tabs = [
    { 
      label: 'Messages', 
      path: '/messages/inbox', 
      icon: <MessageIcon fontSize="small" />, 
      requireAuth: true,
      badge: unreadMessageCount > 0 ? unreadMessageCount : null
    },
    { label: 'Profile', path: '/profile', icon: <AccountCircleIcon fontSize="small" />, requireAuth: true },
  ];

  const filteredTabs = tabs.filter(tab => {
    if (!authenticated) return tab.showUnauthenticated;
    if (tab.requiresAdmin && !isAdmin()) return false;
    if (tab.requiresUser && (isAdmin() || isModerator())) return false;
    return true;
  });

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
        zIndex: 20001,
        pointerEvents: 'none',
        '& *': {
          pointerEvents: 'auto',
        },
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          {/* Left side: Logo and desktop tabs */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <SecurityIcon 
              sx={{ 
                fontSize: 36, 
                color: '#ffffff',
                mr: 1,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                mr: 3,
                fontWeight: 800,
                color: '#ffffff',
                textDecoration: 'none',
                cursor: 'pointer',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '0.5px',
                textShadow: '0px 1px 2px rgba(0,0,0,0.1)'
              }}
              onClick={() => navigate('/')}
            >
              WhisperChain+
            </Typography>
            
            {/* Desktop navigation tabs */}
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              {filteredTabs.map((tab) => {
                // Special handling for Messages tab to highlight it on any messages route
                const isSelected = tab.path === '/messages/inbox' ? 
                  location.pathname.startsWith('/messages/') : 
                  location.pathname === tab.path;
                
                // Check if this is the moderator tab and we need to show a notification badge
                const showModeratorBadge = tab.path === '/moderator' && 
                  (isModerator() || isAdmin()) && 
                  flaggedMessageCount > 0;
                
                return (
                  <Button
                    key={tab.label}
                    onClick={() => navigate(tab.path)}
                    variant={isSelected ? 'contained' : 'text'}
                    color={isSelected ? 'primary' : 'inherit'}
                    size="small"
                    sx={{ 
                      mx: 0.5, 
                      whiteSpace: 'nowrap',
                      color: isSelected ? undefined : '#ffffff'
                    }}
                    startIcon={tab.badge !== null ? (
                      <Badge badgeContent={tab.badge} color="error" max={99}>
                        {tab.icon}
                      </Badge>
                    ) : showModeratorBadge ? (
                      <Badge 
                        badgeContent={flaggedMessageCount} 
                        color="error" 
                        max={99}
                      >
                        {tab.icon}
                      </Badge>
                    ) : (
                      tab.icon
                    )}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Right side: Auth buttons */}
          {!authenticated ? (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Button
                color="inherit"
                onClick={effectiveHandleOpenSignIn}
                variant="text"
                size="medium"
                sx={{ 
                  whiteSpace: 'nowrap', 
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Sign in
              </Button>
              <Button
                color="inherit"
                onClick={effectiveHandleOpenSignUp}
                variant="contained"
                size="medium"
                sx={{ 
                  whiteSpace: 'nowrap', 
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  color: '#0a192f',
                  fontSize: '0.95rem',
                  px: 2.5,
                  py: 1.2,
                  '&:hover': {
                    bgcolor: '#ffffff',
                  },
                  borderRadius: '12px',
                }}
              >
                Sign up
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Tooltip title="Account">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt={user?.username || 'User'} 
                    sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                  >
                    {avatarLetter}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ 
                  mt: '45px',
                  zIndex: 20002,
                  '& .MuiPaper-root': {
                    backgroundColor: 'rgba(13, 37, 56, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }
                }}
                id="menu-appbar-user"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                  <Typography color="#ffffff">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={() => { navigate('/messages/inbox'); handleCloseUserMenu(); }}>
                  <Typography color="#ffffff">Messages</Typography>
                </MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem onClick={() => { navigate('/admin'); handleCloseUserMenu(); }}>
                    <Typography color="#ffffff">Admin Panel</Typography>
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* Mobile menu button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, ml: 1 }}>
            <IconButton aria-label="menu" onClick={toggleDrawer(true)} sx={{ color: '#ffffff' }}>
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Mobile drawer */}
          <Drawer
            anchor="top"
            open={open}
            onClose={toggleDrawer(false)}
            PaperProps={{
              sx: {
                top: 'var(--template-frame-height, 0px)',
                bgcolor: '#050e1a',
                color: '#ffffff',
                zIndex: 20003,
              },
            }}
            sx={{
              zIndex: 20003,
            }}
          >
            <Box sx={{ p: 2, backgroundColor: '#050e1a' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={toggleDrawer(false)} sx={{ color: '#ffffff' }}>
                  <CloseRoundedIcon />
                </IconButton>
              </Box>

              <MenuItem
                onClick={() => navigateTo('/')}
                selected={location.pathname === '/'}
                sx={{ 
                  '&.Mui-selected': {
                    bgcolor: alpha('#ffffff', 0.1),
                  }
                }}
              >
                <Typography color="#ffffff">Home</Typography>
              </MenuItem>

              {filteredTabs.map((tab) => {
                // Special handling for Messages tab in mobile view
                const isSelected = tab.path === '/messages/inbox' ? 
                  location.pathname.startsWith('/messages/') : 
                  location.pathname === tab.path;
                
                // Check if this is the moderator tab and we need to show a notification badge
                const showModeratorBadge = tab.path === '/moderator' && 
                  (isModerator() || isAdmin()) && 
                  flaggedMessageCount > 0;
                
                return (
                  <MenuItem
                    key={tab.label}
                    onClick={() => navigateTo(tab.path)}
                    selected={isSelected}
                    sx={{ 
                      '&.Mui-selected': {
                        bgcolor: alpha('#ffffff', 0.1),
                      }
                    }}
                  >
                    {tab.badge !== null ? (
                      <Badge color="error" badgeContent={tab.badge} sx={{ mr: 1 }}>
                        {tab.icon}
                      </Badge>
                    ) : showModeratorBadge ? (
                      <Badge 
                        badgeContent={flaggedMessageCount} 
                        color="error" 
                        max={99}
                      >
                        {tab.icon}
                      </Badge>
                    ) : (
                      tab.icon
                    )}
                    <Typography color="#ffffff" sx={{ ml: tab.icon ? 1 : 0 }}>{tab.label}</Typography>
                  </MenuItem>
                );
              })}

              {authenticated && user?.role === 'admin' && (
                <MenuItem
                  onClick={() => navigateTo('/admin')}
                  selected={location.pathname === '/admin'}
                  sx={{ 
                    '&.Mui-selected': {
                      bgcolor: alpha('#ffffff', 0.1),
                    }
                  }}
                >
                  <Typography color="#ffffff">Admin Panel</Typography>
                </MenuItem>
              )}

              <Divider sx={{ my: 2, bgcolor: alpha('#ffffff', 0.2) }} />

              {!authenticated ? (
                <>
                  <MenuItem onClick={() => {
                    effectiveHandleOpenSignIn();
                    setOpen(false);
                  }}>
                    <Typography color="#ffffff">Sign in</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    effectiveHandleOpenSignUp();
                    setOpen(false);
                  }}>
                    <Typography color="#ffffff">Sign up</Typography>
                  </MenuItem>
                </>
              ) : (
                <MenuItem onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              )}
            </Box>
          </Drawer>
        </StyledToolbar>
      </Container>

      {/* Sign In Dialog */}
      <Dialog
        open={effectiveOpenSignIn}
        onClose={effectiveHandleCloseSignIn}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: 'rgba(13, 37, 56, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '560px',
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(10, 25, 47, 0.7)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          pt: 4,
          pb: 1
        }}>
          <SecurityIcon sx={{ fontSize: 44, color: '#ffffff', mb: 1 }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}
          >
            WhisperChain+
          </Typography>
        </Box>
        
        <DialogTitle sx={{ 
          color: '#ffffff', 
          textAlign: 'center',
          pb: 0
        }}>
          Sign In to Your Account
          <IconButton
            onClick={effectiveHandleCloseSignIn}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#ffffff' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          mt: 2,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Box 
            component="form"
            onSubmit={handleSignIn}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3, 
              mt: 1,
              mx: 'auto',
              maxWidth: { sm: '100%', md: '80%' }
            }}
          >
            <TextField
              label="Email address"
              fullWidth
              variant="outlined"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              InputProps={{
                sx: { color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }
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
            
            <Box sx={{ width: '100%' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mb: 1 
                }}
              >
                <Typography 
                  variant="body2" 
                  onClick={effectiveHandleOpenForgotPassword}
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#ffffff'
                    }
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>
              
              <TextField
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
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
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ borderRadius: '8px', mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 4,
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: { sm: '100%', md: '80%' },
            mx: 'auto',
            width: '100%'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }}>
              Don't have an account?
            </Typography>
            <Typography 
              variant="body2" 
              onClick={effectiveSwitchToSignUp}
              sx={{ 
                color: '#f50057', 
                cursor: 'pointer', 
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign up now
            </Typography>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Sign Up Dialog */}
      <Dialog
        open={effectiveOpenSignUp}
        onClose={effectiveHandleCloseSignUp}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: 'rgba(13, 37, 56, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '560px',
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(10, 25, 47, 0.7)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          pt: 4,
          pb: 1
        }}>
          <SecurityIcon sx={{ fontSize: 44, color: '#ffffff', mb: 1 }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}
          >
            WhisperChain+
          </Typography>
        </Box>
        
        <DialogTitle sx={{ 
          color: '#ffffff', 
          textAlign: 'center',
          pb: 0
        }}>
          Create Your Account
          <IconButton
            onClick={effectiveHandleCloseSignUp}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#ffffff' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          mt: 2,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Box 
            component="form"
            onSubmit={handleSignUp}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3, 
              mt: 1,
              mx: 'auto',
              maxWidth: { sm: '100%', md: '80%' }
            }}
          >
            <TextField
              label="Email address"
              fullWidth
              variant="outlined"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
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
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
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
            <FormControl component="fieldset">
              <FormLabel 
                component="legend" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: 'rgba(255,255,255,0.7)'
                  }
                }}
              >
                Role
              </FormLabel>
              <RadioGroup
                row
                name="role"
                value={effectiveRole}
                onChange={(e) => effectiveSetRole(e.target.value)}
              >
                <FormControlLabel 
                  value="user" 
                  control={<Radio sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#f50057' } }} />} 
                  label="User" 
                  sx={{ color: '#ffffff' }}
                />
                <FormControlLabel 
                  value="moderator" 
                  control={<Radio sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#f50057' } }} />} 
                  label="Moderator" 
                  sx={{ color: '#ffffff' }}
                />
              </RadioGroup>
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              disabled={isSubmitting}
              sx={{ 
                borderRadius: '8px', 
                mb: 2,
                bgcolor: '#3f51b5',
                '&:hover': {
                  bgcolor: '#303f9f',
                }
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 4,
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: { sm: '100%', md: '80%' },
            mx: 'auto',
            width: '100%'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }}>
              Already have an account?
            </Typography>
            <Typography 
              variant="body2" 
              onClick={effectiveSwitchToSignIn}
              sx={{ 
                color: '#f50057', 
                cursor: 'pointer', 
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign in
            </Typography>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog
        open={effectiveOpenForgotPassword}
        onClose={effectiveHandleCloseForgotPassword}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backgroundColor: 'rgba(13, 37, 56, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '560px',
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(10, 25, 47, 0.7)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          pt: 4,
          pb: 1
        }}>
          <SecurityIcon sx={{ fontSize: 44, color: '#ffffff', mb: 1 }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}
          >
            WhisperChain+
          </Typography>
        </Box>
        
        <DialogTitle sx={{ 
          color: '#ffffff', 
          textAlign: 'center',
          pb: 0
        }}>
          Reset Password
          <IconButton
            onClick={effectiveHandleCloseForgotPassword}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#ffffff' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          mt: 2,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Box 
            component="form"
            onSubmit={handleResetPassword}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3, 
              mt: 1,
              mx: 'auto',
              maxWidth: { sm: '100%', md: '80%' }
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', mb: 2 }}>
              Enter your account's email address, and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
              label="Email address"
              type="email"
              fullWidth
              variant="outlined"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
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
              disabled={isSubmitting}
              sx={{ borderRadius: '8px', mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 4,
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: { sm: '100%', md: '80%' },
            mx: 'auto',
            width: '100%'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1 }}>
            <Typography 
              variant="body2" 
              onClick={effectiveSwitchToSignIn}
              sx={{ 
                color: '#f50057', 
                cursor: 'pointer', 
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Back to Sign In
            </Typography>
          </Box>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default AppAppBar; 
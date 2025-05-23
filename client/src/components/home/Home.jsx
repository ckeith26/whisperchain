import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Stack,
  Paper,
  Grid,
  useTheme,
  Divider,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  DialogActions,
  Backdrop
} from '@mui/material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import MessageIcon from '@mui/icons-material/Message';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
import useStore from '../../store';
import AppAppBar from '../shared-components/AppAppBar/AppAppBar';
import Typewriter from 'typewriter-effect';

const Hero = ({ 
  openSignIn, 
  openSignUp, 
  openForgotPassword,
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
  emailInput,
  setEmailInput
}) => {
  const navigate = useNavigate();
  const { authenticated } = useStore(state => state.authSlice);
  const theme = useTheme();

  const handleJoinNowClick = () => {
    if (!authenticated) {
      handleOpenSignUp();
    } else {
      navigate('/messages');
    }
  };

  const roleTabs = {
    sender: [
      { label: 'Send Message', path: '/messages/send' }
    ],
    receiver: [
      { label: 'Inbox', path: '/messages' }
    ],
    moderator: [
      { label: 'Flagged', path: '/moderator/flaggedMessages' },
      { label: 'Freeze Tokens', path: '/moderator/freezeToken' },
      { label: 'Audit Logs', path: '/moderator/auditLogs' }
    ],
    admin: [
      { label: 'Users', path: '/admin/users' }
    ]
  };
  
  return (
    <Box
      id="hero"
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        scrollSnapAlign: 'start',
        backgroundColor: '#0a192f', 
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63, 81, 181, 0.3), transparent)',
      }}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          pt: { xs: 8, sm: 0 },
          pb: { xs: 8, sm: 0 },
        }}
      >
        <Stack
          spacing={3}
          useFlexGap
          sx={{
            alignItems: 'center',
            width: { xs: '100%', sm: '95%', md: '80%' },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              fontSize: 'clamp(3rem, 10vw, 4rem)',
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 0 15px rgba(255,255,255,0.3)',
              mb: 1,
            }}
          >
            WhisperChain+
          </Typography>

          <Box
            sx={{
              height: 120,
              textAlign: 'center',
              width: '100%',
              //   maxWidth: 800,
              mb: 3,
            }}
          >
            <Typewriter
              options={{
                strings: [
                  "Secure, anonymous messaging with role-based access control",
                  "Send encrypted messages",
                  "Maintain anonymity with end-to-end encryption",
                  "Sender, Recipient, Moderator, Admin role support",
                  "Search for recipients securely and privately",
                  "Flag content that violates community guidelines"
                ],
                autoStart: true,
                loop: true,
                delay: 50,
                deleteSpeed: 30,
                wrapperClassName: 'typewriter-wrapper',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2, textAlign: 'center', fontSize: '1rem' }}>
              Send anonymous complements with secure encryption and privacy controls.
            </Typography>
            <Box sx={{ display: 'flex', width: '100%', gap: 1, maxWidth: 500 }}>
              <input
                type="email"
                placeholder="Your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: '#ffffff', 
                  color: '#0a192f',
                  px: 3,
                  borderRadius: '28px',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.85)',
                  }
                }}
                onClick={handleJoinNowClick}
              >
                Join Now
              </Button>
            </Box>
          </Box>

          {authenticated && (
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              onClick={() => navigate('/messages')}
              startIcon={<MessageIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              Your Messages
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

const Features = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        scrollSnapAlign: 'start',
        backgroundColor: '#0d2538', 
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(63, 81, 181, 0.2), transparent)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom 
          mb={6}
          sx={{ 
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={4} 
              sx={{ 
                p: 4, 
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                backgroundColor: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                } 
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <LockIcon sx={{ fontSize: 60, mb: 2, color: '#f50057' }} />
                <Typography variant="h5" gutterBottom fontWeight="bold" color="#ffffff">
                  Anonymous Messaging
                </Typography>
                <Typography color="rgba(255,255,255,0.7)">
                  Send and receive messages anonymously with encryption and privacy controls.
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={4} 
              sx={{ 
                p: 4, 
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                backgroundColor: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                } 
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <SecurityIcon sx={{ fontSize: 60, mb: 2, color: '#3f51b5' }} />
                <Typography variant="h5" gutterBottom fontWeight="bold" color="#ffffff">
                  Role-Based Access
                </Typography>
                <Typography color="rgba(255,255,255,0.7)">
                  Secure environment with role-based permissions for senders, recipients, moderators and admins.
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={4} 
              sx={{ 
                p: 4, 
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                backgroundColor: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                } 
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <MessageIcon sx={{ fontSize: 60, mb: 2, color: '#4caf50' }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [emailInput, setEmailInput] = useState('');
  const { authenticated } = useStore(state => state.authSlice);

  // Check URL query parameters on component mount and route changes
  useEffect(() => {
    if (authenticated) {
      // If user is authenticated, don't show any auth modals
      setOpenSignIn(false);
      setOpenSignUp(false);
      setOpenForgotPassword(false);
      return;
    }

    const action = searchParams.get('action');
    if (action === 'signin' || action === 'login') {
      setOpenSignUp(false);
      setOpenForgotPassword(false);
      setOpenSignIn(true);
    } else if (action === 'signup') {
      setOpenSignIn(false);
      setOpenForgotPassword(false);
      setOpenSignUp(true);
    } else if (action === 'reset-password') {
      setOpenSignIn(false);
      setOpenSignUp(false);
      setOpenForgotPassword(true);
    } else if (action === 'verify') {
      setOpenSignUp(false);
      setOpenForgotPassword(false);
      setOpenSignIn(true);
    }
  }, [searchParams, authenticated]);

  const handleOpenSignIn = () => {
    if (!authenticated) {
      setOpenSignIn(true);
      navigate('/?action=signin', { replace: true });
    } else {
      navigate('/messages');
    }
  };

  const handleCloseSignIn = () => {
    setOpenSignIn(false);
    navigate('/', { replace: true });
  };

  const handleOpenSignUp = () => {
    if (!authenticated) {
      setOpenSignUp(true);
      navigate('/?action=signup', { replace: true });
    } else {
      navigate('/messages');
    }
  };

  const handleCloseSignUp = () => {
    setOpenSignUp(false);
    navigate('/', { replace: true });
  };

  const handleOpenForgotPassword = () => {
    setOpenForgotPassword(true);
    navigate('/?action=reset-password', { replace: true });
  };

  const handleCloseForgotPassword = () => {
    setOpenForgotPassword(false);
    navigate('/', { replace: true });
  };

  const switchToSignUp = () => {
    setOpenSignIn(false);
    setOpenSignUp(true);
    navigate('/?action=signup', { replace: true });
  };

  const switchToSignIn = () => {
    setOpenSignUp(false);
    setOpenForgotPassword(false);
    setOpenSignIn(true);
    navigate('/?action=signin', { replace: true });
  };

  return (
    <>
      <CssBaseline />
      <AppAppBar 
        openSignIn={openSignIn}
        setOpenSignIn={setOpenSignIn}
        openSignUp={openSignUp}
        setOpenSignUp={setOpenSignUp}
        openForgotPassword={openForgotPassword}
        setOpenForgotPassword={setOpenForgotPassword}
        handleOpenSignIn={handleOpenSignIn}
        handleCloseSignIn={handleCloseSignIn}
        handleOpenSignUp={handleOpenSignUp}
        handleCloseSignUp={handleCloseSignUp}
        handleOpenForgotPassword={handleOpenForgotPassword}
        handleCloseForgotPassword={handleCloseForgotPassword}
        switchToSignIn={switchToSignIn}
        switchToSignUp={switchToSignUp}
        role={role}
        setRole={setRole}
        emailInput={emailInput}
      />
      <Box
        sx={{
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <Hero 
          openSignIn={openSignIn}
          openSignUp={openSignUp}
          openForgotPassword={openForgotPassword}
          handleOpenSignIn={handleOpenSignIn}
          handleCloseSignIn={handleCloseSignIn}
          handleOpenSignUp={handleOpenSignUp}
          handleCloseSignUp={handleCloseSignUp}
          handleOpenForgotPassword={handleOpenForgotPassword}
          handleCloseForgotPassword={handleCloseForgotPassword}
          switchToSignIn={switchToSignIn}
          switchToSignUp={switchToSignUp}
          role={role}
          setRole={setRole}
          emailInput={emailInput}
          setEmailInput={setEmailInput}
        />
        <Features />
        <Box 
          component="footer" 
          sx={{ 
            py: 3, 
            textAlign: 'center', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            backgroundColor: '#050e1a',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.875rem',
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" color="inherit">
              © {new Date().getFullYear()} WhisperChain+ | Secure Messaging Platform
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Privacy Policy • Terms of Service • Contact
            </Typography>
          </Container>
        </Box>
      </Box>
      <style>{`
        .typewriter-wrapper {
          font-size: clamp(1.3rem, 3vw, 1.8rem);
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
          line-height: 1.5;
          text-align: center;
        }
        
        .Typewriter__cursor {
          color: #f50057;
          font-size: 1.8em;
          font-weight: 600;
        }
      `}</style>
    </>
  );
};

export default Home; 
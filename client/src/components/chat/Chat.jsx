import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import FlagIcon from '@mui/icons-material/Flag';
import SearchIcon from '@mui/icons-material/Search';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';
import AppAppBar from '../shared-components/AppAppBar/AppAppBar';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useStore(state => state.authSlice);
  const { 
    messages, 
    getMessages, 
    sendMessage, 
    flagMessage, 
    messageLoading, 
    searchUsers,
    users,
    userLoading,
  } = useStore(state => state.userSlice);
  
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState('received'); // received or send

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const loadData = async () => {
      await getMessages();
    };

    loadData();
  }, [user, getMessages, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newMessage) {
      setError('Message cannot be empty');
      return;
    }

    if (!recipient) {
      setError('Please select a recipient');
      return;
    }



    setSending(true);
    try {
      const result = await sendMessage({
        content: newMessage,
        recipientId: recipient,
      });

      if (result.success) {
        setNewMessage('');
        setRecipient('');
      } else {
        setError(result.message || 'Failed to send message');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleFlagMessage = async (messageId) => {
    try {
      await flagMessage(messageId);
    } catch (err) {
      console.error('Error flagging message:', err);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchUsers(searchQuery);
    }
  };

  const handleToggleView = () => {
    setViewMode(viewMode === 'received' ? 'send' : 'received');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render loading state
  if (messageLoading && !messages.length) {
    return (
      <>
        <AppAppBar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <AppAppBar />
      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>

          {viewMode === 'received' ? (
            // Received Messages View
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Your Messages
                </Typography>
                {messages.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body1" color="text.secondary">
                      You have no messages yet.
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {messages.map((message) => (
                      <React.Fragment key={message._id}>
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            !message.flagged && (
                              <IconButton 
                                edge="end" 
                                aria-label="flag" 
                                onClick={() => handleFlagMessage(message._id)}
                                color="warning"
                              >
                                <FlagIcon />
                              </IconButton>
                            )
                          }
                          sx={{
                            bgcolor: message.flagged ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between">
                                <Typography component="span" variant="body1">
                                  Anonymous Sender
                                </Typography>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatDate(message.timestamp)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body1"
                                  color="text.primary"
                                  sx={{ display: 'block', my: 1 }}
                                >
                                  {message.content}
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1}>
                                  {message.flagged && (
                                    <Chip
                                      size="small"
                                      label="Flagged"
                                      color="warning"
                                      icon={<FlagIcon fontSize="small" />}
                                    />
                                  )}
                                  
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          ) : (
            // Send Message View
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Send Anonymous Message
                </Typography>

                

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <Typography variant="h6" gutterBottom>
                      Find Recipients
                    </Typography>
                    
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        placeholder="Search for recipients"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={handleSearch} disabled={userLoading || !searchQuery.trim()}>
                              {userLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                            </IconButton>
                          ),
                        }}
                      />
                    </Box>

                    <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper' }}>
                      {users.length === 0 ? (
                        <ListItem>
                          <ListItemText secondary="Search for users to message" />
                        </ListItem>
                      ) : (
                        users.map((user) => (
                          <ListItem
                            key={user.uid}
                            button
                            selected={recipient === user.uid}
                            onClick={() => setRecipient(user.uid)}
                          >
                            <ListItemText
                              primary={user.username}
                              secondary={`Role: ${user.role}`}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Typography variant="h6" gutterBottom>
                      Compose Message
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="recipient-select-label">Recipient</InputLabel>
                      <Select
                        labelId="recipient-select-label"
                        value={recipient}
                        label="Recipient"
                        onChange={(e) => setRecipient(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select a recipient</em>
                        </MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.uid} value={user.uid}>
                            {user.username}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      placeholder="Type your anonymous message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage || !recipient }
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      {sending ? 'Sending...' : 'Send Anonymous Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
    
      </Container>
    </>
  );
};

export default Chat; 
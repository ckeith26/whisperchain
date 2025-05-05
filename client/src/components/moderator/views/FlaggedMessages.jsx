import React, { useState, useEffect } from 'react';
import { 
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../../../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

const FlaggedMessages = () => {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState('');
  const { token } = useStore(state => state.authSlice);

  useEffect(() => {
    fetchFlaggedMessages();
  }, [token]);

  const fetchFlaggedMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/moderator/flaggedMessages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlaggedMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching flagged messages:', err);
      setError('Failed to load flagged messages. Please try again later.');
      toast.error('Could not load flagged messages');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewMessage = (message) => {
    setSelected(message);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
    setActionNote('');
    setActionType('');
  };

  const handleAction = async (type) => {
    try {
      setActionType(type);
      // This would be replaced with the actual API call to handle the action
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulated API call
      
      // In a real implementation, you would call the API to perform the action
      /*
      await axios.post(`${API_URL}/moderator/moderateMessage`, {
        messageId: selected.id,
        action: type,
        note: actionNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      
      toast.success(`Message ${type === 'approve' ? 'approved' : type === 'reject' ? 'rejected' : 'frozen'} successfully`);
      handleCloseDialog();
      fetchFlaggedMessages();
    } catch (err) {
      toast.error(`Failed to ${type} message: ${err.message}`);
    } finally {
      setActionType('');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Flagged Messages
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchFlaggedMessages}
          >
            Refresh
          </Button>
        </Box>
        
        {flaggedMessages.length === 0 ? (
          <Alert severity="info">There are no flagged messages to review.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Date</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Round</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Flag Reason</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Mock data - would be replaced with actual data */}
                  {[
                    { 
                      id: 1, 
                      date: new Date().toLocaleDateString(), 
                      round: 3, 
                      reason: 'Inappropriate content', 
                      status: 'Pending',
                      content: 'This is a sample flagged message content that contains inappropriate material that violated community standards.'
                    },
                    { 
                      id: 2, 
                      date: new Date(Date.now() - 86400000).toLocaleDateString(), 
                      round: 3, 
                      reason: 'Spam', 
                      status: 'Pending',
                      content: 'This message appears to be spam content promoting unauthorized services or products.'
                    }
                  ].slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((message) => (
                    <TableRow key={message.id}>
                      <TableCell sx={{ color: 'white' }}>{message.date}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{message.round}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{message.reason}</TableCell>
                      <TableCell>
                        <Chip 
                          label={message.status} 
                          color={message.status === 'Pending' ? 'warning' : message.status === 'Approved' ? 'success' : 'error'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewMessage(message)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={2}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ color: 'white' }}
            />
          </>
        )}
      </Paper>

      {/* Message detail dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: 'rgba(22, 28, 36, 0.95)',
            color: 'white',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle>
          Review Flagged Message
        </DialogTitle>
        <DialogContent>
          {selected && (
            <>
              <Box sx={{ mb: 3, mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {selected.date}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Round: {selected.round}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Flag Reason: {selected.reason}
                </Typography>
              </Box>
              
              <DialogContentText color="white" sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1 }}>
                {selected.content}
              </DialogContentText>
              
              <TextField
                label="Moderation Note"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                sx={{
                  mb: 2,
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
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleCloseDialog} 
            color="inherit"
            disabled={!!actionType}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleAction('approve')} 
            color="success"
            startIcon={<CheckCircleIcon />}
            disabled={!!actionType}
          >
            {actionType === 'approve' ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleAction('reject')} 
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!!actionType}
          >
            {actionType === 'reject' ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleAction('freeze')} 
            color="warning"
            startIcon={<BlockIcon />}
            disabled={!!actionType}
          >
            {actionType === 'freeze' ? <CircularProgress size={24} color="inherit" /> : 'Freeze'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FlaggedMessages; 
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../../../store';

const API_URL = import.meta.env.VITE_API_URL;

const ACTION_TYPES = {
  USER_CREATED: 'User Created',
  USER_ROLE_CHANGED: 'Role Changed',
  USER_SUSPENDED: 'User Suspended',
  USER_UNSUSPENDED: 'User Unsuspended',
  MESSAGE_SENT: 'Message Sent',
  MESSAGE_FLAGGED: 'Message Flagged',
  MESSAGE_APPROVED: 'Message Approved',
  MESSAGE_REJECTED: 'Message Rejected',
  TOKEN_FROZEN: 'Token Frozen',
  ROUND_STARTED: 'Round Started',
  ROUND_ENDED: 'Round Ended'
};

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    actionType: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const { token } = useStore(state => state.authSlice);

  useEffect(() => {
    fetchAuditLogs();
  }, [token]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.actionType) queryParams.append('actionType', filters.actionType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.userId) queryParams.append('userId', filters.userId);

      const response = await axios.get(`${API_URL}/moderator/auditLogs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data.logs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again later.');
      toast.error('Could not load audit logs');
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchAuditLogs();
  };

  const resetFilters = () => {
    setFilters({
      actionType: '',
      startDate: '',
      endDate: '',
      userId: ''
    });
    setPage(0);
    fetchAuditLogs();
  };

  const exportLogs = () => {
    // In a real implementation, this would trigger a proper CSV or PDF export
    toast.info('Export functionality would be implemented here');
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
            Audit Logs
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={exportLogs}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        </Box>
        
        {/* Filters */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel id="action-type-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Action Type</InputLabel>
              <Select
                labelId="action-type-label"
                name="actionType"
                value={filters.actionType}
                onChange={handleFilterChange}
                label="Action Type"
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
                <MenuItem value="">All Actions</MenuItem>
                {Object.entries(ACTION_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={key}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
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
              }}
            />
            
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
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
              }}
            />
            
            <TextField
              label="User ID"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              fullWidth
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
              }}
            />
          </Stack>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={applyFilters}
              startIcon={<FilterAltIcon />}
            >
              Apply Filters
            </Button>
          </Box>
        </Paper>
        
        {auditLogs.length === 0 ? (
          <Alert severity="info">No audit logs found matching the current filters.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Timestamp</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Action</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>User</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Mock data - would be replaced with actual data */}
                  {[
                    { 
                      id: 1, 
                      timestamp: new Date().toLocaleString(), 
                      action: ACTION_TYPES.USER_ROLE_CHANGED, 
                      user: 'john.doe@example.com',
                      details: 'Role changed from IDLE to SENDER'
                    },
                    { 
                      id: 2, 
                      timestamp: new Date(Date.now() - 86400000).toLocaleString(), 
                      action: ACTION_TYPES.MESSAGE_FLAGGED, 
                      user: 'alice.smith@example.com',
                      details: 'Message flagged for inappropriate content'
                    },
                    { 
                      id: 3, 
                      timestamp: new Date(Date.now() - 172800000).toLocaleString(), 
                      action: ACTION_TYPES.ROUND_STARTED, 
                      user: 'admin@whisperchain.com',
                      details: 'Round 3 started with 15 tokens issued'
                    }
                  ].slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell sx={{ color: 'white' }}>{log.timestamp}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action}
                          color={
                            log.action.includes('Created') || log.action.includes('Started') ? 'success' : 
                            log.action.includes('Changed') ? 'info' : 
                            log.action.includes('Flagged') || log.action.includes('Suspended') || log.action.includes('Frozen') ? 'warning' :
                            log.action.includes('Rejected') ? 'error' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{log.user}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={3}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ color: 'white' }}
            />
          </>
        )}
      </Paper>
    </>
  );
};

export default AuditLogs; 
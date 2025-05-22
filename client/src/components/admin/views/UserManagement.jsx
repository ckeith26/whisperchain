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
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyIcon from '@mui/icons-material/Key';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../../../store';

const API_URL = import.meta.env.VITE_API_URL;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { token, user: currentUser } = useStore(state => state.authSlice);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
      toast.error('Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/pendingUsers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(response.data.pendingUsers || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      toast.error('Could not load pending user registrations');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user) => {
    if (currentUser && currentUser.uid === user.uid) {
      toast.error("You cannot edit your own role");
      return;
    }
    setSelectedUser(user);
    setSelectedRole(user.role);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setSelectedRole('');
    setActionLoading(false);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/admin/assignRole`, {
        userId: selectedUser.uid,
        role: selectedRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Role updated successfully for ${selectedUser.name}`);
      
      // Update the local state to reflect the change
      setUsers(prevUsers => prevUsers.map(user => 
        user.uid === selectedUser.uid ? { ...user, role: selectedRole } : user
      ));
      
      handleCloseDialog();
      fetchUsers(); // Refresh the full list
      fetchPendingUsers(); // Refresh pending users
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(`Failed to update role: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const approveUser = async (userId, role) => {
    // Prevent approving as admin
    if (role === 'admin') {
      toast.error('Admin role cannot be assigned for security reasons');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/admin/assignRole`, {
        userId,
        role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User approved successfully');
      fetchPendingUsers(); // Refresh pending users
      fetchUsers(); // Refresh all users
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error(`Failed to approve user: ${err.response?.data?.error || err.message}`);
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
      {/* Pending Registrations */}
      {pendingUsers.length > 0 && (
        <Paper 
          sx={{ 
            p: 3,
            bgcolor: 'rgba(22, 28, 36, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            mb: 3,
            overflowX: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pending Registrations
            </Typography>
            <Chip 
              label={`${pendingUsers.length} pending`} 
              color="warning" 
              size="small" 
            />
          </Box>
          
          {/* Pending Users Table */}
          <TableContainer sx={{ 
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '4px'
            }
          }}>
            <Table size="small" sx={{ minWidth: '600px' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '120px' }}>Name</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '160px' }}>Email</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '120px' }}>Registered</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '180px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell sx={{ color: 'white' }}>{user.name || 'Unnamed'}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {new Date(user.accountCreatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => approveUser(user.uid, 'user')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => approveUser(user.uid, 'moderator')}
                        >
                          As Moderator
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Main User List */}
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'rgba(22, 28, 36, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          overflowX: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="white">
            User Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={`${users.length} users`} 
              color="info" 
              size="small" 
            />
            <Tooltip title="Refresh user list">
              <IconButton 
                size="small"
                onClick={() => {
                  fetchUsers();
                  fetchPendingUsers();
                }}
                disabled={loading}
                sx={{ color: 'primary.main' }}
              >
                {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <TableContainer sx={{ 
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '4px'
          }
        }}>
          <Table size="small" sx={{ minWidth: '750px' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '120px' }}>Name</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '160px' }}>Email</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '100px' }}>Role</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '100px' }}>Status</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '90px' }}>Public Key</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '120px' }}>Registered</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '80px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell sx={{ color: 'white' }}>{user.name || 'Unnamed'}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={
                          user.role === 'admin' 
                            ? 'error' 
                            : user.role === 'moderator' 
                              ? 'warning' 
                              : 'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={user.status === 'active' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.publicKey ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <KeyIcon sx={{ color: 'white' }} fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" justifyContent="center" width="100%">
                        <Tooltip title={currentUser && currentUser.uid === user.uid ? "Cannot edit own role" : "Edit Role"}>
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditUser(user)}
                              sx={{ color: 'primary.main' }}
                              disabled={currentUser && currentUser.uid === user.uid}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ color: 'white' }}
        />
      </Paper>

      {/* Role Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            p: 2,
            minHeight: '300px'
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 2 }}>Change User Role</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ fontSize: '1.1rem', mb: 3 }}>
            Change the role for {selectedUser?.name || selectedUser?.email || 'User'}
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              label="Role"
              onChange={handleRoleChange}
              sx={{ fontSize: '1.1rem' }}
            >
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="user">Regular User</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} size="large">Cancel</Button>
          <Button 
            onClick={handleSaveRole} 
            disabled={actionLoading || !selectedRole}
            color="primary"
            variant="contained"
            size="large"
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement; 
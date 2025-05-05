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
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyIcon from '@mui/icons-material/Key';
import axios from 'axios';
import { toast } from 'react-toastify';
import useStore from '../../../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

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
  const { token } = useStore(state => state.authSlice);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch all users
      // Mock data for now
      setUsers([
        {
          uid: 'user1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user',
          status: 'active',
          publicKey: true,
          createdAt: '2023-05-01'
        },
        {
          uid: 'user2',
          name: 'Alice Smith',
          email: 'alice.smith@example.com',
          role: 'moderator',
          status: 'active',
          publicKey: true,
          createdAt: '2023-05-03'
        },
        {
          uid: 'user3',
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          role: 'user',
          status: 'suspended',
          publicKey: false,
          createdAt: '2023-05-05'
        }
      ]);
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

  const handleToggleSuspension = async (user) => {
    try {
      // In a real implementation, this would call an API to suspend/unsuspend a user
      toast.info(`User ${user.status === 'suspended' ? 'unsuspended' : 'suspended'}: ${user.name}`);
      
      // Update the local state to reflect the change
      setUsers(prevUsers => prevUsers.map(u => 
        u.uid === user.uid ? { 
          ...u, 
          status: user.status === 'suspended' ? 'active' : 'suspended' 
        } : u
      ));
    } catch (err) {
      console.error('Error toggling suspension:', err);
      toast.error(`Failed to ${user.status === 'suspended' ? 'unsuspend' : 'suspend'} user`);
    }
  };

  const approveUser = async (userId, role) => {
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
            mb: 3
          }}
        >
          <Typography variant="h6" gutterBottom>
            Pending Registrations
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Name</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Email</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Registered</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell sx={{ color: 'white' }}>{user.name}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{new Date(user.accountCreatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => approveUser(user.uid, 'sender')}
                        >
                          Sender
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained"
                          color="primary"
                          onClick={() => approveUser(user.uid, 'recipient')}
                        >
                          Recipient
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
      
      {/* All Users */}
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'rgba(22, 28, 36, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          User Management
        </Typography>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Name</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Email</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Role</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Public Key</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                <TableRow key={user.uid}>
                  <TableCell sx={{ color: 'white' }}>{user.name}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role}
                      color={
                        user.role === 'admin' ? 'error' : 
                        user.role === 'moderator' ? 'warning' : 
                        user.role === 'sender' ? 'success' : 
                        user.role === 'recipient' ? 'info' : 
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status}
                      color={user.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.publicKey ? (
                      <Tooltip title="Public key is set">
                        <CheckCircleIcon color="success" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="No public key">
                        <KeyIcon color="action" fontSize="small" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={user.status === 'suspended' ? 'success' : 'warning'}
                        onClick={() => handleToggleSuspension(user)}
                      >
                        {user.status === 'suspended' ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : (
                          <BlockIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ color: 'white' }}
        />
      </Paper>

      {/* Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
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
          Edit User
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <DialogContentText color="white" paragraph>
                Update role for {selectedUser.name} ({selectedUser.email})
              </DialogContentText>
              
              <FormControl fullWidth variant="outlined" sx={{ mt: 2 }}>
                <InputLabel id="role-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  label="Role"
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
                  <MenuItem value="idle">Idle</MenuItem>
                  <MenuItem value="sender">Sender</MenuItem>
                  <MenuItem value="recipient">Recipient</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleCloseDialog} 
            color="inherit"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveRole} 
            color="primary"
            disabled={!selectedRole || actionLoading || selectedRole === selectedUser?.role}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement; 
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

const userSlice = (set, get) => ({
  messages: [],
  users: [],
  messageLoading: false,
  userLoading: false,
  
  // Get messages for user
  getMessages: async () => {
    const { token } = get().authSlice;
    
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      set(state => { state.userSlice.messageLoading = true; });
      
      const response = await axios.get(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => {
        state.userSlice.messages = response.data;
        state.userSlice.messageLoading = false;
      });
      
      return { success: true, messages: response.data };
    } catch (error) {
      console.error('Error fetching messages:', error);
      set(state => { state.userSlice.messageLoading = false; });
      const message = error.response?.data?.error || 'Failed to fetch messages';
      toast.error(message);
      return { success: false, message };
    }
  },
  
  // Send a message
  sendMessage: async (messageData) => {
    const { token } = get().authSlice;
    
    try {
      const response = await axios.post(`${API_URL}/messages/send`, messageData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      toast.success('Message sent successfully');
      return { success: true, message: response.data };
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error.response?.data?.error || 'Failed to send message';
      toast.error(message);
      return { success: false, message };
    }
  },
  
  // Flag a message
  flagMessage: async (messageId) => {
    const { token } = get().authSlice;
    
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      await axios.post(`${API_URL}/messages/flag`, { messageId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update message state
      set(state => {
        const updatedMessages = state.userSlice.messages.map(msg => 
          msg._id === messageId ? { ...msg, flagged: true } : msg
        );
        state.userSlice.messages = updatedMessages;
      });
      
      toast.success('Message flagged for review');
      return { success: true };
    } catch (error) {
      console.error('Error flagging message:', error);
      const message = error.response?.data?.error || 'Failed to flag message';
      toast.error(message);
      return { success: false, message };
    }
  },
  
  // Search for users (to send messages to)
  searchUsers: async (query) => {
    const { token } = get().authSlice;
    
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      set(state => { state.userSlice.userLoading = true; });
      
      const response = await axios.get(`${API_URL}/auth/searchUsers?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => {
        state.userSlice.users = response.data;
        state.userSlice.userLoading = false;
      });
      
      return { success: true, users: response.data };
    } catch (error) {
      console.error('Error searching users:', error);
      set(state => { state.userSlice.userLoading = false; });
      const message = error.response?.data?.error || 'Failed to search users';
      toast.error(message);
      return { success: false, message };
    }
  },
  
});

export default userSlice; 
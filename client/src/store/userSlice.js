import axios from "axios";
import { api } from "../api/axios";
import { toast } from "react-toastify";
import { encryptMessage, MODERATOR_PUBLIC_KEY } from "../utils/crypto";

const API_URL = import.meta.env.VITE_API_URL;

const userSlice = (set, get) => ({
  messages: [],
  users: [],
  sentMessages: [],
  messageLoading: false,
  sentMessageLoading: false,
  userLoading: false,
  userPage: 0,
  messagePage: 0,
  sentMessagePage: 0,
  hasMoreUsers: true,
  hasMoreMessages: true,
  hasMoreSentMessages: true,
  unreadMessageCount: 0,
  flaggedMessageCount: 0,
  lastReadTimestamp: 0,

  // Get messages for user with pagination
  getMessages: async (page = 0) => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      set((state) => {
        state.userSlice.messageLoading = true;
        if (page === 0) {
          // Reset messages when loading first page
          state.userSlice.messages = [];
        }
      });

      const response = await api.get(`/messages?page=${page}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Count unread messages (assuming API returns an isRead flag)
      const unreadCount = (response.data.messages || []).filter(
        (msg) => !msg.isRead
      ).length;

      set((state) => {
        if (page === 0) {
          state.userSlice.messages = response.data.messages || [];
          // Update unread count only on initial load
          state.userSlice.unreadMessageCount = unreadCount;
        } else {
          // Append messages for pagination
          state.userSlice.messages = [
            ...state.userSlice.messages,
            ...(response.data.messages || []),
          ];
          // Add any new unread messages to the count
          const existingUnreadCount = (state.userSlice.messages || []).filter(
            (msg) => !msg.isRead
          ).length;
          state.userSlice.unreadMessageCount = existingUnreadCount;
        }
        state.userSlice.messagePage = page;
        state.userSlice.messageLoading = false;
        state.userSlice.hasMoreMessages =
          response.data.pagination?.hasMore || false;
      });

      return {
        success: true,
        messages: response.data.messages || [],
        hasMore: response.data.pagination?.hasMore || false,
        unreadCount,
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      set((state) => {
        state.userSlice.messageLoading = false;
      });
      const message = error.response?.data?.error || "Failed to fetch messages";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Load more messages (pagination)
  loadMoreMessages: async () => {
    const { token } = get().authSlice;
    const { messagePage, hasMoreMessages } = get().userSlice;

    if (!token) return { success: false, message: "Not authenticated" };
    if (!hasMoreMessages) return { success: true, loadedMore: false };

    try {
      set((state) => {
        state.userSlice.messageLoading = true;
      });

      const nextPage = messagePage + 1;
      return await get().userSlice.getMessages(nextPage);
    } catch (error) {
      console.error("Error loading more messages:", error);
      set((state) => {
        state.userSlice.messageLoading = false;
      });
      const message =
        error.response?.data?.error || "Failed to load more messages";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Send a message
  sendMessage: async ({ recipientUid, encryptedMessage }) => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      // Also encrypt for moderator
      const moderatorEncryptedMessage = await encryptMessage(
        encryptedMessage,
        MODERATOR_PUBLIC_KEY
      );

      const response = await api.post(
        "/messages/send",
        {
          recipientUid,
          encryptedMessage,
          moderatorEncryptedMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Don't show toast for successful message send - it's too frequent
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      console.error("Error sending message:", error);
      const message = error.response?.data?.error || "Failed to send message";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Flag a message
  flagMessage: async (messageId) => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      // Get the current message to determine if we're flagging or unflagging
      const messages = get().userSlice.messages;
      const currentMessage = messages.find(
        (msg) => msg.messageId === messageId
      );
      const currentlyFlagged = currentMessage?.flagged || false;

      // Send request to toggle flag status
      await api.post(
        `/messages/flag`,
        {
          messageId,
          unflag: currentlyFlagged, // Send unflag: true when we want to unflag
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update message state with the toggled flag value
      set((state) => {
        const updatedMessages = state.userSlice.messages.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, flagged: !currentlyFlagged }
            : msg
        );
        state.userSlice.messages = updatedMessages;
      });

      toast.success(
        currentlyFlagged ? "Message unflagged" : "Message flagged for review"
      );
      return { success: true };
    } catch (error) {
      console.error("Error toggling message flag:", error);
      const message =
        error.response?.data?.error || "Failed to toggle message flag";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Search for users (to send messages to)
  searchUsers: async (query) => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      set((state) => {
        state.userSlice.userLoading = true;
        state.userSlice.userPage = 0;
      });

      const response = await api.get(`/auth/searchUsers?page=0&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Only include users with public keys and strip personal information
      const availableKeys = (response.data.users || [])
        .filter((user) => !!user.publicKey)
        .map((user) => ({
          uid: user.uid,
          publicKey: user.publicKey,
          keyId: `Key-${user.uid.substring(0, 8)}`, // Create a friendly key identifier
        }));

      set((state) => {
        state.userSlice.users = availableKeys;
        state.userSlice.userLoading = false;
        state.userSlice.hasMoreUsers = response.data.hasMore || false;
      });

      return { success: true, users: availableKeys };
    } catch (error) {
      console.error("Error searching users:", error);
      set((state) => {
        state.userSlice.userLoading = false;
      });
      const message = error.response?.data?.error || "Failed to search users";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Get sent messages for user with pagination
  getSentMessages: async (page = 0) => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      set((state) => {
        state.userSlice.sentMessageLoading = true;
        if (page === 0) {
          // Reset sent messages when loading first page
          state.userSlice.sentMessages = [];
        }
      });

      const response = await api.get(`/messages/sent?page=${page}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => {
        if (page === 0) {
          state.userSlice.sentMessages = response.data.messages || [];
        } else {
          // Append messages for pagination
          state.userSlice.sentMessages = [
            ...state.userSlice.sentMessages,
            ...(response.data.messages || []),
          ];
        }
        state.userSlice.sentMessagePage = page;
        state.userSlice.sentMessageLoading = false;
        state.userSlice.hasMoreSentMessages =
          response.data.pagination?.hasMore || false;
      });

      return {
        success: true,
        messages: response.data.messages || [],
        hasMore: response.data.pagination?.hasMore || false,
      };
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      set((state) => {
        state.userSlice.sentMessageLoading = false;
      });
      const message =
        error.response?.data?.error || "Failed to fetch sent messages";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Load more sent messages (pagination)
  loadMoreSentMessages: async () => {
    const { token } = get().authSlice;
    const { sentMessagePage, hasMoreSentMessages } = get().userSlice;

    if (!token) return { success: false, message: "Not authenticated" };
    if (!hasMoreSentMessages) return { success: true, loadedMore: false };

    try {
      set((state) => {
        state.userSlice.sentMessageLoading = true;
      });

      const nextPage = sentMessagePage + 1;
      return await get().userSlice.getSentMessages(nextPage);
    } catch (error) {
      console.error("Error loading more sent messages:", error);
      set((state) => {
        state.userSlice.sentMessageLoading = false;
      });
      const message =
        error.response?.data?.error || "Failed to load more sent messages";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Load initial users (without search query)
  loadInitialUsers: async () => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      console.log("Starting to load initial users...");
      set((state) => {
        state.userSlice.userLoading = true;
        state.userSlice.userPage = 0;
      });

      const response = await api.get(`/auth/searchUsers?page=0&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Server response for users:", response.data);

      // Only include users with public keys and strip personal information
      const availableKeys = (response.data.users || [])
        .filter((user) => !!user.publicKey)
        .map((user) => ({
          uid: user.uid,
          publicKey: user.publicKey,
          keyId: `Key-${user.uid.substring(0, 8)}`,
        }));

      console.log("Processed available keys:", availableKeys);

      set((state) => {
        state.userSlice.users = availableKeys;
        state.userSlice.userLoading = false;
        state.userSlice.hasMoreUsers = response.data.hasMore || false;
      });

      return { success: true, users: availableKeys };
    } catch (error) {
      console.error("Error loading users:", error);
      set((state) => {
        state.userSlice.userLoading = false;
      });
      const message = error.response?.data?.error || "Failed to load users";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Load more users (pagination)
  loadMoreUsers: async (query = "") => {
    const { token } = get().authSlice;
    const { userPage, hasMoreUsers } = get().userSlice;

    if (!token) return { success: false, message: "Not authenticated" };
    if (!hasMoreUsers) return { success: true, loadedMore: false };

    try {
      set((state) => {
        state.userSlice.userLoading = true;
      });

      const nextPage = userPage + 1;
      const url = `/auth/searchUsers?page=${nextPage}&limit=10${
        query ? `&query=${query}` : ""
      }`;

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => {
        state.userSlice.users = [
          ...state.userSlice.users,
          ...response.data.users,
        ];
        state.userSlice.userLoading = false;
        state.userSlice.userPage = nextPage;
        state.userSlice.hasMoreUsers = response.data.hasMore || false;
      });

      return { success: true, loadedMore: response.data.users.length > 0 };
    } catch (error) {
      console.error("Error loading more users:", error);
      set((state) => {
        state.userSlice.userLoading = false;
      });
      const message =
        error.response?.data?.error || "Failed to load more users";
      toast.error(message);
      return { success: false, message };
    }
  },

  // Mark messages as read
  markMessagesAsRead: async () => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      // Only make API call if there are unread messages
      if (get().userSlice.unreadMessageCount > 0) {
        // Call API to mark messages as read
        await api.post(
          `/messages/markAsRead`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Update local state
      set((state) => {
        // Mark all messages as read in the local state
        if (state.userSlice.messages.length > 0) {
          state.userSlice.messages = state.userSlice.messages.map((msg) => ({
            ...msg,
            isRead: true,
          }));
        }
        // Reset unread count
        state.userSlice.unreadMessageCount = 0;
        // Update last read timestamp
        state.userSlice.lastReadTimestamp = new Date();
      });

      return { success: true };
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return {
        success: false,
        message:
          error.response?.data?.error || "Failed to mark messages as read",
      };
    }
  },

  // Check for new messages (for polling in the background)
  checkNewMessages: async () => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      // Get current time
      const now = new Date();
      const lastReadTime = get().userSlice.lastReadTimestamp || 0;
      const timeSinceLastRead = now - lastReadTime;

      // If messages were marked as read less than 2 seconds ago, don't refresh yet
      if (timeSinceLastRead < 2000) {
        return { success: true, unreadCount: 0 };
      }

      // Get only unread message count
      const response = await api.get(`/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const unreadCount = response.data.count || 0;

      // Update store
      set((state) => {
        state.userSlice.unreadMessageCount = unreadCount;
      });

      return { success: true, unreadCount };
    } catch (error) {
      console.error("Error checking for new messages:", error);
      return {
        success: false,
        message:
          error.response?.data?.error || "Failed to check for new messages",
      };
    }
  },

  // Get count of flagged messages (for moderators)
  fetchFlaggedMessageCount: async () => {
    const { token } = get().authSlice;

    if (!token) return { success: false, message: "Not authenticated" };

    try {
      const response = await api.get(`/moderator/flagged/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const flaggedCount = response.data.count || 0;

      // Update store
      set((state) => {
        state.userSlice.flaggedMessageCount = flaggedCount;
      });

      return { success: true, flaggedCount };
    } catch (error) {
      console.error("Error fetching flagged message count:", error);
      return {
        success: false,
        message:
          error.response?.data?.error ||
          "Failed to fetch flagged message count",
      };
    }
  },

  // Add this function to check API connection
  checkApiConnection: async () => {
    try {
      await api.get("/health");
      return { success: true };
    } catch (error) {
      // If we can't connect to the API health endpoint, trigger logout
      const { authenticated, logout } = get().authSlice;
      if (authenticated) {
        toast.error("Connection to server lost. You have been signed out.");
        logout();
      }
      return { success: false };
    }
  },
});

export default userSlice;

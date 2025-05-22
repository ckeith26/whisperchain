import React, { useEffect, useState, useCallback, useRef } from "react";
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
  useTheme,
  InputAdornment,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import FlagIcon from "@mui/icons-material/Flag";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import MessageIcon from "@mui/icons-material/Message";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import useStore from "../../store";
import { useNavigate, useLocation } from "react-router-dom";
import AppAppBar from "../shared-components/AppAppBar/AppAppBar";
import {
  encryptMessage,
  decryptMessage,
  MODERATOR_PUBLIC_KEY,
} from "../../utils/crypto";

const Chat = ({ view }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useStore((state) => state.authSlice);
  const {
    messages,
    getMessages,
    loadMoreMessages,
    hasMoreMessages,
    sentMessages,
    getSentMessages,
    loadMoreSentMessages,
    hasMoreSentMessages,
    sendMessage,
    flagMessage,
    messageLoading,
    sentMessageLoading,
    searchUsers,
    loadInitialUsers,
    loadMoreUsers,
    users,
    userLoading,
    hasMoreUsers,
    unreadMessageCount,
    markMessagesAsRead,
    checkNewMessages,
  } = useStore((state) => state.userSlice);

  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState(
    view || (location.pathname.includes("/inbox") ? "received" : "send")
  );
  const [searchTimeout, setSearchTimeout] = useState(null);
  const usersListRef = useRef(null);
  const messagesListRef = useRef(null);
  const sentMessagesListRef = useRef(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [decryptError, setDecryptError] = useState("");
  const [decryptingMessage, setDecryptingMessage] = useState("");
  const [decryptedMessages, setDecryptedMessages] = useState({});

  useEffect(() => {
    // Check the current URL path to determine the view mode
    const shouldBeInboxView = location.pathname.includes("/inbox");
    const currentViewMode = shouldBeInboxView ? "received" : "send";

    // Update viewMode if it's different
    if (viewMode !== currentViewMode) {
      setViewMode(currentViewMode);
    }
  }, [location.pathname, viewMode]);

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const loadData = async () => {
      console.log("Loading initial data...");
      await getMessages();
      await getSentMessages();
      if (viewMode === "send") {
        console.log("Loading initial users...");
        const result = await loadInitialUsers();
        console.log("Initial users loaded:", result);
      }
    };

    loadData();
  }, [
    user,
    getMessages,
    getSentMessages,
    loadInitialUsers,
    viewMode,
    navigate,
  ]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timer = setTimeout(async () => {
        if (query.trim()) {
          await searchUsers(query.trim());
        } else {
          // If search query is empty, load initial users
          await loadInitialUsers();
        }
      }, 500); // 500ms delay

      setSearchTimeout(timer);
    },
    [searchTimeout, searchUsers, loadInitialUsers]
  );

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    // Load initial users when search is cleared
    loadInitialUsers();
  };

  // Handle scroll event for users list
  const handleUsersScroll = async () => {
    if (!usersListRef.current || userLoading || !hasMoreUsers) return;

    const { scrollTop, scrollHeight, clientHeight } = usersListRef.current;

    // If scrolled to bottom (with some threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      await loadMoreUsers(searchQuery);
    }
  };

  // Handle scroll event for received messages
  const handleMessagesScroll = async () => {
    if (!messagesListRef.current || messageLoading || !hasMoreMessages) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesListRef.current;

    // If scrolled to bottom (with some threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      await loadMoreMessages();
    }
  };

  // Handle scroll event for sent messages
  const handleSentMessagesScroll = async () => {
    if (
      !sentMessagesListRef.current ||
      sentMessageLoading ||
      !hasMoreSentMessages
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } =
      sentMessagesListRef.current;

    // If scrolled to bottom (with some threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      await loadMoreSentMessages();
    }
  };

  // Add scroll event listeners
  useEffect(() => {
    const currentUsersRef = usersListRef.current;
    const currentMessagesRef = messagesListRef.current;
    const currentSentMessagesRef = sentMessagesListRef.current;

    if (currentUsersRef) {
      currentUsersRef.addEventListener("scroll", handleUsersScroll);
    }

    if (currentMessagesRef) {
      currentMessagesRef.addEventListener("scroll", handleMessagesScroll);
    }

    if (currentSentMessagesRef) {
      currentSentMessagesRef.addEventListener(
        "scroll",
        handleSentMessagesScroll
      );
    }

    return () => {
      if (currentUsersRef) {
        currentUsersRef.removeEventListener("scroll", handleUsersScroll);
      }
      if (currentMessagesRef) {
        currentMessagesRef.removeEventListener("scroll", handleMessagesScroll);
      }
      if (currentSentMessagesRef) {
        currentSentMessagesRef.removeEventListener(
          "scroll",
          handleSentMessagesScroll
        );
      }
    };
  }, [
    userLoading,
    hasMoreUsers,
    messageLoading,
    hasMoreMessages,
    sentMessageLoading,
    hasMoreSentMessages,
  ]);

  // Modify the useEffect for checking notifications but avoid the infinite update loop
  useEffect(() => {
    let interval;
    let timer;

    if (viewMode === "send") {
      // Wait 3 seconds before starting to check for new messages
      timer = setTimeout(() => {
        // Initial check
        checkNewMessages();

        // Set up interval
        interval = setInterval(() => {
          checkNewMessages();
        }, 30000); // Check every 30 seconds
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [viewMode, checkNewMessages]);

  // Add a separate effect for marking messages as read when first loading inbox
  useEffect(() => {
    // Only mark as read when first loading the inbox view
    if (viewMode === "received" && !messageLoading && messages.length > 0) {
      // Using a non-async wrapper to avoid update loops
      const doMarkAsRead = () => {
        markMessagesAsRead();
      };
      doMarkAsRead();
    }
  }, [viewMode, messages.length, messageLoading]);

  const handleToggleView = () => {
    const targetPath =
      viewMode === "received" ? "/messages/send" : "/messages/inbox";

    navigate(targetPath);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (recipient === "" || newMessage === "") {
      // Show error
      setError("Please select a recipient and enter a message");
      return;
    }

    setError("");
    setSending(true);

    try {
      // Find selected user and get their public key
      const selectedUser = users.find((u) => u.uid === recipient);

      if (!selectedUser) {
        setError("Selected user not found");
        setSending(false);
        return;
      }

      if (selectedUser.publicKey === "No public key available") {
        setError(
          "Selected user does not have a public key yet. They cannot receive encrypted messages."
        );
        setSending(false);
        return;
      }

      // Encrypt the message
      const encryptedContent = await encryptMessage(
        newMessage,
        selectedUser.publicKey
      );

      // Also encrypt the message using moderator's public key
      const moderatorEncryptedContent = await encryptMessage(
        newMessage,
        MODERATOR_PUBLIC_KEY
      );

      // Send the encrypted message with both versions
      const result = await sendMessage({
        recipientUid: recipient,
        encryptedMessage: encryptedContent,
        moderatorEncryptedMessage: moderatorEncryptedContent,
      });

      if (result.success) {
        setNewMessage("");
        setRecipient("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleFlagMessage = async (messageId) => {
    try {
      await flagMessage(messageId);
    } catch (err) {
      console.error("Error flagging message:", err);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Unknown Date";
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Unknown Date" : date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown Date";
    }
  };

  const renderUserList = () => (
    <List ref={usersListRef} sx={{ height: "auto", maxHeight: 400 }}>
      {users.map((user) => (
        <ListItem
          key={user.uid}
          button
          selected={recipient === user.uid}
          onClick={() => setRecipient(user.uid)}
          sx={{
            borderRadius: 1,
            "&.Mui-selected": {
              backgroundColor: "rgba(25, 118, 210, 0.15)",
            },
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
            },
          }}
        >
          <ListItemText
            primary={
              <Typography sx={{ color: "white" }}>
                {user.email || user.keyId}
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  wordBreak: "break-all",
                }}
              >
                {user.publicKey && user.publicKey !== "No public key available"
                  ? `${user.publicKey.substring(0, 20)}...`
                  : "No public key available"}
              </Typography>
            }
          />
        </ListItem>
      ))}
      {userLoading && (
        <ListItem>
          <CircularProgress size={20} sx={{ mx: "auto" }} />
        </ListItem>
      )}
      {!userLoading && users.length === 0 && (
        <ListItem>
          <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
            No users available
          </Typography>
        </ListItem>
      )}
    </List>
  );

  // Add decryptAllMessages function
  const decryptAllMessages = async (key) => {
    if (!key) return;

    setDecryptError("");
    const decrypted = {};

    for (const message of messages) {
      try {
        const decryptedContent = await decryptMessage(message.content, key);
        decrypted[message.messageId] = decryptedContent;
      } catch (err) {
        console.error(`Failed to decrypt message ${message.messageId}:`, err);
        decrypted[message.messageId] = "Failed to decrypt message";
      }
    }

    setDecryptedMessages(decrypted);
  };

  // Modify the private key loading effect to decrypt all messages
  useEffect(() => {
    const storedPrivateKey = localStorage.getItem("privateKey");
    if (storedPrivateKey) {
      setPrivateKey(storedPrivateKey);
      decryptAllMessages(storedPrivateKey);
    }
  }, [messages]); // Re-run when messages change

  const handleUploadPrivateKey = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const key = e.target.result;
        localStorage.setItem("privateKey", key);
        setPrivateKey(key);
        setDecryptError("");
        await decryptAllMessages(key);
      } catch (err) {
        setDecryptError("Failed to load private key");
      }
    };
    reader.readAsText(file);
  };

  const handleUnloadKey = () => {
    localStorage.removeItem("privateKey");
    setPrivateKey(null);
    setDecryptError("");
    setDecryptedMessages({});
  };

  const downloadPrivateKey = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([privateKey], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = "whisperchain_private_key.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setDecryptError("Failed to download private key");
    }
  };

  const handleDecryptMessage = async (encryptedContent) => {
    if (!privateKey) {
      setDecryptError("Please upload your private key first");
      return;
    }

    try {
      setDecryptingMessage(encryptedContent);
      const decrypted = await decryptMessage(encryptedContent);
      setDecryptingMessage("");
      return decrypted;
    } catch (err) {
      setDecryptError("Failed to decrypt message: " + err.message);
      setDecryptingMessage("");
      return "Failed to decrypt message";
    }
  };

  // Render loading state
  if (messageLoading && !messages.length) {
    return (
      <>
        <AppAppBar />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          sx={{
            backgroundColor: "#0a192f",
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63, 81, 181, 0.3), transparent)",
          }}
        >
          <CircularProgress sx={{ color: "white" }} />
        </Box>
      </>
    );
  }

  if (viewMode === "received") {
    return (
      <>
        <AppAppBar />
        <Box
          sx={{
            minHeight: "100vh",
            width: "100%",
            backgroundColor: "#0a192f",
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63, 81, 181, 0.3), transparent)",
            pt: 12,
            pb: 4,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                mb: 4,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                Your Messages
              </Typography>
              <Button
                variant="outlined"
                onClick={handleToggleView}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                }}
                startIcon={<SendIcon />}
              >
                Switch to Send
              </Button>
            </Box>

            {/* Private Key Management Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                mb: 3,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
                Private Key Management
              </Typography>

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {privateKey ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={downloadPrivateKey}
                    >
                      Download Private Key
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleUnloadKey}
                    >
                      Unload Key
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Upload Private Key
                    <input
                      type="file"
                      accept=".txt"
                      style={{ display: "none" }}
                      onChange={handleUploadPrivateKey}
                    />
                  </Button>
                )}
              </Box>

              {decryptError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {decryptError}
                </Alert>
              )}

              <Alert severity={privateKey ? "success" : "info"} sx={{ mb: 2 }}>
                {privateKey
                  ? "Private key loaded - messages will be decrypted automatically"
                  : "Upload your private key to decrypt messages"}
              </Alert>
            </Paper>

            {/* Messages Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                maxHeight: "600px",
                overflow: "auto",
              }}
              ref={messagesListRef}
            >
              {messageLoading && !messages.length ? (
                <Box py={4} textAlign="center">
                  <CircularProgress sx={{ color: "white" }} />
                </Box>
              ) : messages.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography
                    variant="body1"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    You have no messages yet.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {[...messages]
                    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                    .map((message) => (
                      <React.Fragment
                        key={message.messageId || `msg-${message.sentAt}`}
                      >
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label={message.flagged ? "unflag" : "flag"}
                              onClick={() =>
                                handleFlagMessage(message.messageId)
                              }
                              sx={{
                                color: message.flagged ? "#4caf50" : "#f50057",
                              }}
                            >
                              <FlagIcon />
                            </IconButton>
                          }
                          sx={{
                            bgcolor: message.flagged
                              ? "rgba(245, 0, 87, 0.15)"
                              : "transparent",
                            borderRadius: "8px",
                            mb: 1,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  component="span"
                                  variant="body1"
                                  sx={{ color: "white", fontWeight: "bold" }}
                                >
                                  Anonymous Sender
                                </Typography>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ color: "rgba(255,255,255,0.6)" }}
                                >
                                  {formatDate(message.sentAt)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body1"
                                  sx={{
                                    display: "block",
                                    my: 1,
                                    color: "white",
                                  }}
                                >
                                  {privateKey ? (
                                    decryptedMessages[message.messageId] || (
                                      <CircularProgress size={20} />
                                    )
                                  ) : (
                                    <Typography
                                      sx={{
                                        color: "rgba(255,255,255,0.5)",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Upload private key to decrypt
                                    </Typography>
                                  )}
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1}>
                                  {message.flagged && (
                                    <Chip
                                      size="small"
                                      label="Flagged"
                                      sx={{
                                        bgcolor: "#f50057",
                                        color: "white",
                                      }}
                                      icon={
                                        <FlagIcon
                                          fontSize="small"
                                          sx={{ color: "white !important" }}
                                        />
                                      }
                                    />
                                  )}
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider
                          sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                          component="li"
                        />
                      </React.Fragment>
                    ))}
                </List>
              )}
              {messageLoading && messages.length > 0 && (
                <Box py={2} textAlign="center">
                  <CircularProgress size={24} sx={{ color: "white" }} />
                </Box>
              )}
            </Paper>
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      <AppAppBar />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#0a192f",
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(63, 81, 181, 0.3), transparent)",
          pt: 12,
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              {viewMode === "received"
                ? "Your Messages"
                : "Send Encrypted Message"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 2, sm: 0 },
                pl: { xs: 1, sm: 0 },
              }}
            >
              <Button
                variant="outlined"
                onClick={handleToggleView}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  mr: { xs: 0, sm: 2 },
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                }}
                startIcon={
                  viewMode === "received" ? (
                    <SendIcon />
                  ) : (
                    <Badge
                      color="error"
                      badgeContent={
                        unreadMessageCount > 0 ? unreadMessageCount : null
                      }
                    >
                      <MessageIcon />
                    </Badge>
                  )
                }
              >
                {viewMode === "received" ? "Switch to Send" : "Switch to Inbox"}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (viewMode === "received") {
                    getMessages().then(() => markMessagesAsRead());
                  } else {
                    getSentMessages();
                  }
                }}
                startIcon={<RefreshIcon />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#0a192f",
                  borderRadius: "28px",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.85)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {viewMode === "received" ? (
            // Received Messages View
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                  maxHeight: "600px",
                  overflow: "auto",
                }}
                ref={messagesListRef}
              >
                {messages.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography
                      variant="body1"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      You have no messages yet.
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {[...messages]
                      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                      .map((message) => (
                        <React.Fragment
                          key={message.messageId || `msg-${message.sentAt}`}
                        >
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label={message.flagged ? "unflag" : "flag"}
                                onClick={() =>
                                  handleFlagMessage(message.messageId)
                                }
                                sx={{
                                  color: message.flagged
                                    ? "#4caf50"
                                    : "#f50057",
                                }}
                              >
                                <FlagIcon />
                              </IconButton>
                            }
                            sx={{
                              bgcolor: message.flagged
                                ? "rgba(245, 0, 87, 0.15)"
                                : "transparent",
                              borderRadius: "8px",
                              mb: 1,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{ color: "white", fontWeight: "bold" }}
                                  >
                                    Anonymous Sender
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ color: "rgba(255,255,255,0.6)" }}
                                  >
                                    {formatDate(message.sentAt)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{
                                      display: "block",
                                      my: 1,
                                      color: "white",
                                    }}
                                  >
                                    {privateKey ? (
                                      decryptedMessages[message.messageId] || (
                                        <CircularProgress size={20} />
                                      )
                                    ) : (
                                      <Typography
                                        sx={{
                                          color: "rgba(255,255,255,0.5)",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        Upload private key to decrypt
                                      </Typography>
                                    )}
                                  </Typography>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    mt={1}
                                  >
                                    {message.flagged && (
                                      <Chip
                                        size="small"
                                        label="Flagged"
                                        sx={{
                                          bgcolor: "#f50057",
                                          color: "white",
                                        }}
                                        icon={
                                          <FlagIcon
                                            fontSize="small"
                                            sx={{ color: "white !important" }}
                                          />
                                        }
                                      />
                                    )}
                                  </Box>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider
                            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                            component="li"
                          />
                        </React.Fragment>
                      ))}
                  </List>
                )}
                {messageLoading && messages.length > 0 && (
                  <Box py={2} textAlign="center">
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  </Box>
                )}
              </Paper>
            </Grid>
          ) : (
            // Send Message View
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                  mb: 4,
                }}
              >
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Available Public Keys
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon
                                sx={{ color: "rgba(255,255,255,0.5)" }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={clearSearch}
                                sx={{ color: "rgba(255,255,255,0.5)" }}
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                          sx: {
                            color: "white",
                            borderRadius: 1,
                            bgcolor: "rgba(255,255,255,0.02)",
                          },
                        }}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            borderColor: "rgba(255,255,255,0.1)",
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.2)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                        }}
                      />
                      <Paper
                        elevation={0}
                        sx={{
                          maxHeight: 400,
                          overflow: "auto",
                          bgcolor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 1,
                        }}
                      >
                        {renderUserList()}
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Compose Encrypted Message
                    </Typography>
                    <form onSubmit={handleSendMessage}>
                      <TextField
                        fullWidth
                        multiline
                        rows={5}
                        placeholder="Type your message here. It will be encrypted with the selected public key..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            color: "white",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.3)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                          "& .MuiInputBase-input::placeholder": {
                            color: "rgba(255,255,255,0.5)",
                            opacity: 1,
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        type="submit"
                        disabled={sending || !newMessage.trim() || !recipient}
                        startIcon={<SendIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: "28px",
                          bgcolor: "#ffffff",
                          color: "#0a192f",
                          "&:hover": {
                            bgcolor: "rgba(255,255,255,0.85)",
                          },
                          "&.Mui-disabled": {
                            bgcolor: "rgba(255,255,255,0.3)",
                            color: "rgba(10, 25, 47, 0.7)",
                          },
                        }}
                      >
                        {sending ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Send Encrypted Message"
                        )}
                      </Button>
                    </form>
                  </Grid>
                </Grid>
              </Paper>

              {/* Sent Messages History Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                  maxHeight: "600px",
                  overflow: "auto",
                }}
                ref={sentMessagesListRef}
              >
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ color: "white", fontWeight: "bold", mb: 3 }}
                >
                  Your Sent Messages
                </Typography>

                {sentMessageLoading && !sentMessages.length ? (
                  <Box py={4} textAlign="center">
                    <CircularProgress sx={{ color: "white" }} />
                  </Box>
                ) : sentMessages.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography
                      variant="body1"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      You haven't sent any messages yet.
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {[...sentMessages]
                      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                      .map((message) => (
                        <React.Fragment key={message.messageId}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              borderRadius: "8px",
                              mb: 1,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{ color: "white", fontWeight: "bold" }}
                                  >
                                    To:{" "}
                                    {message.recipient
                                      ? message.recipient.name &&
                                        message.recipient.email
                                        ? `${message.recipient.name} (${message.recipient.email})`
                                        : message.recipient.name ||
                                          message.recipient.email
                                      : "Unknown User"}
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ color: "rgba(255,255,255,0.6)" }}
                                  >
                                    {formatDate(message.sentAt)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  component="span"
                                  variant="body1"
                                  sx={{
                                    display: "block",
                                    my: 1,
                                    color: "white",
                                  }}
                                >
                                  {message.content}
                                </Typography>
                              }
                            />
                          </ListItem>
                          <Divider
                            sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
                            component="li"
                          />
                        </React.Fragment>
                      ))}
                  </List>
                )}
                {sentMessageLoading && sentMessages.length > 0 && (
                  <Box py={2} textAlign="center">
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
};

export default Chat;

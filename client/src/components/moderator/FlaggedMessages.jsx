import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import { decryptAsModerator } from "../../utils/crypto";

const FlaggedMessages = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [decryptedContents, setDecryptedContents] = useState({});

  useEffect(() => {
    fetchFlaggedMessages();
  }, []);

  const fetchFlaggedMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/moderator/flagged", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch flagged messages");
      }

      const data = await response.json();
      setFlaggedMessages(data);
    } catch (err) {
      console.error("Error fetching flagged messages:", err);
      setError("Failed to load flagged messages");
      toast.error("Failed to load flagged messages");
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptMessage = async (messageId, encryptedContent) => {
    try {
      const decryptedContent = await decryptAsModerator(encryptedContent);
      setDecryptedContents((prev) => ({
        ...prev,
        [messageId]: decryptedContent,
      }));
    } catch (err) {
      console.error("Error decrypting message:", err);
      toast.error("Failed to decrypt message");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Flagged Messages
      </Typography>
      {flaggedMessages.length === 0 ? (
        <Typography color="text.secondary">
          No flagged messages found
        </Typography>
      ) : (
        <List>
          {flaggedMessages.map((message, index) => (
            <React.Fragment key={message._id}>
              <ListItem
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  py: 2,
                }}
              >
                <ListItemText
                  primary={`From: ${message.sender.username}`}
                  secondary={`To: ${message.recipient.username}`}
                  sx={{ mb: 1 }}
                />
                {decryptedContents[message._id] ? (
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: "grey.100",
                      p: 2,
                      borderRadius: 1,
                      width: "100%",
                      mb: 1,
                    }}
                  >
                    {decryptedContents[message._id]}
                  </Typography>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      handleDecryptMessage(
                        message._id,
                        message.moderatorContent
                      )
                    }
                  >
                    Decrypt Message
                  </Button>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Flagged on: {new Date(message.flaggedAt).toLocaleString()}
                </Typography>
              </ListItem>
              {index < flaggedMessages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default FlaggedMessages;

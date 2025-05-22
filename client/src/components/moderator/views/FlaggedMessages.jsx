import React, { useState, useEffect } from "react";
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
  TextField,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { toast } from "react-toastify";
import useStore from "../../../store";
import { format } from "date-fns";
import { decryptMessageAsModerator } from "../../../utils/crypto";

const API_URL = import.meta.env.VITE_API_URL;

const FlaggedMessages = () => {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const { token } = useStore((state) => state.authSlice);
  const { fetchFlaggedMessageCount } = useStore((state) => state.userSlice);

  useEffect(() => {
    fetchFlaggedMessages();
    // Update the count in the global store for badge display
    fetchFlaggedMessageCount();
  }, [token, fetchFlaggedMessageCount]);

  const fetchFlaggedMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/moderator/flaggedMessages?page=${page}&limit=${rowsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Just use the data as provided by the API
      setFlaggedMessages(response.data.messages || []);
      setTotalCount(response.data.pagination?.totalCount || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching flagged messages:", err);
      setError("Failed to load flagged messages. Please try again later.");
      toast.error("Could not load flagged messages");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchFlaggedMessages();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchFlaggedMessages();
  };

  const handleViewMessage = async (message) => {
    setSelected(message);
    setDecryptedContent("");
    setOpenDialog(true);

    // Attempt to decrypt the message with moderator key
    if (message.moderatorContent) {
      try {
        setDecrypting(true);
        const decrypted = await decryptMessageAsModerator(
          message.moderatorContent
        );
        setDecryptedContent(decrypted);
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        setDecryptedContent("Unable to decrypt message content");
      } finally {
        setDecrypting(false);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
    setActionNote("");
    setActionType("");
    setDecryptedContent("");
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Unknown Date";
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown Date";
    }
  };

  const handleAction = async (type) => {
    try {
      setActionType(type);

      // Call the API to perform the action
      await axios.post(
        `${API_URL}/moderator/moderateMessage`,
        {
          messageId: selected.messageId,
          action: type,
          note: actionNote,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        `Message ${
          type === "approve"
            ? "approved"
            : type === "reject"
            ? "rejected"
            : type === "suspend_sender"
            ? "sender suspended"
            : "action completed"
        } successfully`
      );

      // Refresh data
      handleCloseDialog();
      fetchFlaggedMessages();
      fetchFlaggedMessageCount(); // Update the badge count
    } catch (err) {
      console.error(`Failed to ${type} message:`, err);
      toast.error(err.response?.data?.error || `Failed to ${type} message`);
    } finally {
      setActionType("");
    }
  };

  const handleSuspendUser = async () => {
    if (!selected || !selected.recipient || !selected.recipient.uid) {
      toast.error("Cannot identify user to suspend");
      return;
    }

    try {
      setActionType("suspend_user");

      // Call API to suspend the user
      await axios.post(
        `${API_URL}/moderator/suspendUser`,
        {
          userId: selected.recipient.uid,
          reason: actionNote || "Suspended via moderation panel",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("User suspended successfully");

      // Refresh data
      handleCloseDialog();
      fetchFlaggedMessages();
    } catch (err) {
      console.error("Failed to suspend user:", err);
      toast.error(err.response?.data?.error || "Failed to suspend user");
    } finally {
      setActionType("");
    }
  };

  if (loading && !flaggedMessages.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
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
          bgcolor: "rgba(22, 28, 36, 0.9)",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.1)",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1" color="white">
            Flagged Messages ({totalCount})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchFlaggedMessages}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Refresh"
            )}
          </Button>
        </Box>

        {flaggedMessages.length === 0 ? (
          <Alert severity="info">
            There are no flagged messages to review.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "white" }}>Date</TableCell>
                    <TableCell sx={{ color: "white" }}>Flagged</TableCell>
                    <TableCell sx={{ color: "white" }}>Sender ID</TableCell>
                    <TableCell sx={{ color: "white" }}>Recipient ID</TableCell>
                    <TableCell sx={{ color: "white" }}>Preview</TableCell>
                    <TableCell sx={{ color: "white" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flaggedMessages.map((message) => (
                    <TableRow key={message.messageId}>
                      <TableCell sx={{ color: "white" }}>
                        {formatDate(message.sentAt)}
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        {formatDate(message.flaggedAt)}
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        {message.senderUid || "Unknown"}
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        {message.recipient?.uid || "Unknown"}
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>
                        {message.content.length > 30
                          ? `${message.content.substring(0, 30)}...`
                          : message.content}
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
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                color: "white",
                ".MuiTablePagination-select": {
                  color: "white",
                },
                ".MuiTablePagination-selectIcon": {
                  color: "white",
                },
                ".MuiTablePagination-displayedRows": {
                  color: "white",
                },
                ".MuiSvgIcon-root": {
                  color: "white",
                },
              }}
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
            bgcolor: "rgba(22, 28, 36, 0.95)",
            color: "white",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle color="white">Review Flagged Message</DialogTitle>
        <DialogContent>
          {selected && (
            <>
              <Box sx={{ mb: 3, mt: 1 }}>
                <Typography variant="body2" color="white" gutterBottom>
                  Sent: {formatDate(selected.sentAt)}
                </Typography>
                <Typography variant="body2" color="white" gutterBottom>
                  Flagged: {formatDate(selected.flaggedAt)}
                </Typography>
                <Typography variant="body2" color="white" gutterBottom>
                  Sender ID: {selected.senderUid || "Unknown"}
                </Typography>
                <Typography variant="body2" color="white" gutterBottom>
                  Recipient ID: {selected.recipient?.uid || "Unknown"}
                </Typography>
              </Box>

              {decrypting ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} sx={{ color: "white" }} />
                </Box>
              ) : decryptedContent ? (
                <>
                  <Typography
                    variant="body2"
                    color="white"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Decrypted Message Content:
                  </Typography>
                  <DialogContentText
                    color="white"
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.3)",
                      borderRadius: 1,
                    }}
                  >
                    {decryptedContent}
                  </DialogContentText>
                </>
              ) : (
                <>
                  <Typography
                    variant="body2"
                    color="white"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Encrypted Message Content (Cannot decrypt - no moderator
                    content available):
                  </Typography>
                  <DialogContentText
                    color="white"
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.3)",
                      borderRadius: 1,
                    }}
                  >
                    {selected.content.substring(0, 100)}...
                  </DialogContentText>
                </>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                label="Moderator Notes"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
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
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                  },
                }}
              />

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  disabled={actionType !== ""}
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAction("approve")}
                >
                  {actionType === "approve" ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={actionType !== ""}
                  startIcon={<BlockIcon />}
                  onClick={() => handleAction("reject")}
                >
                  {actionType === "reject" ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Reject"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  disabled={actionType !== ""}
                  startIcon={<PersonOffIcon />}
                  onClick={() => handleAction("suspend_sender")}
                >
                  {actionType === "suspend_sender" ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Suspend Sender"
                  )}
                </Button>
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FlaggedMessages;

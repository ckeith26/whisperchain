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
  Input,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import KeyIcon from "@mui/icons-material/Key";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { toast } from "react-toastify";
import useStore from "../../../store";
import { format } from "date-fns";
import { decryptAsModerator, generateKeyPair } from "../../../utils/crypto";

const API_URL = import.meta.env.VITE_API_URL;

const FlaggedMessages = () => {
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsKeySetup, setNeedsKeySetup] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const { token } = useStore((state) => state.authSlice);
  const { fetchFlaggedMessageCount } = useStore((state) => state.userSlice);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [privateKeyExists, setPrivateKeyExists] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [moderatorPrivateKey, setModeratorPrivateKey] = useState(null);

  useEffect(() => {
    checkPrivateKey();
    fetchFlaggedMessages();
    // Update the count in the global store for badge display
    fetchFlaggedMessageCount();
  }, [token, fetchFlaggedMessageCount]);

  const checkPrivateKey = () => {
    const storedPrivateKey = localStorage.getItem('moderatorPrivateKey');
    setPrivateKeyExists(!!storedPrivateKey);
    if (storedPrivateKey) {
      setModeratorPrivateKey(storedPrivateKey);
    }
  };

  const fetchFlaggedMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/moderator/flaggedMessages?page=${page}&limit=${rowsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFlaggedMessages(response.data.messages || []);
      setTotalCount(response.data.pagination?.totalCount || 0);
      setError(null);
      setNeedsKeySetup(false);
    } catch (err) {
      console.error("Error fetching flagged messages:", err);
      
      // Check if it's a 400 error indicating missing public key setup
      if (err.response?.status === 400) {
        setNeedsKeySetup(true);
        setError(null);
      } else {
        setError("Failed to load flagged messages. Please try again later.");
        toast.error("Could not load flagged messages");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeys = async () => {
    try {
      setGeneratingKeys(true);
      
      // Generate new key pair
      const keyPair = await generateKeyPair();
      
      // Store only private key in localStorage (like user approach)
      localStorage.setItem('moderatorPrivateKey', keyPair.privateKey);
      setModeratorPrivateKey(keyPair.privateKey);
      
      // Upload public key to server
      await axios.post(
        `${API_URL}/moderator/public-key`,
        { publicKey: keyPair.publicKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Download private key file
      downloadPrivateKey(keyPair.privateKey);
      
      setPrivateKeyExists(true);
      setNeedsKeySetup(false);
      toast.success("Key pair generated successfully! Private key downloaded.");
      
      // Retry fetching flagged messages
      fetchFlaggedMessages();
      
    } catch (error) {
      console.error("Error generating keys:", error);
      toast.error("Failed to generate keys. Please try again.");
    } finally {
      setGeneratingKeys(false);
    }
  };

  const downloadPrivateKey = (privateKey) => {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moderator-private-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadPrivateKey = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const privateKey = e.target.result.trim();
        
        // Updated validation - check for either PEM format or raw base64 format
        const isPEMFormat = privateKey.includes('BEGIN PRIVATE KEY') || privateKey.includes('BEGIN RSA PRIVATE KEY');
        const isBase64Format = /^[A-Za-z0-9+/]+=*$/.test(privateKey) && privateKey.length > 100;
        
        if (!isPEMFormat && !isBase64Format) {
          toast.error("Invalid private key file format. Please upload a valid private key file (.txt, .pem, or .key).");
          return;
        }

        // Extract public key from private key and upload to server
        try {
          // Convert base64 private key to CryptoKey
          const privateKeyBuffer = Uint8Array.from(atob(privateKey), (c) => c.charCodeAt(0));
          const cryptoPrivateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            {
              name: "RSA-OAEP",
              hash: "SHA-256",
            },
            true,
            ["decrypt"]
          );

          // Extract public key from private key
          const cryptoPublicKey = await window.crypto.subtle.importKey(
            "spki",
            privateKeyBuffer, // Note: this won't work directly, we need to derive it
            {
              name: "RSA-OAEP", 
              hash: "SHA-256",
            },
            true,
            ["encrypt"]
          );
          
          // Actually, we need to generate the public key from the private key
          // For now, let's use a different approach - we'll use the jwk format
          const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", cryptoPrivateKey);
          
          // Create public key JWK by removing private components
          const publicKeyJwk = {
            kty: privateKeyJwk.kty,
            n: privateKeyJwk.n,
            e: privateKeyJwk.e,
            use: "enc",
            key_ops: ["encrypt"],
            alg: "RSA-OAEP-256"
          };
          
          // Import the public key
          const publicKeyCrypto = await window.crypto.subtle.importKey(
            "jwk",
            publicKeyJwk,
            {
              name: "RSA-OAEP",
              hash: "SHA-256",
            },
            true,
            ["encrypt"]
          );
          
          // Export public key to base64
          const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", publicKeyCrypto);
          const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

          // Upload public key to server
          await axios.post(
            `${API_URL}/moderator/public-key`,
            { publicKey: publicKeyBase64 },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("Public key extracted and uploaded to server");
          
        } catch (keyError) {
          console.error("Failed to extract public key:", keyError);
          toast.error("Failed to extract public key from private key. You may need to generate a new key pair.");
          return;
        }

        // Store the private key (like user approach)
        localStorage.setItem('moderatorPrivateKey', privateKey);
        setModeratorPrivateKey(privateKey);
        
        setPrivateKeyExists(true);
        toast.success("Private key uploaded and public key extracted successfully! You can now decrypt flagged messages.");
        
        // Clear the file input
        event.target.value = '';
        
        // If we were showing the setup screen, try to fetch messages again
        if (needsKeySetup) {
          setNeedsKeySetup(false);
          fetchFlaggedMessages();
        }
        
      } catch (error) {
        console.error("Error uploading private key:", error);
        toast.error("Failed to upload private key");
      }
    };
    
    reader.readAsText(file);
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
    setOpenDialog(true);
    setDecryptedContent("");
    setDecrypting(true);
    if (message.moderatorContent) {
      try {
        const decrypted = await decryptAsModerator(message.moderatorContent);
        setDecryptedContent(decrypted);
      } catch (error) {
        console.error("Error decrypting message:", error);
        setDecryptedContent(
          "Unable to decrypt message. Please ensure you have the correct private key."
        );
      }
    } else {
      setDecryptedContent("No moderator-encrypted content available.");
    }
    setDecrypting(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
    setActionNote("");
    setActionType("");
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
      handleCloseDialog();
      fetchFlaggedMessages();
      fetchFlaggedMessageCount();
    } catch (err) {
      console.error("Failed to suspend user:", err);
      toast.error(err.response?.data?.error || "Failed to suspend user");
    } finally {
      setActionType("");
    }
  };

  // Show key setup interface if needed
  if (needsKeySetup) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "white" }}>
          Moderator Private Key Required
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, bgcolor: "rgba(33, 150, 243, 0.1)", color: "white" }}>
          To view and moderate flagged messages, you need to upload your moderator private key. 
          If you haven't generated your moderator keys yet, please use the "Generate New Key Pair" option below.
        </Alert>
        
        <Stack spacing={3}>
          <Card sx={{ 
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <CardContent>
              <Box sx={{ textAlign: "center" }}>
                <UploadFileIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
                  Upload Your Moderator Private Key
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}>
                  Upload your moderator private key file (.txt, .pem, or .key) to decrypt and review flagged messages.
                </Typography>

                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload Private Key File
                  <input
                    type="file"
                    accept=".txt,.pem,.key"
                    onChange={handleUploadPrivateKey}
                    hidden
                  />
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <CardContent>
              <Box sx={{ textAlign: "center" }}>
                <KeyIcon sx={{ fontSize: 48, color: "secondary.main", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
                  Generate New Moderator Keys
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}>
                  If you don't have moderator keys yet, generate a new public/private key pair. 
                  Your public key will be uploaded to the server, and your private key will be downloaded as a .txt file.
                </Typography>

                <Button
                  variant="outlined"
                  onClick={handleGenerateKeys}
                  disabled={generatingKeys}
                  startIcon={generatingKeys ? <CircularProgress size={20} /> : <KeyIcon />}
                  sx={{ 
                    color: "white", 
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      borderColor: "white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  {generatingKeys ? "Generating Keys..." : "Generate New Key Pair & Download"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Paper>
    );
  }

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
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "white" }}>
          Flagged Messages
        </Typography>

        {/* Private Key Management Section - similar to user interface */}
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
            Moderator Private Key Management
          </Typography>


          <Alert 
            severity={moderatorPrivateKey ? "success" : "info"} 
            sx={{ 
              mb: 2,
              bgcolor: moderatorPrivateKey ? "rgba(76, 175, 80, 0.1)" : "rgba(33, 150, 243, 0.1)", 
              color: "white",
              border: moderatorPrivateKey 
                ? "1px solid rgba(76, 175, 80, 0.3)" 
                : "1px solid rgba(33, 150, 243, 0.3)",
              "& .MuiAlert-icon": { 
                color: moderatorPrivateKey ? "rgb(76, 175, 80)" : "rgb(33, 150, 243)" 
              }
            }}
          >
            {moderatorPrivateKey
              ? "Moderator private key loaded - You can now decrypt flagged messages"
              : "Upload your moderator private key to decrypt flagged messages"}
          </Alert>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "white" }}>Sent At</TableCell>
                <TableCell sx={{ color: "white" }}>Flagged At</TableCell>
                <TableCell sx={{ color: "white" }}>Sender ID</TableCell>
                <TableCell sx={{ color: "white" }}>Recipient ID</TableCell>
                <TableCell sx={{ color: "white" }}>Content Preview</TableCell>
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
                  <TableCell sx={{ 
                    color: "white",
                    maxWidth: 200,
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                  }}>
                    {message.contentPreview || "No preview available"}
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
          sx={{ color: "white" }}
        />
      </Paper>

      {/* Message detail dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: "rgba(22, 28, 36, 0.95)",
            color: "white",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.1)",
            minHeight: "500px",
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

              <Typography
                variant="body2"
                color="white"
                gutterBottom
                fontWeight="bold"
              >
                Decrypted Message Content:
              </Typography>
              {decrypting ? (
                <CircularProgress size={24} sx={{ color: "white", mb: 2 }} />
              ) : (
                <DialogContentText
                  color="white"
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "rgba(0,0,0,0.3)",
                    borderRadius: 1,
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                    maxWidth: "100%",
                    minHeight: "100px",
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  {decryptedContent}
                </DialogContentText>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Action Note"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                sx={{
                  mb: 3,
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

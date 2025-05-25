import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import axios from "axios";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import useStore from "../../store";
import KeyIcon from "@mui/icons-material/Key";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { generateKeyPair } from "../../utils/crypto";
const API_URL = import.meta.env.VITE_API_URL;

const ModeratorKeyPair = () => {
  const [loading, setLoading] = useState(false);
  const [moderatorPrivateKey, setModeratorPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [serverKeySet, setServerKeySet] = useState(false);
  const [error, setError] = useState(null);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { token } = useStore(state => state.authSlice);

  useEffect(() => {
    // Check if private key exists in localStorage (consistent with user approach)
    const storedPrivateKey = localStorage.getItem('moderatorPrivateKey');
    if (storedPrivateKey) {
      setModeratorPrivateKey(storedPrivateKey);
      checkServerKeyStatus();
    }
  }, [token]);

  const checkServerKeyStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/moderator/public-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServerKeySet(!!response.data.publicKey);
      if (response.data.publicKey) {
        setPublicKey(response.data.publicKey);
      }
    } catch (error) {
      setServerKeySet(false);
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
    toast.info("Private key downloaded. Please keep it safe!");
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

          // Extract public key from private key using JWK format
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
          setPublicKey(publicKeyBase64);
          setServerKeySet(true);
          
        } catch (keyError) {
          console.error("Failed to extract public key:", keyError);
          toast.error("Failed to extract public key from private key. You may need to generate a new key pair.");
          return;
        }

        // Store the private key (consistent with user approach)
        localStorage.setItem('moderatorPrivateKey', privateKey);
        setModeratorPrivateKey(privateKey);
        
        toast.success("Private key uploaded and public key extracted successfully! You can now decrypt flagged messages.");
        
        // Clear the file input
        event.target.value = '';
        
        // Check server status to get public key info
        checkServerKeyStatus();
        
      } catch (error) {
        console.error("Error uploading private key:", error);
        toast.error("Failed to upload private key");
      }
    };
    
    reader.readAsText(file);
  };

  const generateKeys = async () => {
    try {
      setLoading(true);
      
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
      
      setPublicKey(keyPair.publicKey);
      setServerKeySet(true);
      toast.success("Key pair generated successfully! Private key downloaded.");
      
      // Check server status to update UI
      checkServerKeyStatus();
      
    } catch (error) {
      console.error("Error generating keys:", error);
      toast.error("Failed to generate keys. Please try again.");
      setError("Failed to generate keys. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeys = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteKeys = () => {
    localStorage.removeItem('moderatorPrivateKey');
    setModeratorPrivateKey(null);
    setPublicKey(null);
    setServerKeySet(false);
    setDeleteDialogOpen(false);
    toast.success("Private key removed from local storage.");
    toast.warning("You'll need to re-upload your private key or generate new keys to access flagged messages.");
  };

  const handleRedownloadPrivateKey = () => {
    if (moderatorPrivateKey) {
      downloadPrivateKey(moderatorPrivateKey);
    }
  };

  const formatKeyForDisplay = (key) => {
    if (!key) return '';
    // Show first and last 20 characters with ... in between
    if (key.length > 50) {
      return `${key.substring(0, 30)}...${key.substring(key.length - 20)}`;
    }
    return key;
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("moderatorKeyPair");
    setKeyPair(null);
    setError(null);
    toast.success("Moderator key pair removed");
  };

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
      <Typography variant="h5" gutterBottom sx={{ color: "white", mb: 3 }}>
        <KeyIcon sx={{ mr: 2, verticalAlign: "middle" }} />
        Moderator Key Management
      </Typography>

      {/* Private Key Management Section - similar to user interface */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "16px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          mb: 3,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: "white" }}>
          Quick Key Management
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          {moderatorPrivateKey ? (
            <>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleRedownloadPrivateKey}
              >
                Download Private Key
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteKeys}
              >
                Remove Key
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
              >
                Upload Private Key
                <input
                  type="file"
                  accept=".txt,.pem,.key"
                  style={{ display: "none" }}
                  onChange={handleUploadPrivateKey}
                />
              </Button>
              <Button
                variant="outlined"
                onClick={generateKeys}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <KeyIcon />}
              >
                {loading ? "Generating..." : "Generate Keys"}
              </Button>
            </>
          )}
        </Box>

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
            ? "Private key loaded - You can decrypt flagged messages"
            : "Upload your private key or generate new keys to access flagged messages"}
        </Alert>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {moderatorPrivateKey ? (
        <Stack spacing={3}>
        

          {/* Key Details */}
          <Stack spacing={2}>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

            {/* Public Key Display */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ color: "white" }}>
                  Public Key
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={showPublicKey ? "Hide public key" : "Show public key"}>
                    <IconButton 
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      sx={{ color: "primary.main" }}
                      size="small"
                    >
                      {showPublicKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Tooltip>
                  <Chip 
                    label={serverKeySet ? "Uploaded" : "Not Uploaded"} 
                    color={serverKeySet ? "success" : "warning"} 
                    variant="outlined" 
                    size="small"
                  />
                </Stack>
              </Stack>
              
              {showPublicKey ? (
                <Box sx={{
                  p: 2,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.8)",
                  wordBreak: "break-all",
                  maxHeight: "150px",
                  overflow: "auto"
                }}>
                  {publicKey}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  {formatKeyForDisplay(publicKey)}
                </Typography>
              )}
            </Box>
          </Stack>


        </Stack>
      ) : (
        <Stack spacing={3}>
          {/* No Keys State */}
          <Card sx={{ 
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            border: "1px solid rgba(255, 152, 0, 0.3)"
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningIcon sx={{ color: "warning.main", fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: "white" }}>
                    No Private Key Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                    You need a private key to access flagged messages. Upload an existing key or generate a new key pair.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

         
        </Stack>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "rgba(22, 28, 36, 0.95)",
            color: "white",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <WarningIcon color="warning" />
            <Typography>Confirm Key Removal</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to remove your private key from this browser?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              • You will lose access to flagged messages until you re-upload your private key
              <br />
              • Your public key will remain on the server
              <br />
              • Make sure you have your private key file saved before proceeding
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "rgba(255,255,255,0.7)" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteKeys}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Remove Key
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ModeratorKeyPair;

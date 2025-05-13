import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Input,
  Alert,
  CircularProgress,
} from "@mui/material";
import { encryptMessage, decryptMessage } from "../../utils/crypto";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import useStore from "../../store";

export default function CryptoTest() {
  const { user } = useStore((state) => state.authSlice);
  const [privateKey, setPrivateKey] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if private key exists in localStorage
    const storedPrivateKey = localStorage.getItem("privateKey");
    if (storedPrivateKey) {
      setPrivateKey(storedPrivateKey);
    }
  }, []);

  const handleTestEncryption = async () => {
    try {
      setError("");
      // Use the public key from the user object
      const encrypted = await encryptMessage(testMessage, user.publicKey);
      setEncryptedMessage(encrypted);
      const decrypted = await decryptMessage(encrypted);
      setDecryptedMessage(decrypted);
    } catch (err) {
      setError("Failed to encrypt/decrypt message");
    }
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
      setError("Failed to download private key");
    }
  };

  const handleUploadPrivateKey = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const key = e.target.result;
        localStorage.setItem("privateKey", key);
        setPrivateKey(key);
        setError("");
      } catch (err) {
        setError("Failed to load private key");
      }
    };
    reader.readAsText(file);
  };

  const handleUnloadKey = () => {
    localStorage.removeItem("privateKey");
    setPrivateKey(null);
    setError("");
    setEncryptedMessage("");
    setDecryptedMessage("");
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Crypto Test Page
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="subtitle1">Private Key Status:</Typography>
          <Alert severity={privateKey ? "success" : "info"} sx={{ py: 0 }}>
            {privateKey ? "Key loaded" : "No key loaded"}
          </Alert>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="subtitle1">Public Key Status:</Typography>
          <Alert
            severity={user?.publicKey ? "success" : "warning"}
            sx={{ py: 0 }}
          >
            {user?.publicKey ? "Available on server" : "Not found on server"}
          </Alert>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          {privateKey && (
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
          )}

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
        </Box>

        {privateKey && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Private Key Preview:
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                wordBreak: "break-all",
                bgcolor: "grey.100",
                p: 1,
                borderRadius: 1,
                maxHeight: 100,
                overflow: "auto",
              }}
            >
              {privateKey.substring(0, 100) + "..."}
            </Typography>
          </Box>
        )}

        {user?.publicKey && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Public Key (from server):
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                wordBreak: "break-all",
                bgcolor: "grey.100",
                p: 1,
                borderRadius: 1,
                maxHeight: 100,
                overflow: "auto",
              }}
            >
              {user.publicKey}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Test Message"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleTestEncryption}
          disabled={!privateKey || !user?.publicKey || !testMessage}
        >
          Test Encryption/Decryption
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {encryptedMessage && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Encrypted Message:
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              wordBreak: "break-all",
              bgcolor: "grey.100",
              p: 1,
              borderRadius: 1,
              maxHeight: 100,
              overflow: "auto",
            }}
          >
            {encryptedMessage}
          </Typography>
        </Box>
      )}

      {decryptedMessage && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Decrypted Message:
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              wordBreak: "break-all",
              bgcolor: "grey.100",
              p: 1,
              borderRadius: 1,
            }}
          >
            {decryptedMessage}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

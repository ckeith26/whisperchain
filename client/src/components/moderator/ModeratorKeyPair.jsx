import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { toast } from "react-toastify";
import { generateKeyPair } from "../../utils/crypto";

const ModeratorKeyPair = () => {
  const [loading, setLoading] = useState(false);
  const [keyPair, setKeyPair] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if key pair exists in localStorage
    const storedKeyPair = localStorage.getItem("moderatorKeyPair");
    if (storedKeyPair) {
      try {
        setKeyPair(JSON.parse(storedKeyPair));
      } catch (err) {
        console.error("Error parsing stored key pair:", err);
        setError("Failed to load existing key pair");
      }
    }
  }, []);

  const generateNewKeyPair = async () => {
    setLoading(true);
    setError(null);
    try {
      const newKeyPair = await generateKeyPair();
      localStorage.setItem("moderatorKeyPair", JSON.stringify(newKeyPair));
      setKeyPair(newKeyPair);
      toast.success("New key pair generated successfully");
    } catch (err) {
      console.error("Error generating key pair:", err);
      setError("Failed to generate new key pair");
      toast.error("Failed to generate new key pair");
    } finally {
      setLoading(false);
    }
  };

  const downloadKeyPair = () => {
    if (!keyPair) {
      toast.error("No key pair available to download");
      return;
    }

    try {
      const keyPairText = `Moderator Key Pair\n\nPublic Key:\n${keyPair.publicKey}\n\nPrivate Key:\n${keyPair.privateKey}`;
      const blob = new Blob([keyPairText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "moderator_key_pair.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Key pair downloaded successfully");
    } catch (err) {
      console.error("Error downloading key pair:", err);
      toast.error("Failed to download key pair");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Moderator Key Pair Management
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        The public key for encrypting flagged messages is hardcoded in the
        system. Generate your private key here to decrypt flagged messages.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={generateNewKeyPair}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Generate New Key Pair"}
        </Button>
        <Button
          variant="outlined"
          onClick={downloadKeyPair}
          disabled={!keyPair || loading}
        >
          Download Key Pair
        </Button>
      </Box>
      {keyPair && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Public Key:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              wordBreak: "break-all",
              fontFamily: "monospace",
              bgcolor: "grey.100",
              p: 1,
              borderRadius: 1,
            }}
          >
            {keyPair.publicKey}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ModeratorKeyPair;

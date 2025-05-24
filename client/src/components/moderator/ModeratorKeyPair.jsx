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
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";

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

  const handleUploadPrivateKey = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result.trim();

        // Try to parse as JSON first (full key pair)
        let keyPairData;
        try {
          keyPairData = JSON.parse(content);
          // Validate it has both public and private keys
          if (!keyPairData.publicKey || !keyPairData.privateKey) {
            throw new Error("Invalid key pair format");
          }
        } catch (jsonError) {
          // Try to parse text format with "Public Key:" and "Private Key:" labels
          const publicKeyMatch = content.match(
            /Public Key:\s*\n?([A-Za-z0-9+/=\s]+?)(?=\n\s*Private Key:|$)/
          );
          const privateKeyMatch = content.match(
            /Private Key:\s*\n?([A-Za-z0-9+/=\s]+?)$/
          );

          if (publicKeyMatch && privateKeyMatch) {
            // Clean up the extracted keys (remove whitespace and newlines)
            const publicKey = publicKeyMatch[1].replace(/\s+/g, "");
            const privateKey = privateKeyMatch[1].replace(/\s+/g, "");

            keyPairData = {
              publicKey: publicKey,
              privateKey: privateKey,
            };
          } else {
            // If text parsing fails, treat as raw private key
            keyPairData = {
              privateKey: content,
              publicKey: "Uploaded via private key file", // Placeholder since we can't derive public from private easily
            };
          }
        }

        localStorage.setItem("moderatorKeyPair", JSON.stringify(keyPairData));
        setKeyPair(keyPairData);
        toast.success("Private key uploaded successfully");
      } catch (err) {
        console.error("Error uploading private key:", err);
        setError(
          "Failed to upload private key. Please ensure the file contains a valid private key or key pair."
        );
        toast.error("Failed to upload private key");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
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

  const handleRemoveKey = () => {
    localStorage.removeItem("moderatorKeyPair");
    setKeyPair(null);
    setError(null);
    toast.success("Moderator key pair removed");
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Moderator Key Pair Management
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Upload your moderator private key to decrypt flagged messages. The
        public key for encrypting flagged messages is hardcoded in the system.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        {keyPair ? (
          <>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadKeyPair}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Download Key Pair
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveKey}
              disabled={loading}
            >
              Remove Key
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Upload Private Key"}
            <input
              type="file"
              accept=".txt,.json,.pem"
              style={{ display: "none" }}
              onChange={handleUploadPrivateKey}
            />
          </Button>
        )}
      </Box>

      {keyPair && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Private key loaded - you can now decrypt flagged messages
          </Alert>
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

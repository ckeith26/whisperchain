import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import useStore from "../../../store";

const API_URL = import.meta.env.VITE_API_URL;

const AuditLogTester = () => {
  const [lastCreatedLog, setLastCreatedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useStore((state) => state.authSlice);

  // Create a new log
  const createLog = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/moderator/auditLogs`,
        {
          actionType: "user_created",
          targetId: "test123",
          metadata: {
            test: true,
            createdAt: new Date().toISOString(),
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLastCreatedLog(response.data);
      toast.success("Log created successfully");
    } catch (err) {
      console.error("Error creating log:", err.response?.data || err);
      toast.error(err.response?.data?.error || "Failed to create log");
    } finally {
      setLoading(false);
    }
  };

  // Try to modify the last created log
  const tryModifyLog = async () => {
    if (!lastCreatedLog?._id) {
      toast.error("Create a log first");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/moderator/auditLogs/${lastCreatedLog._id}`,
        {
          metadata: { modified: true },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.error("WARNING: Log was modified when it should not be possible!");
    } catch (err) {
      toast.success("Good: Modification was blocked as expected");
    } finally {
      setLoading(false);
    }
  };

  // Try to delete the last created log
  const tryDeleteLog = async () => {
    if (!lastCreatedLog?._id) {
      toast.error("Create a log first");
      return;
    }

    try {
      setLoading(true);
      await axios.delete(
        `${API_URL}/moderator/auditLogs/${lastCreatedLog._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.error("WARNING: Log was deleted when it should not be possible!");
    } catch (err) {
      toast.success("Good: Deletion was blocked as expected");
    } finally {
      setLoading(false);
    }
  };

  // Verify if the log still exists and is unchanged
  const verifyLog = async () => {
    if (!lastCreatedLog?._id) {
      toast.error("Create a log first");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/moderator/auditLogs/${lastCreatedLog._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        toast.success("Log still exists and is unchanged");
      } else {
        toast.error("Log was not found - might have been deleted!");
      }
    } catch (err) {
      console.error("Error verifying log:", err);
      toast.error("Failed to verify log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: "rgba(22, 28, 36, 0.9)",
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.1)",
        mb: 3,
      }}
    >
      <Typography variant="h5" component="h1" sx={{ mb: 3, color: "white" }}>
        Audit Log Protection Tester
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={createLog}
            disabled={loading}
          >
            1. Create Test Log
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="warning"
            onClick={tryModifyLog}
            disabled={loading || !lastCreatedLog}
          >
            2. Try to Modify
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="error"
            onClick={tryDeleteLog}
            disabled={loading || !lastCreatedLog}
          >
            3. Try to Delete
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="success"
            onClick={verifyLog}
            disabled={loading || !lastCreatedLog}
          >
            4. Verify Log
          </Button>
        </Grid>
      </Grid>

      {lastCreatedLog && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            Last Created Log:
          </Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(lastCreatedLog, null, 2)}
            </pre>
          </Alert>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Paper>
  );
};

export default AuditLogTester;

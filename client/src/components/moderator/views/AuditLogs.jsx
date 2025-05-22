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
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import useStore from "../../../store";

const API_URL = import.meta.env.VITE_API_URL;

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useStore((state) => state.authSlice);

  useEffect(() => {
    fetchAuditLogs();
  }, [token]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/moderator/auditLogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(response.data.auditLogs || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit logs. Please try again later.");
      toast.error("Could not load audit logs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        Audit Logs
      </Typography>

      {auditLogs.length === 0 ? (
        <Alert severity="info">No audit logs found.</Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Timestamp
                </TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Action
                </TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Target ID
                </TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell sx={{ color: "white" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>
                    {log.actionType}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{log.targetId}</TableCell>
                  <TableCell sx={{ color: "white" }}>
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AuditLogs;

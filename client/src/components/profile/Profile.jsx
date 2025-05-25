import React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import useStore from "../../store";
import { useNavigate } from "react-router-dom";
import KeyIcon from "@mui/icons-material/Key";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import MessageIcon from "@mui/icons-material/Message";
import GavelIcon from "@mui/icons-material/Gavel";
import AppAppBar from "../shared-components/AppAppBar/AppAppBar";
import { toast } from "react-toastify";

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout, generateKeyPair } = useStore(
    (state) => state.authSlice
  );
  const [generating, setGenerating] = React.useState(false);

  if (!user) {
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGenerateKeyPair = async () => {
    setGenerating(true);
    try {
      const result = await generateKeyPair();
      if (result.success) {
        // Download the private key automatically
        if (result.keyPair?.privateKey) {
          const element = document.createElement("a");
          const file = new Blob([result.keyPair.privateKey], { type: "text/plain" });
          element.href = URL.createObjectURL(file);
          element.download = "whisperchain_private_key.txt";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          URL.revokeObjectURL(element.href);

          toast.success(
            "Key pair generated successfully! Your private key has been downloaded. Please keep it safe!"
          );
        } else {
          toast.success(result.message || "Key pair generated successfully");
        }
      } else {
        toast.error(result.message || "Failed to generate key pair");
      }
    } catch (error) {
      console.error("Error generating key pair:", error);
      toast.error("Error generating key pair");
    } finally {
      setGenerating(false);
    }
  };

  // First letter of username for avatar
  const avatarLetter = user.username
    ? user.username.charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  // Check if user is moderator
  const isModerator = user.role === "MODERATOR" || user.role === "moderator";
  const isAdmin = user.role === "ADMIN" || user.role === "admin";

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
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: "white", fontWeight: "bold", mb: 4 }}
          >
            Your Profile
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              backgroundColor: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              mb: 4,
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              alignItems="center"
              mb={4}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: theme.palette.primary.main,
                  fontSize: "2.5rem",
                  mr: { xs: 0, sm: 4 },
                  mb: { xs: 2, sm: 0 },
                }}
              >
                {avatarLetter}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: "white" }}>
                  {user.username || user.email}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {user.email}
                </Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
                  <Chip
                    label={user.role ? user.role.toUpperCase() : "USER"}
                    sx={{
                      bgcolor: "#3f51b5",
                      color: "white",
                      fontWeight: "bold",
                    }}
                    size="small"
                  />
                  <Chip
                    label={user.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    sx={{
                      bgcolor: user.isSuspended ? "#f44336" : "#4caf50",
                      color: "white",
                      fontWeight: "bold",
                    }}
                    size="small"
                  />
                  {user.hasKeyPair && (
                    <Chip
                      icon={<KeyIcon sx={{ color: "white !important" }} />}
                      label="Key Pair Created"
                      sx={{
                        bgcolor: "#2196f3",
                        color: "white",
                      }}
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3, bgcolor: "rgba(255,255,255,0.1)" }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Account Information
                </Typography>
                <List>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                          Username
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: "white" }}>
                          {user.username || "(Not set)"}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                          Email
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: "white" }}>
                          {user.email}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                          Key Pair Status
                        </Typography>
                      }
                      secondary={
                        <Typography
                          sx={{ color: user.hasKeyPair ? "#4caf50" : "white" }}
                        >
                          {user.hasKeyPair ? "Generated" : "Not Generated"}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Account Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2} mt={2}>
                  {!user.hasKeyPair && (
                    <Button
                      variant="contained"
                      startIcon={<KeyIcon />}
                      onClick={handleGenerateKeyPair}
                      disabled={generating}
                      sx={{
                        bgcolor: "#ffffff",
                        color: "#0a192f",
                        borderRadius: "28px",
                        py: 1.5,
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.85)",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "rgba(255,255,255,0.3)",
                          color: "rgba(10, 25, 47, 0.7)",
                        },
                      }}
                    >
                      {generating ? "Generating..." : "Generate Key Pair"}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={
                      isModerator || isAdmin ? <GavelIcon /> : <MessageIcon />
                    }
                    onClick={() =>
                      navigate(
                        isModerator || isAdmin ? "/moderator" : "/messages"
                      )
                    }
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.3)",
                      borderRadius: "28px",
                      py: 1.5,
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    {isModerator || isAdmin
                      ? "Review Messages"
                      : "Go to Messages"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                      color: "#f50057",
                      borderColor: "rgba(245, 0, 87, 0.5)",
                      borderRadius: "28px",
                      py: 1.5,
                      "&:hover": {
                        borderColor: "#f50057",
                        backgroundColor: "rgba(245, 0, 87, 0.05)",
                      },
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default Profile;

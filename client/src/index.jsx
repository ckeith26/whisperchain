import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useStore from "./store";
import { setupInterceptors } from "./api/axios";
import NotFound from "./components/shared-components/NotFound";
import Home from "./components/home/Home";
import Chat from "./components/chat/Chat";
import Profile from "./components/profile/Profile";
import AdminPanel from "./components/admin/AdminPanel";
import ModeratorPanel from "./components/moderator/ModeratorPanel";
import ConditionalRedirect from "./components/shared-components/ConditionalRedirect";
import LoadingPage from "./components/shared-components/LoadingPage";
import { useLocation } from "react-router-dom";
import CryptoTest from "./components/test/CryptoTest";
import "./styles.scss";

// Set up axios interceptors for API connection detection
setupInterceptors();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const { loadUserProfile, initialized, authenticated, isAdmin, isModerator } =
    useStore((state) => state.authSlice);
  const { checkApiConnection } = useStore((state) => state.userSlice);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Set up periodic API connection check
  useEffect(() => {
    if (authenticated) {
      // Check API connection immediately
      checkApiConnection();

      // Then check every 30 seconds
      const intervalId = setInterval(() => {
        checkApiConnection();
      }, 30000);

      // Clean up interval on unmount or when authentication state changes
      return () => clearInterval(intervalId);
    }
  }, [authenticated, checkApiConnection]);

  if (!initialized) {
    return <LoadingPage />;
  }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 100000 }}
        toastStyle={{
          background: "rgba(22, 28, 36, 0.9)",
          backdropFilter: "blur(4px)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
        }}
      />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              authenticated && isAdmin() ? (
                <Navigate to="/admin" replace />
              ) : authenticated ? (
                <Navigate to="/messages/inbox" replace />
              ) : (
                <Home />
              )
            }
          />

          {/* Base messages route - redirect to send */}
          <Route
            path="/messages"
            element={<Navigate to="/messages/send" replace />}
          />

          {/* Inbox route */}
          <Route
            path="/messages/inbox"
            element={
              authenticated && isAdmin() ? (
                <Navigate to="/admin" replace />
              ) : authenticated && isModerator() ? (
                <Navigate to="/moderator" replace />
              ) : authenticated ? (
                <Chat view="received" />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          {/* Send messages route */}
          <Route
            path="/messages/send"
            element={
              authenticated && isAdmin() ? (
                <Navigate to="/admin" replace />
              ) : authenticated && isModerator() ? (
                <Navigate to="/moderator" replace />
              ) : authenticated ? (
                <Chat view="send" />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          <Route
            path="/profile"
            element={
              authenticated ? (
                <Profile />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/login"
            element={<Navigate to="/?action=signin" replace />}
          />

          <Route
            path="/admin"
            element={
              authenticated && isAdmin() ? (
                <AdminPanel />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              authenticated && isAdmin() ? (
                <AdminPanel view="dashboard" />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          <Route
            path="/admin/users"
            element={
              authenticated && isAdmin() ? (
                <AdminPanel view="users" />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          <Route
            path="/admin/settings"
            element={
              authenticated && isAdmin() ? (
                <AdminPanel view="settings" />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          {/* Moderator routes */}
          <Route
            path="/moderator"
            element={
              authenticated && isModerator() ? (
                <ModeratorPanel />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          {/* Authentication routes redirect to home page with modals */}
          <Route
            path="/signin"
            element={
              authenticated ? (
                <Navigate to="/messages/inbox" replace />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />
          <Route
            path="/signup"
            element={<Navigate to="/?action=signup" replace />}
          />

          {/* Test routes */}
          <Route
            path="/test/crypto"
            element={
              authenticated ? (
                <CryptoTest />
              ) : (
                <Navigate to="/?action=signin" replace />
              )
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

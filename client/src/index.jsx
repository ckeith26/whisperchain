import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useStore from './store';
import NotFound from './components/shared-components/NotFound';
import Home from './components/home/Home';
import Chat from './components/chat/Chat';
import Profile from './components/profile/Profile';
import AdminPanel from './components/admin/AdminPanel';
import ModeratorPanel from './components/moderator/ModeratorPanel';
import ConditionalRedirect from './components/shared-components/ConditionalRedirect';
import LoadingPage from './components/shared-components/LoadingPage';
import { useLocation } from 'react-router-dom';
import './styles.scss';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const { loadUserProfile, initialized, authenticated, isAdmin, isModerator } = useStore(state => state.authSlice);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);
  
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
          background: 'rgba(22, 28, 36, 0.9)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={
            authenticated && isAdmin() ? <Navigate to="/admin" replace /> : <Home />
          } />
          
          <Route path="/messages" element={
            authenticated && isAdmin() ? <Navigate to="/admin" replace /> : 
            authenticated ? <Chat /> : <Navigate to="/?action=signin" replace />
          } />
          
          <Route path="/profile" element={
            authenticated ? <Profile /> : <Navigate to="/?action=signin" replace />
          } />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={
            <Navigate to="/?action=signin" replace />
          } />
          
          <Route path="/admin" element={
            authenticated && isAdmin() ? <AdminPanel /> : <Navigate to="/?action=signin" replace />
          } />
          
          {/* Moderator routes */}
          <Route path="/moderator" element={
            authenticated && isModerator() ? <ModeratorPanel /> : <Navigate to="/?action=signin" replace />
          } />
          
          {/* Authentication routes redirect to home page with modals */}
          <Route path="/signin" element={<Navigate to="/?action=signin" replace />} />
          <Route path="/signup" element={<Navigate to="/?action=signup" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 
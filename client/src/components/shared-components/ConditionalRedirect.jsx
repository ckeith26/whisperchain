import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../../store';

const ConditionalRedirect = ({
  children,
  redirectTo = '/',
  redirectIfAuthenticated = true,
  checkRoleFn = null,
  isAdminPage = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, initialized, isAdmin } = useStore(state => state.authSlice);

  useEffect(() => {
    if (initialized) {
      // First check authentication
      const authCheckFailed = 
        (redirectIfAuthenticated && authenticated) ||
        (!redirectIfAuthenticated && !authenticated);
      
      if (authCheckFailed) {
        navigate(redirectTo);
        return;
      }
      
      // Handle admin-specific routing
      if (authenticated) {
        const isUserAdmin = isAdmin();
        const isCurrentPathAdmin = location.pathname.startsWith('/admin');
        const isRestrictedPath = ['/', '/messages'].includes(location.pathname);

        // If user is admin and trying to access restricted paths, redirect to admin
        if (isUserAdmin && isRestrictedPath) {
          navigate('/admin');
          return;
        }

        // If user is not admin but trying to access admin page, redirect to home
        if (!isUserAdmin && isCurrentPathAdmin) {
          navigate('/');
          return;
        }
      }
      
      // Then check role if a role check function is provided and the user is authenticated
      if (checkRoleFn && authenticated) {
        // If role check returns false, redirect
        if (!checkRoleFn()) {
          navigate(redirectTo);
        }
      }
    }
  }, [authenticated, initialized, navigate, redirectIfAuthenticated, redirectTo, checkRoleFn, isAdmin, location.pathname]);

  // If not initialized, don't render anything
  if (!initialized) return null;

  // Check if we should render the children based on authentication
  const authCheckPassed =
    (redirectIfAuthenticated && !authenticated) ||
    (!redirectIfAuthenticated && authenticated);
  
  // Check if we should render based on role (if role check provided)
  const roleCheckPassed = !checkRoleFn || !authenticated || checkRoleFn();
  
  // Check admin-specific conditions
  const isUserAdmin = isAdmin();
  const isCurrentPathAdmin = location.pathname.startsWith('/admin');
  const isRestrictedPath = ['/', '/messages'].includes(location.pathname);
  const adminCheckPassed = 
    (isUserAdmin && (isCurrentPathAdmin || !isRestrictedPath)) || 
    (!isUserAdmin && !isCurrentPathAdmin);
  
  // Render children only if all checks pass
  if (authCheckPassed && roleCheckPassed && adminCheckPassed) {
    return <>{children}</>;
  }

  // Return null while redirect is happening
  return null;
};

export default ConditionalRedirect; 
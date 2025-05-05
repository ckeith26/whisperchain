import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store';

const ConditionalRedirect = ({
  children,
  redirectTo = '/',
  redirectIfAuthenticated = true,
  checkRoleFn = null
}) => {
  const navigate = useNavigate();
  const { authenticated, initialized } = useStore(state => state.authSlice);

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
      
      // Then check role if a role check function is provided and the user is authenticated
      if (checkRoleFn && authenticated) {
        // If role check returns false, redirect
        if (!checkRoleFn()) {
          navigate(redirectTo);
        }
      }
    }
  }, [authenticated, initialized, navigate, redirectIfAuthenticated, redirectTo, checkRoleFn]);

  // If not initialized, don't render anything
  if (!initialized) return null;

  // Check if we should render the children based on authentication
  const authCheckPassed =
    (redirectIfAuthenticated && !authenticated) ||
    (!redirectIfAuthenticated && authenticated);
  
  // Check if we should render based on role (if role check provided)
  const roleCheckPassed = !checkRoleFn || !authenticated || checkRoleFn();
  
  // Render children only if both checks pass
  if (authCheckPassed && roleCheckPassed) {
    return <>{children}</>;
  }

  // Return null while redirect is happening
  return null;
};

export default ConditionalRedirect; 
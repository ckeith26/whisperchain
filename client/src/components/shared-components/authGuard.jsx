import React from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../../store';

const WaitlistGuard = ({ children, redirectTo = '/' }) => {
  const user = useStore((state) => state.userSlice.user);
  const { authenticated } = useStore(({ authSlice }) => authSlice);
  
  // Check the condition directly in the render logic
  if (authenticated && user && user.subscription?.plan !== 'waitlist' && user.subscription?.status === 'active') {
    return children;
  }

  // If the condition fails, redirect
  return <Navigate to={redirectTo} />;
};

export default WaitlistGuard;
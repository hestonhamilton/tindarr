import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page is reached after Plex authentication.
    // The original tab is polling the backend for the token.
    // We can simply close this window or redirect to the main page.
    // For now, let's redirect to the login page, and the original tab will handle the rest.
    // In a real application, you might want to close the window if it was opened as a popup.
    navigate('/login?status=plex_auth_completed');
  }, [navigate]);

  return (
    <div>
      <p>Plex authentication complete. Returning to Tindarr...</p>
    </div>
  );
};

export default AuthCallback;

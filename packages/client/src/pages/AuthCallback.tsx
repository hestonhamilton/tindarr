import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// Plex sends the browser back here after the user approves the PIN; swap it for a token.
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pinId = searchParams.get('pinId');
    if (!pinId) {
      navigate('/');
      return;
    }
    axios.get<{ authToken: string }>(`/api/auth/plex/token/${pinId}`)
      .then((response) => {
        localStorage.setItem('plexToken', response.data.authToken);
        // Use VITE_PLEX_URL if available, otherwise fallback to hardcoded or user input
        localStorage.setItem('plexUrl', import.meta.env.VITE_PLEX_URL || 'http://localhost:32400');
        navigate('/create-room', { replace: true });
      })
      .catch(() => setError('Plex login did not complete.'));
  }, [navigate, searchParams]);

  if (error) {
    return <div><p>{error}</p><button onClick={() => navigate('/')}>Try again</button></div>;
  }
  return <p>Signing you in with Plex…</p>;
};

export default AuthCallback;

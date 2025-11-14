import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePlexLogin = async () => {
    try {
      const response = await axios.post<{ id: number; code: string }>('/api/auth/plex/pin');
      const { id, code } = response.data;

      const plexAuthUrl = `https://app.plex.tv/auth#?clientID=moviematch-v2&code=${code}&context[device][product]=MovieMatch&context[device][platform]=Web&context[device][device]=Web&context[device][version]=1.0&forwardUrl=${window.location.origin}/auth/callback`;
      window.open(plexAuthUrl, '_blank');

      const pollForToken = async () => {
        const tokenResponse = await axios.get<{ authToken: string }>(`/api/auth/plex/token/${id}`);
        if (tokenResponse.data.authToken) {
          localStorage.setItem('plexToken', tokenResponse.data.authToken);
          // For now, hardcode Plex URL. In a real app, this would come from user input or Plex API.
          localStorage.setItem('plexUrl', 'http://localhost:32400');
          navigate('/create-room');
        } else {
          setTimeout(pollForToken, 2000); // Poll every 2 seconds
        }
      };

      setTimeout(pollForToken, 2000); // Start polling after 2 seconds
    } catch (err) {
      console.error('Plex login failed:', err);
      setError('Failed to initiate Plex login. Please try again.');
    }
  };

  return (
    <div>
      <h1>Login to MovieMatch</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handlePlexLogin}>Login with Plex</button>
    </div>
  );
};

export default LoginPage;

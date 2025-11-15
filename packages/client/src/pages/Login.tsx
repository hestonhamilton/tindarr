import React, { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(''); // New state for user name
  const [roomCodeInput, setRoomCodeInput] = useState<string>(''); // New state for room code input
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Fallback for local development

  useEffect(() => {
    const vitePlexUrl = import.meta.env.VITE_PLEX_URL;
    const vitePlexToken = import.meta.env.VITE_PLEX_TOKEN;

    if (vitePlexUrl && vitePlexToken) {
      localStorage.setItem('plexUrl', vitePlexUrl);
      localStorage.setItem('plexToken', vitePlexToken);
      navigate('/create-room');
    }
  }, [navigate]); // Run once on component mount

  const handlePlexLogin = async () => {
    try {
      const response = await axios.post<{ id: number; code: string }>(`${backendUrl}/api/auth/plex/pin`);
      const { id, code } = response.data;

      const plexAuthUrl = `https://app.plex.tv/auth#?clientID=moviematch-v2&code=${code}&context[device][product]=MovieMatch&context[device][platform]=Web&context[device][device]=Web&context[device][version]=1.0&forwardUrl=${window.location.origin}/auth/callback?pinId=${id}`;
      window.open(plexAuthUrl, '_blank');

      const pollForToken = async () => {
        const tokenResponse = await axios.get<{ authToken: string }>(`${backendUrl}/api/auth/plex/token/${id}`);
        if (tokenResponse.data.authToken) {
          localStorage.setItem('plexToken', tokenResponse.data.authToken);
          // Use VITE_PLEX_URL if available, otherwise fallback to hardcoded or user input
          localStorage.setItem('plexUrl', import.meta.env.VITE_PLEX_URL || 'http://localhost:32400');
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

  const handleJoinRoom = () => {
    if (!userName || !roomCodeInput) {
      alert('Please enter your name and the room code.');
      return;
    }
    const userId = uuidv4(); // Generate UUID for userId
    localStorage.setItem('userId', userId); // Store userId
    localStorage.setItem('userName', userName); // Store userName
    navigate(`/room/${roomCodeInput}`);
  };

  return (
    <div>
      <h1>Login to MovieMatch</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handlePlexLogin}>Login with Plex</button>

      <hr style={{ margin: '20px 0' }} />

      <h2>Join an Existing Room</h2>
      <div>
        <label htmlFor="joinUserName">Your Name:</label>
        <input
          type="text"
          id="joinUserName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
      <div>
        <label htmlFor="roomCodeInput">Room Code:</label>
        <input
          type="text"
          id="roomCodeInput"
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} // Convert to uppercase
          placeholder="Enter room code"
          maxLength={6} // Assuming 6-character codes
        />
      </div>
      <button onClick={handleJoinRoom} disabled={!userName || !roomCodeInput}>Join Room</button>
    </div>
  );
};

export default LoginPage;

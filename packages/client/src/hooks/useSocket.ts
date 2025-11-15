import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Default to localhost if not set
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return socket;
}

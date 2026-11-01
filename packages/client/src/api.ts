export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Default to localhost if not set

// Posters come through the room's server-side Plex session, so guests never need a Plex token.
export const posterSrc = (roomCode: string, path?: string) =>
  path ? `${backendUrl}/api/rooms/${roomCode}/poster?path=${encodeURIComponent(path)}` : undefined;

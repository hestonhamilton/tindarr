import { Server, Socket } from 'socket.io';
import http from 'http';
import { RoomManager } from './room';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  Movie,
} from './types';

// A locked phone drops its socket for a moment; only treat a user as gone (which can turn
// the others' likes into a match) if they haven't reconnected within this window.
const DISCONNECT_GRACE_MS = 5 * 60_000;

export function createSocketServer(
  server: http.Server,
  roomManager: RoomManager = new RoomManager(),
  disconnectGraceMs = DISCONNECT_GRACE_MS,
) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", // Use environment variable for client origin
      methods: ["GET", "POST"]
    }
  });

  const emitDeparture = (roomId: string, userId: string) => {
    const room = roomManager.leaveRoom(roomId, userId);
    if (!room) return;
    const matches = roomManager.recheckMatches(roomId);
    io.to(roomId).emit('userLeft', room);
    for (const movie of matches) io.to(roomId).emit('match', movie);
    io.to(roomId).emit('roomUpdated', room);
  };

  // A throw inside a socket.io handler takes down the whole process; a malformed payload
  // from one client must not end everyone's night
  const guard = <T>(name: string, handler: (payload: T) => void) => (payload: T) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`socket ${name}: ${(error as Error).message}`);
    }
  };
  const isUser = (user: unknown): user is { id: string; name: string } =>
    typeof (user as { id?: unknown })?.id === 'string' && typeof (user as { name?: unknown })?.name === 'string';

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log('a user connected');

    socket.on('createRoom', guard('createRoom', (payload: CreateRoomPayload) => {
      if (!isUser(payload?.user)) return;
      const room = roomManager.createRoom(payload); // Pass the entire payload
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.userId = payload.user.id;
      socket.emit('roomCreated', room);
    }));

    socket.on('joinRoom', guard('joinRoom', (payload: JoinRoomPayload) => {
      if (typeof payload?.roomCode !== 'string' || !isUser(payload.user)) return;
      const room = roomManager.joinRoom(payload.roomCode, payload.user);
      if (room) {
        socket.join(room.id);
        socket.data.roomId = room.id;
        socket.data.userId = payload.user.id;
        io.to(room.id).emit('userJoined', room);
      } else {
        socket.emit('roomNotFound');
      }
    }));

    socket.on('leaveRoom', guard('leaveRoom', (payload: LeaveRoomPayload) => {
      if (typeof payload?.roomId !== 'string' || typeof payload.userId !== 'string') return;
      const room = roomManager.getRoomById(payload.roomId) ?? roomManager.getRoomByCode(payload.roomId);
      if (room) {
        emitDeparture(room.id, payload.userId);
        socket.leave(room.id);
        if (socket.data.roomId === room.id && socket.data.userId === payload.userId) {
          socket.data.roomId = undefined;
          socket.data.userId = undefined;
        }
      }
    }));

    socket.on('disconnect', () => {
      console.log('user disconnected');
      const { roomId, userId } = socket.data;
      if (!roomId || !userId) return;
      setTimeout(async () => {
        const connected = await io.in(roomId).fetchSockets();
        if (!connected.some(other => other.data.userId === userId)) {
          emitDeparture(roomId, userId);
        }
      }, disconnectGraceMs).unref();
    });

    socket.on('likeMovie', guard('likeMovie', (payload: { roomId: string; userId: string; movie: Movie }) => {
      if (typeof payload?.roomId !== 'string' || typeof payload.userId !== 'string' || typeof payload.movie?.key !== 'string') return;
      const roomCode = payload.roomId; // The payload.roomId is actually the roomCode
      const userId = payload.userId; // Get userId from payload
      const room = roomManager.getRoomByCode(roomCode); // Get the room by code

      if (room) {
        const matchesBefore = room.likedMovies.length;
        const updatedRoom = roomManager.addLikedMovie(room.id, payload.movie, userId); // Pass userId
        if (updatedRoom) {
          io.to(updatedRoom.id).emit('roomUpdated', updatedRoom);
          if (updatedRoom.likedMovies.length > matchesBefore) {
            io.to(updatedRoom.id).emit('match', payload.movie);
          }
        } else {
          // Optionally emit an error back to the client
        }
      } else {
        // Optionally emit an error back to the client
      }
    }));
  });

  return io;
}

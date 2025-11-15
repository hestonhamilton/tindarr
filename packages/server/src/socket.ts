import { Server, Socket } from 'socket.io';
import http from 'http';
import { RoomManager } from './room';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
} from './types';

export function createSocketServer(server: http.Server) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", // Use environment variable for client origin
      methods: ["GET", "POST"]
    }
  });
  const roomManager = new RoomManager();

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log('a user connected');

    socket.on('createRoom', (payload: CreateRoomPayload) => {
      const room = roomManager.createRoom(payload); // Pass the entire payload
      socket.join(room.id);
      socket.emit('roomCreated', room);
    });

    socket.on('joinRoom', (payload: JoinRoomPayload) => {
      const room = roomManager.joinRoom(payload.roomCode, payload.user);
      if (room) {
        socket.join(room.id);
        io.to(room.id).emit('userJoined', room);
      } else {
        socket.emit('roomNotFound');
      }
    });

    socket.on('leaveRoom', (payload: LeaveRoomPayload) => {
      const room = roomManager.leaveRoom(payload.roomId, payload.userId);
      if (room) {
        io.to(room.id).emit('userLeft', room);
        socket.leave(room.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  return io;
}

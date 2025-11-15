import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { createSocketServer } from './socket';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  User,
  CreateRoomPayload, // Import CreateRoomPayload
  SelectedLibrary, // Import SelectedLibrary
} from './types';

const mockCreateRoomPayload = (user: User): CreateRoomPayload => ({
  user,
  selectedLibraries: [{ key: '1', type: 'movie' }],
  selectedGenres: ['Action'],
  yearMin: 2000,
  yearMax: 2020,
  durationMin: 60000, // 1 minute in ms
  durationMax: 12000000, // 200 minutes in ms
  selectedContentRatings: ['PG'],
  sortOrder: 'title:asc',
});

describe('Socket.IO server', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let server: HttpServer;
  let port: number;
  let consoleSpy: jest.SpyInstance;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  beforeAll((done) => {
    server = createServer();
    io = createSocketServer(server);
    server.listen(() => {
      const addr = server.address();
      if (typeof addr === 'string') {
        port = parseInt(addr.split(':').pop()!, 10);
      } else if (addr) {
        port = addr.port;
      }
      done();
    });
  });

  beforeEach((done) => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    clientSocket.disconnect();
  });

  afterAll(() => {
    io.close();
    server.close();
  });

      it('should create a room', (done) => {
        const user: User = { id: '1', name: 'test' };
        clientSocket.emit('createRoom', mockCreateRoomPayload(user));    clientSocket.on('roomCreated', (room) => {
      expect(room).toBeDefined();
      expect(room.users).toHaveLength(1);
      expect(room.users[0]).toEqual(user);
      expect(room.selectedLibraries).toEqual(mockCreateRoomPayload(user).selectedLibraries); // Verify new fields
      done();
    });
  });

      it('should join a room', (done) => {
        const user1: User = { id: '1', name: 'test1' };
        clientSocket.emit('createRoom', mockCreateRoomPayload(user1));    clientSocket.on('roomCreated', (room) => {
      const user2: User = { id: '2', name: 'test2' };
      const client2 = Client(`http://localhost:${port}`);
      client2.on('connect', () => {
        (client2 as ClientSocket<ServerToClientEvents, ClientToServerEvents>).emit('joinRoom', { roomCode: room.code, user: user2 });
      });
      io.on('connection', (socket) => {
        socket.on('joinRoom', () => {
            // This is not a real event, but we need to wait for the server to process the joinRoom event
        });
      });

      let userJoinedCount = 0;
      const onUserJoined = (room: any) => {
        userJoinedCount++;
        if (userJoinedCount === 2) {
            expect(room.users).toHaveLength(2);
            expect(room.users[1]).toEqual(user2);
            client2.disconnect();
            done();
        }
      };

      clientSocket.on('userJoined', onUserJoined);
      const client2Typed = client2 as ClientSocket<ServerToClientEvents, ClientToServerEvents>;
      client2Typed.on('userJoined', onUserJoined);
    });
  });

      it('should leave a room', (done) => {
        const user: User = { id: '1', name: 'test' };
        clientSocket.emit('createRoom', mockCreateRoomPayload(user));    clientSocket.on('roomCreated', (room) => {
      clientSocket.emit('leaveRoom', { roomId: room.id, userId: user.id });
      clientSocket.on('userLeft', (room) => {
        expect(room.users).toHaveLength(0);
        done();
      });
    });
  });

  it('should emit roomNotFound if room does not exist', (done) => {
    const user: User = { id: '1', name: 'test' };
    clientSocket.emit('joinRoom', { roomCode: 'non-existent-room', user });
    clientSocket.on('roomNotFound', () => {
      done();
    });
  });
});
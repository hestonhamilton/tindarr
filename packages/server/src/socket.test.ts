import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { createSocketServer } from './socket';
import { RoomManager } from './room';
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
  let roomManager: RoomManager;

  beforeAll((done) => {
    server = createServer();
    roomManager = new RoomManager();
    io = createSocketServer(server, roomManager, 0);
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

  it('should emit match once every user in the room likes the same movie', (done) => {
    const host: User = { id: 'h', name: 'host' };
    const guest: User = { id: 'g', name: 'guest' };
    const movie = { key: '42', title: 'Heat' };
    clientSocket.emit('createRoom', { ...mockCreateRoomPayload(host), plexUrl: 'http://plex', plexToken: 'secret' });
    clientSocket.on('roomCreated', (room) => {
      expect(JSON.stringify(room)).not.toContain('secret'); // host token stays server-side
      const client2 = Client(`http://localhost:${port}`) as ClientSocket<ServerToClientEvents, ClientToServerEvents>;
      client2.on('connect', () => client2.emit('joinRoom', { roomCode: room.code, user: guest }));
      client2.on('userJoined', () => {
        clientSocket.emit('likeMovie', { roomId: room.code, userId: host.id, movie });
        client2.emit('likeMovie', { roomId: room.code, userId: guest.id, movie });
      });
      client2.on('match', (matched) => {
        expect(matched.key).toBe('42');
        client2.disconnect();
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

  it('leaves a room by code and keeps the curated lobby', (done) => {
    const room = roomManager.createCuratedLobby('BOO', 'http://plex', 'secret');
    clientSocket.once('userJoined', () => {
      clientSocket.once('userLeft', (updated) => {
        expect(updated.users).toEqual([]);
        expect(roomManager.getRoomByCode('BOO')).toBe(room);
        expect(JSON.stringify(updated)).not.toContain('secret');
        done();
      });
      clientSocket.emit('leaveRoom', { roomId: room.code, userId: 'guest' });
    });
    clientSocket.emit('joinRoom', { roomCode: room.code, user: { id: 'guest', name: 'Guest' } });
  });

  it('removes a disconnected user only after their last socket disconnects', (done) => {
    const room = roomManager.createCuratedLobby('BATS', 'http://plex', 'secret');
    const second = Client(`http://localhost:${port}`) as ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    const third = Client(`http://localhost:${port}`) as ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    const guest = { id: 'guest', name: 'Guest' };
    const finish = (error?: Error) => {
      second.disconnect();
      third.disconnect();
      done(error);
    };

    clientSocket.once('userJoined', () => {
      second.emit('joinRoom', { roomCode: room.code, user: guest }); // buffered until connected
      clientSocket.once('userJoined', () => {
        third.emit('joinRoom', { roomCode: room.code, user: guest }); // buffered until connected
        clientSocket.once('userJoined', () => {
          second.disconnect();
          setTimeout(() => {
            try {
              expect(room.users.map(user => user.id)).toEqual(['observer', 'guest']);
              clientSocket.once('userLeft', (updated) => {
                try {
                  expect(updated.users.map(user => user.id)).toEqual(['observer']);
                  expect(room.users.map(user => user.id)).toEqual(['observer']);
                  finish();
                } catch (error) { finish(error as Error); }
              });
              third.disconnect();
            } catch (error) { finish(error as Error); }
          }, 50);
        });
      });
    });
    clientSocket.emit('joinRoom', { roomCode: room.code, user: { id: 'observer', name: 'Observer' } });
  });

  it('survives malformed payloads', (done) => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const raw = clientSocket as unknown as { emit: (event: string, payload?: unknown) => void };
    raw.emit('likeMovie', { roomId: 'BOO', userId: 'x' });
    raw.emit('likeMovie', null);
    raw.emit('joinRoom', { roomCode: 'BOO' });
    raw.emit('leaveRoom', { roomId: 42, userId: 'x' });
    clientSocket.emit('joinRoom', { roomCode: 'non-existent-room', user: { id: '1', name: 'test' } });
    clientSocket.once('roomNotFound', () => { errors.mockRestore(); done(); }); // still alive and answering
  });
});

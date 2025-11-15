import { RoomManager } from './room';
import { User, CreateRoomPayload, SelectedLibrary } from './types';

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

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a new room with the user', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(mockCreateRoomPayload(user));

      expect(room).toBeDefined();
      expect(room.users).toHaveLength(1);
      expect(room.users[0]).toEqual(user);
      expect(room.selectedLibraries).toEqual(mockCreateRoomPayload(user).selectedLibraries); // Verify new fields
    });
  });

  describe('joinRoom', () => {
    it('should add a user to an existing room', () => {
      const user1: User = { id: '1', name: 'test1' };
      const room = roomManager.createRoom(mockCreateRoomPayload(user1));

      const user2: User = { id: '2', name: 'test2' };
      const updatedRoom = roomManager.joinRoom(room.code, user2);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.users).toHaveLength(2);
      expect(updatedRoom?.users[1]).toEqual(user2);
    });

    it('should return null if the room does not exist', () => {
      const user: User = { id: '1', name: 'test' };
      const result = roomManager.joinRoom('non-existent-room', user);

      expect(result).toBeNull();
    });
  });

  describe('leaveRoom', () => {
    it('should remove a user from an existing room', () => {
      const user1: User = { id: '1', name: 'test1' };
      const user2: User = { id: '2', name: 'test2' };
      const room = roomManager.createRoom(mockCreateRoomPayload(user1));
      roomManager.joinRoom(room.code, user2);

      const updatedRoom = roomManager.leaveRoom(room.id, user1.id);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.users).toHaveLength(1);
      expect(updatedRoom?.users[0]).toEqual(user2);
    });

    it('should delete the room if it becomes empty', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(mockCreateRoomPayload(user));

      roomManager.leaveRoom(room.id, user.id);

      const deletedRoom = roomManager.getRoomById(room.id);
      expect(deletedRoom).toBeUndefined();
    });

    it('should return null if the room does not exist', () => {
      const result = roomManager.leaveRoom('non-existent-room', '1');

      expect(result).toBeNull();
    });

    it('should return null if the user does not exist in the room', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(mockCreateRoomPayload(user));

      const result = roomManager.leaveRoom(room.id, '2');

      expect(result).toBeNull();
    });
  });
});

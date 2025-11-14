import { RoomManager } from './room';
import { User } from './types';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a new room with the user', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(user);

      expect(room).toBeDefined();
      expect(room.users).toHaveLength(1);
      expect(room.users[0]).toEqual(user);
    });
  });

  describe('joinRoom', () => {
    it('should add a user to an existing room', () => {
      const user1: User = { id: '1', name: 'test1' };
      const room = roomManager.createRoom(user1);

      const user2: User = { id: '2', name: 'test2' };
      const updatedRoom = roomManager.joinRoom(room.id, user2);

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
      const room = roomManager.createRoom(user1);
      roomManager.joinRoom(room.id, user2);

      const updatedRoom = roomManager.leaveRoom(room.id, user1.id);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.users).toHaveLength(1);
      expect(updatedRoom?.users[0]).toEqual(user2);
    });

    it('should delete the room if it becomes empty', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(user);

      roomManager.leaveRoom(room.id, user.id);

      const deletedRoom = roomManager.getRoom(room.id);
      expect(deletedRoom).toBeUndefined();
    });

    it('should return null if the room does not exist', () => {
      const result = roomManager.leaveRoom('non-existent-room', '1');

      expect(result).toBeNull();
    });

    it('should return null if the user does not exist in the room', () => {
      const user: User = { id: '1', name: 'test' };
      const room = roomManager.createRoom(user);

      const result = roomManager.leaveRoom(room.id, '2');

      expect(result).toBeNull();
    });
  });
});

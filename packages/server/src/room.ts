import { Room, User } from './types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(user: User): Room {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      users: [user],
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, user: User): Room | null {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.push(user);
      return room;
    }
    return null;
  }

  leaveRoom(roomId: string, userId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (room) {
      const userIndex = room.users.findIndex((user) => user.id === userId);
      if (userIndex > -1) {
        room.users.splice(userIndex, 1);
        if (room.users.length === 0) {
          this.rooms.delete(roomId);
        }
        return room;
      }
    }
    return null;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

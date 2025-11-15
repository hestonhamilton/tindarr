import { Room, User } from './types';
import crypto from 'crypto'; // Import crypto module

export class RoomManager {
  private rooms: Map<string, Room> = new Map(); // Map by roomId (UUID)
  private roomCodes: Map<string, string> = new Map(); // Map roomCode to roomId

  createRoom(user: User): Room {
    const roomId = crypto.randomUUID(); // Use UUID for internal ID
    const roomCode = this.generateRoomCode(); // Generate user-friendly code
    const room: Room = {
      id: roomId,
      code: roomCode, // Add code to room
      users: [user],
    };
    this.rooms.set(roomId, room);
    this.roomCodes.set(roomCode, roomId); // Store mapping
    return room;
  }

  joinRoom(roomCode: string, user: User): Room | null { // Accepts roomCode
    const room = this.getRoomByCode(roomCode); // Find by code
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
          // Remove code mapping when room is deleted
          this.roomCodes.delete(room.code);
        }
        return room;
      }
    }
    return null;
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): Room | undefined {
    const roomId = this.roomCodes.get(code);
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  private generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const codeLength = 6; // e.g., 6 characters
    for (let i = 0; i < codeLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Ensure uniqueness
    if (this.roomCodes.has(result)) {
      return this.generateRoomCode(); // Regenerate if not unique
    }
    return result;
  }
}

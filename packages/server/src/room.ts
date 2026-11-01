import { Room, User, CreateRoomPayload, Movie } from './types'; // Import Movie

export interface PlexSession {
  plexUrl: string;
  plexToken: string;
  deck?: Promise<Movie[]>; // Fetched once so everyone swipes the same order
}
import crypto from 'crypto'; // Import crypto module

export class RoomManager {
  private rooms: Map<string, Room> = new Map(); // Map by roomId (UUID)
  private roomCodes: Map<string, string> = new Map(); // Map roomCode to roomId
  private plexSessions: Map<string, PlexSession> = new Map(); // roomId -> host's Plex creds

  createRoom(payload: CreateRoomPayload): Room { // Changed parameter to payload
    const roomId = crypto.randomUUID(); // Use UUID for internal ID
    const roomCode = this.generateRoomCode(); // Generate user-friendly code
    const room: Room = {
      id: roomId,
      code: roomCode, // Add code to room
      users: [payload.user], // Use user from payload
      // Store movie selection criteria from payload
      selectedLibraries: payload.selectedLibraries,
      selectedGenres: payload.selectedGenres,
      yearMin: payload.yearMin,
      yearMax: payload.yearMax,
      durationMin: payload.durationMin,
      durationMax: payload.durationMax,
      selectedContentRatings: payload.selectedContentRatings,
      sortOrder: payload.sortOrder,
      likedMovies: [],
      movieLikes: {}, // Initialize movieLikes
    };
    this.rooms.set(roomId, room);
    this.roomCodes.set(roomCode, roomId); // Store mapping
    if (payload.plexUrl && payload.plexToken) {
      this.plexSessions.set(roomId, { plexUrl: payload.plexUrl, plexToken: payload.plexToken });
    }
    return room;
  }

  createCuratedLobby(code: string, plexUrl: string, plexToken: string): Room {
    const roomCode = code.toUpperCase();
    const existing = this.getRoomByCode(roomCode);
    if (existing) {
      if (existing.curated !== 'halloween') throw new Error('Room code already in use.');
      // Re-opening with the same creds keeps the deck, so nobody's swipe order reshuffles
      // mid-night; new creds replace the session so an in-flight fetch can't restore the old deck.
      const session = this.plexSessions.get(existing.id);
      if (session?.plexUrl !== plexUrl || session.plexToken !== plexToken) {
        this.plexSessions.set(existing.id, { plexUrl, plexToken });
      }
      return existing;
    }

    const room: Room = {
      id: crypto.randomUUID(),
      code: roomCode,
      curated: 'halloween',
      users: [],
      selectedLibraries: [],
      selectedGenres: [],
      selectedContentRatings: [],
      sortOrder: 'random',
      likedMovies: [],
      movieLikes: {},
    };
    this.rooms.set(room.id, room);
    this.roomCodes.set(roomCode, room.id);
    this.plexSessions.set(room.id, { plexUrl, plexToken });
    return room;
  }

  joinRoom(roomCode: string, user: User): Room | null { // Accepts roomCode
    const room = this.getRoomByCode(roomCode); // Find by code
    if (room) {
      // Only add user if they are not already in the room
      if (!room.users.some(existingUser => existingUser.id === user.id)) {
        room.users.push(user);
      }
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
        if (room.users.length === 0 && !room.curated) {
          this.rooms.delete(roomId);
          // Remove code mapping when room is deleted
          this.roomCodes.delete(room.code);
          this.plexSessions.delete(roomId);
        }
        return room;
      }
    }
    return null;
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getPlexSession(roomId: string): PlexSession | undefined {
    return this.plexSessions.get(roomId);
  }

  getRoomByCode(code: string): Room | undefined {
    const roomId = this.roomCodes.get(code.toUpperCase());
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  addLikedMovie(roomId: string, movie: Movie, userId: string): Room | undefined { // Added userId
    const room = this.rooms.get(roomId);
    if (room) {
      // Initialize movieLikes for this movie if it doesn't exist
      if (!room.movieLikes[movie.key]) {
        room.movieLikes[movie.key] = [];
      }

      // Add user to the list of users who liked this movie, if not already present
      if (!room.movieLikes[movie.key].includes(userId)) {
        room.movieLikes[movie.key].push(userId);
      }

      // Check if all current users in the room have liked this movie AND there's more than one user
      const allUsersLiked = room.users.length > 1 && room.users.every(user =>
        room.movieLikes[movie.key] && room.movieLikes[movie.key].includes(user.id)
      );

      if (allUsersLiked) {
        // Add movie to likedMovies only if not already present
        if (!room.likedMovies.some(m => m.key === movie.key)) {
          room.likedMovies.push(movie);
        }
      }
      return room;
    }
    return undefined;
  }

  private generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Only letters
    let result = '';
    const codeLength = 4; // e.g., 4 characters
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

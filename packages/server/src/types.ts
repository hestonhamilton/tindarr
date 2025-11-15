export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  users: User[];
}

export interface CreateRoomPayload {
  user: User;
}

export interface JoinRoomPayload {
  roomId: string;
  user: User;
}

export interface LeaveRoomPayload {
  roomId: string;
  userId: string;
}

export interface ServerToClientEvents {
  roomCreated: (room: Room) => void;
  userJoined: (room: Room) => void;
  userLeft: (room: Room) => void;
  roomNotFound: () => void;
}

export interface ClientToServerEvents {
  createRoom: (payload: CreateRoomPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: LeaveRoomPayload) => void;
}

export interface Movie {
  key: string;
  title: string;
  year: number;
  summary: string;
  posterUrl: string;
}

export interface SelectedLibrary {
  key: string;
  type: 'movie' | 'show';
}

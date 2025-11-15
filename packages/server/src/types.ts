export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  code: string;
  users: User[];
  // New fields for movie selection criteria
  selectedLibraries: SelectedLibrary[];
  selectedGenres: string[];
  yearMin?: number;
  yearMax?: number;
  durationMin?: number;
  durationMax?: number;
  selectedContentRatings: string[];
  sortOrder: string;
  likedMovies: Movie[]; // Added
}

export interface CreateRoomPayload {
  user: User;
  // New fields for movie selection criteria
  selectedLibraries: SelectedLibrary[];
  selectedGenres: string[];
  yearMin?: number;
  yearMax?: number;
  durationMin?: number;
  durationMax?: number;
  selectedContentRatings: string[];
  sortOrder: string;
}

export interface JoinRoomPayload {
  roomCode: string; // Changed from roomId
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
  year?: number; // Made optional as some movies might not have it
  summary?: string; // Made optional
  posterUrl?: string; // Made optional
  tagline?: string; // New
  studio?: string; // New
  genres?: string[]; // New, simplified from { tag: string }[]
  countries?: string[]; // New, simplified
  directors?: string[]; // New, simplified
  writers?: string[]; // New, simplified (for main actors)
  roles?: string[]; // New, simplified (for main actors)
  duration?: number; // New (in milliseconds)
  contentRating?: string; // Already added, but ensuring it's here
  rating?: number; // Already added, but ensuring it's here
  originallyAvailableAt?: string; // Already added, but ensuring it's here
}

export interface SelectedLibrary {
  key: string;
  type: 'movie' | 'show';
}

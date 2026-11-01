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
  likedMovies: Movie[];
  movieLikes: Record<string, string[]>; // Added: movieId -> array of userIds who liked it
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
  // Host's Plex connection. Kept server-side so guests without a Plex login can
  // swipe; never echoed back in Room.
  plexUrl?: string;
  plexToken?: string;
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
  roomUpdated: (room: Room) => void; // Added
  match: (movie: Movie) => void; // Everyone in the room liked this movie
}

export interface ClientToServerEvents {
  createRoom: (payload: CreateRoomPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: LeaveRoomPayload) => void;
  likeMovie: (payload: { roomId: string; userId: string; movie: Movie }) => void; // Added
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
  audienceRating?: number;
}

export interface Player {
  id: string; // Plex client machineIdentifier
  name: string;
  product: string;
}

export interface SelectedLibrary {
  key: string;
  type: 'movie' | 'show';
}

export interface Library {
  key: string;
  title: string;
  type: 'movie' | 'show';
}

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

export interface Movie {
  key: string;
  title: string;
  year?: number;
  summary?: string;
  posterUrl?: string;
  tagline?: string;
  studio?: string;
  genres?: string[];
  countries?: string[];
  directors?: string[];
  writers?: string[];
  roles?: string[];
  duration?: number;
  contentRating?: string;
  rating?: number;
  originallyAvailableAt?: string;
  audienceRating?: number; // New
  audienceRatingImage?: string; // New
  ratingImage?: string; // New
}

export interface ClientToServerEvents {
  createRoom: (payload: {
    user: User;
    selectedLibraries: SelectedLibrary[];
    selectedGenres: string[];
    yearMin?: number;
    yearMax?: number;
    durationMin?: number;
    durationMax?: number;
    selectedContentRatings: string[];
    sortOrder: string;
  }) => void;
  joinRoom: (payload: { roomCode: string; user: User }) => void;
  leaveRoom: (payload: { roomId: string; userId: string }) => void;
  likeMovie: (payload: { roomId: string; userId: string; movie: Movie }) => void;
  dislikeMovie: (payload: { roomId: string; userId: string; movieId: string }) => void;
}

export interface ServerToClientEvents {
  roomCreated: (room: Room) => void; // Changed
  roomJoined: (room: Room) => void; // Changed
  userJoined: (room: Room) => void; // Changed
  userLeft: (userId: string) => void;
  movieLiked: (payload: { userId: string; movieId: string }) => void;
  movieDisliked: (payload: { userId: string; movieId: string }) => void;
  roomUpdated: (room: Room) => void; // Added
}

export interface SelectedLibrary {
  key: string;
  type: 'movie' | 'show';
}

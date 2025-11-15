export interface Library {
  key: string;
  title: string;
  type: 'movie' | 'show';
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
}

export interface ClientToServerEvents {
  createRoom: (payload: { userId: string; username: string; selectedLibraries: string[]; genre?: string; yearMin?: number; yearMax?: number }) => void;
  joinRoom: (payload: { roomId: string; userId: string; username: string }) => void;
  leaveRoom: (payload: { roomId: string; userId: string }) => void;
  likeMovie: (payload: { roomId: string; userId: string; movieId: string }) => void;
  dislikeMovie: (payload: { roomId: string; userId: string; movieId: string }) => void;
}

export interface ServerToClientEvents {
  roomCreated: (roomId: string) => void;
  roomJoined: (room: { id: string; users: { id: string; username: string }[] }) => void;
  userJoined: (user: { id: string; username: string }) => void;
  userLeft: (userId: string) => void;
  movieLiked: (payload: { userId: string; movieId: string }) => void;
  movieDisliked: (payload: { userId: string; movieId: string }) => void;
}

export interface SelectedLibrary {
  key: string;
  type: 'movie' | 'show';
}

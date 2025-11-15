import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePlexMovies } from '../hooks/usePlexMovies';
import { useSocket } from '../hooks/useSocket';
import { Movie, ClientToServerEvents, ServerToClientEvents, Room } from '../types'; // Removed SelectedLibrary
import { Socket } from 'socket.io-client';

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>(); // Changed to roomCode
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [roomState, setRoomState] = useState<Room | null>(null); // New state for room object
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useSocket();

  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';

  const userId = localStorage.getItem('userId') || ''; // Retrieve userId
  const userName = localStorage.getItem('userName') || ''; // Retrieve userName

  console.log('RoomPage: Initial render or state change');
  console.log('RoomPage: roomCode from useParams:', roomCode);
  console.log('RoomPage: userId from localStorage:', userId);
  console.log('RoomPage: userName from localStorage:', userName);
  console.log('RoomPage: roomState:', roomState);

  const { data: movies, isLoading, isError, error } = usePlexMovies({
    plexUrl,
    plexToken,
    selectedLibraries: roomState?.selectedLibraries || [], // Use from roomState
    genre: roomState?.selectedGenres.join(',') || undefined, // Use from roomState
    yearMin: roomState?.yearMin, // Use from roomState
    yearMax: roomState?.yearMax, // Use from roomState
    contentRating: roomState?.selectedContentRatings.join(',') || undefined, // Use from roomState
    durationMin: roomState?.durationMin, // Use from roomState
    durationMax: roomState?.durationMax, // Use from roomState
    sortOrder: roomState?.sortOrder, // Use from roomState
  }); // Corrected: removed the second argument

  console.log('RoomPage: usePlexMovies - isLoading:', isLoading);
  console.log('RoomPage: usePlexMovies - isError:', isError);
  console.log('RoomPage: usePlexMovies - error:', error);
  console.log('RoomPage: usePlexMovies - movies:', movies);
  console.log('RoomPage: usePlexMovies - params:', {
    plexUrl,
    plexToken,
    selectedLibraries: roomState?.selectedLibraries || [],
    genre: roomState?.selectedGenres.join(',') || undefined,
    yearMin: roomState?.yearMin,
    yearMax: roomState?.yearMax,
    contentRating: roomState?.selectedContentRatings.join(',') || undefined,
    durationMin: roomState?.durationMin,
    durationMax: roomState?.durationMax,
    sortOrder: roomState?.sortOrder,
  });

  useEffect(() => {
    console.log('RoomPage: useEffect triggered');
    if (socket && roomCode) {
      console.log('RoomPage: Emitting joinRoom event');
      socket.emit('joinRoom', { roomCode: roomCode || '', user: { id: userId, name: userName } });

      socket.on('roomCreated', (room: Room) => {
        console.log('RoomPage: roomCreated event received:', room);
        setRoomState(room);
      });

      socket.on('userJoined', (room: Room) => {
        console.log('RoomPage: userJoined event received:', room);
        setRoomState(room);
        console.log(`${room.users[room.users.length - 1].name} joined the room.`);
      });

      socket.on('userLeft', (leftUserId) => {
        console.log(`User ${leftUserId} left the room.`);
      });

      socket.on('movieLiked', ({ userId: likerId, movieId }) => {
        console.log(`User ${likerId} liked movie ${movieId}`);
      });

      socket.on('movieDisliked', ({ userId: dislikerId, movieId }) => {
        console.log(`User ${dislikerId} disliked movie ${movieId}`);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId: roomCode || '', userId });
        socket.off('roomCreated'); // Clean up
        socket.off('userJoined');
        socket.off('userLeft');
        socket.off('movieLiked');
        socket.off('movieDisliked');
      }
    };
  }, [socket, roomCode, userId, userName]);

  const handleLike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].key;
      socket.emit('likeMovie', { roomId: roomCode || '', userId, movieId }); // Changed roomId to roomCode
      console.log(`Liked movie: ${movies[currentMovieIndex].title}`);
      setCurrentMovieIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleDislike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].key;
      socket.emit('dislikeMovie', { roomId: roomCode || '', userId, movieId }); // Changed roomId to roomCode
      console.log(`Disliked movie: ${movies[currentMovieIndex].title}`);
      setCurrentMovieIndex((prevIndex) => prevIndex + 1);
    }
  };

  if (isLoading || !roomState) { // Added check for roomState
    return <div>Loading movies...</div>;
  }

  if (isError) {
    return <div>Error loading movies: {error?.message}</div>;
  }

  if (!movies || movies.length === 0) {
    return <div>No movies found for this room.</div>;
  }

  const currentMovie: Movie | undefined = movies[currentMovieIndex];

  if (!currentMovie) {
    return <div>No more movies to swipe!</div>;
  }

  const formatDuration = (ms: number | undefined) => {
    if (ms === undefined) return '';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  return (
    <div>
      <h1>Movie Room: {roomCode}</h1>
      <div style={{ border: '1px solid black', padding: '20px', margin: '20px', textAlign: 'center' }}>
        <h2>{currentMovie.title} ({currentMovie.year})</h2>
        {currentMovie.tagline && <p><i>"{currentMovie.tagline}"</i></p>}
        <img src={`${plexUrl}${currentMovie.posterUrl}?X-Plex-Token=${plexToken}`} alt={currentMovie.title} style={{ maxWidth: '300px', maxHeight: '450px' }} />
        <p>{currentMovie.summary}</p>
        {currentMovie.duration !== undefined && <p>Duration: {formatDuration(currentMovie.duration)}</p>}
        {currentMovie.rating !== undefined && <p>Critic Score: {currentMovie.rating} (IMDb Icon Placeholder)</p>}
        {currentMovie.audienceRating !== undefined && <p>Audience Score: {currentMovie.audienceRating} (Rotten Tomatoes Icon Placeholder)</p>}
        <div>
          <button onClick={handleDislike} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>Dislike</button>
          <button onClick={handleLike} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>Like</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePlexMovies } from '../hooks/usePlexMovies';
import { useSocket } from '../hooks/useSocket';
import { Movie, ClientToServerEvents, ServerToClientEvents, SelectedLibrary } from '../types'; // Import SelectedLibrary
import { Socket } from 'socket.io-client';

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>(); // Changed to roomCode
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useSocket();

  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';

  const storedSelectedLibraries = localStorage.getItem('selectedLibraries');
  const selectedLibraries: SelectedLibrary[] = storedSelectedLibraries ? JSON.parse(storedSelectedLibraries) : [];

  const storedSelectedGenres = localStorage.getItem('selectedGenres');
  const selectedGenres: string[] = storedSelectedGenres ? JSON.parse(storedSelectedGenres) : [];

  const storedSelectedContentRatings = localStorage.getItem('selectedContentRatings');
  const selectedContentRatings: string[] = storedSelectedContentRatings ? JSON.parse(storedSelectedContentRatings) : [];

  const storedYearMin = localStorage.getItem('yearMin');
  const yearMin: string | undefined = storedYearMin || undefined;

  const storedYearMax = localStorage.getItem('yearMax');
  const yearMax: string | undefined = storedYearMax || undefined;

  const storedDurationMin = localStorage.getItem('durationMin');
  const durationMin: string | undefined = storedDurationMin || undefined;

  const storedDurationMax = localStorage.getItem('durationMax');
  const durationMax: string | undefined = storedDurationMax || undefined;

  const storedSortOrder = localStorage.getItem('sortOrder');
  const sortOrder: string | undefined = storedSortOrder || undefined;

  const userId = localStorage.getItem('userId') || ''; // Retrieve userId
  const userName = localStorage.getItem('userName') || ''; // Retrieve userName

  const { data: movies, isLoading, isError, error } = usePlexMovies({
    plexUrl,
    plexToken,
    selectedLibraries,
    genre: selectedGenres.join(',') || undefined,
    yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
    yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
    contentRating: selectedContentRatings.join(',') || undefined,
    durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
    durationMax: durationMax ? parseInt(durationMax, 10) : undefined,
    sortOrder: sortOrder,
  });

  useEffect(() => {
    if (socket && roomCode) {
      socket.emit('joinRoom', { roomCode: roomCode || '', user: { id: userId, name: userName } });

      socket.on('userJoined', (room) => {
        console.log(`${room.users[room.users.length - 1].name} joined the room.`);
      });

      socket.on('userLeft', (leftUserId) => {
        console.log(`User ${leftUserId} left the room.`);
      });

      socket.on('movieLiked', ({ userId: likerId, movieId }) => {
        console.log(`User ${likerId} liked movie ${movieId}`);
        // Potentially update UI to show likes
      });

      socket.on('movieDisliked', ({ userId: dislikerId, movieId }) => {
        console.log(`User ${dislikerId} disliked movie ${movieId}`);
        // Potentially update UI to show dislikes
      });
    }

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId: roomCode || '', userId }); // Use roomCode for leaveRoom
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

  if (isLoading) {
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

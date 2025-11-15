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

  useEffect(() => {
    if (socket && roomCode) {
      socket.emit('joinRoom', { roomCode: roomCode || '', user: { id: userId, name: userName } });

      socket.on('roomCreated', (room: Room) => {
        setRoomState(room);
      });

      socket.on('userJoined', (room: Room) => {
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

      socket.on('roomUpdated', (room: Room) => { // New event listener
        setRoomState(room);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { roomId: roomCode || '', userId });
        socket.off('roomCreated');
        socket.off('userJoined');
        socket.off('userLeft');
        socket.off('movieLiked');
        socket.off('movieDisliked');
        socket.off('roomUpdated'); // Clean up new event listener
      }
    };
  }, [socket, roomCode, userId, userName]);

  const handleLike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movie = movies[currentMovieIndex]; // Get the full movie object
      socket.emit('likeMovie', { roomId: roomCode || '', userId, movie }); // Pass the movie object
      setCurrentMovieIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleDislike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].key;
      socket.emit('dislikeMovie', { roomId: roomCode || '', userId, movieId }); // Changed roomId to roomCode
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
      </div> {/* End of main movie display div */}

      {roomState?.likedMovies && roomState.likedMovies.length > 0 && (
        <div style={{ margin: '20px', border: '1px solid lightgray', padding: '10px' }}>
          <h3>Liked Movies</h3>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px' }}>
            {roomState.likedMovies.map((movie) => (
              <div key={movie.key} style={{ flexShrink: 0, textAlign: 'center', width: '100px' }}>
                <img
                  src={`${plexUrl}${movie.posterUrl}?X-Plex-Token=${plexToken}`}
                  alt={movie.title}
                  style={{ width: '100px', height: '150px', objectFit: 'cover' }}
                />
                <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{movie.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;

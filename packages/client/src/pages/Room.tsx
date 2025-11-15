import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePlexMovies } from '../hooks/usePlexMovies';
import { useSocket } from '../hooks/useSocket';
import { Movie, ClientToServerEvents, ServerToClientEvents, Room } from '../types'; // Removed SelectedLibrary
import { Socket } from 'socket.io-client';
import TinderCard from 'react-tinder-card'; // Imported TinderCard

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>(); // Changed to roomCode
  const [roomState, setRoomState] = useState<Room | null>(null); // New state for room object
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useSocket();

  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';

  const userId = localStorage.getItem('userId') || ''; // Retrieve userId
  const userName = localStorage.getItem('userName') || ''; // Retrieve userName

  // State for TinderCard
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function to handle swipe
  const swiped = (direction: string) => { // Removed movieKey, will use currentMovie
    if (!movies || !currentMovie) return;

    if (direction === 'right') {
      handleLike(currentMovie);
    } else if (direction === 'left') {
      handleDislike(currentMovie);
    }
    setCurrentIndex((prevIndex) => prevIndex + 1); // Move to next movie after swipe
  };

  // Function to handle card leaving screen
  const outOfFrame = () => { // Removed movieKey
    // console.log(movieKey + ' left the screen!'); // Removed log
  };

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

  // Modified handleLike and handleDislike to accept movie object and not increment index
  const handleLike = (movie: Movie) => {
    if (socket && movie) {
      socket.emit('likeMovie', { roomId: roomCode || '', userId, movie });
    }
  };

  const handleDislike = (movie: Movie) => {
    if (socket && movie) {
      socket.emit('dislikeMovie', { roomId: roomCode || '', userId, movieId: movie.key }); // Dislike still uses movieId
    }
  };

  // Functions to trigger swipe from buttons
  const swipe = (direction: string) => { // Removed async, no longer swiping childRefs
    if (!movies || !currentMovie) return;

    if (direction === 'left') {
      handleDislike(currentMovie);
    } else if (direction === 'right') {
      handleLike(currentMovie);
    }
    setCurrentIndex((prevIndex) => prevIndex + 1); // Move to next movie after swipe
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

  const currentMovie: Movie | undefined = movies[currentIndex]; // Use currentIndex for current movie

  if (!currentMovie) {
    return <div>No more movies to swipe!</div>;
  }

  const formatDuration = (ms: number | undefined) => { // Re-introduced
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
      <div style={{
        position: 'relative',
        width: '300px', // Fixed width for the card container
        height: '500px', // Fixed height for the card container
        margin: '20px auto',
      }}>
        {currentMovie && ( // Only render TinderCard if currentMovie exists
          <TinderCard
            className='swipe'
            key={currentMovie.key}
            onSwipe={(dir: string) => swiped(dir)} // Pass dir directly
            onCardLeftScreen={() => outOfFrame()} // No movieKey needed
            preventSwipe={['up', 'down']}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          >
            <div style={{
              position: 'relative',
              backgroundColor: '#fff',
              width: '100%',
              height: '100%',
              boxShadow: '0px 0px 60px 0px rgba(0,0,0,0.30)',
              borderRadius: '20px',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: `url(${plexUrl}${currentMovie.posterUrl}?X-Plex-Token=${plexToken})`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              color: '#fff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
            }}>

              <p>{currentMovie.summary}</p> {/* Display summary */}
              {currentMovie.duration !== undefined && <p>Duration: {formatDuration(currentMovie.duration)}</p>} {/* Display duration */}
              {currentMovie.rating !== undefined && <p>Critic Score: {currentMovie.rating} (IMDb Icon Placeholder)</p>} {/* Display rating */}
              {currentMovie.audienceRating !== undefined && <p>Audience Score: {currentMovie.audienceRating} (Rotten Tomatoes Icon Placeholder)</p>} {/* Display audience rating */}
            </div>
          </TinderCard>
        )}
      </div>

      {/* Buttons to trigger swipe */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => swipe('left')} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>Dislike</button>
        <button onClick={() => swipe('right')} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>Like</button>
      </div>

      {/* Duplicated Movie Details Section (for testing separation) */}
      {currentMovie && (
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px', border: '1px dashed gray', marginTop: '20px' }}>
          <h2>{currentMovie.title} ({currentMovie.year})</h2>
          {currentMovie.tagline && <p><i>"{currentMovie.tagline}"</i></p>}
          <p>{currentMovie.summary}</p>
          {currentMovie.duration !== undefined && <p>Duration: {formatDuration(currentMovie.duration)}</p>}
          {currentMovie.rating !== undefined && <p>Critic Score: {currentMovie.rating} (IMDb Icon Placeholder)</p>}
          {currentMovie.audienceRating !== undefined && <p>Audience Score: {currentMovie.audienceRating} (Rotten Tomatoes Icon Placeholder)</p>}
        </div>
      )}

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

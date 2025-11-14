import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePlexMovies } from '../hooks/usePlexMovies';
import { useSocket } from '../hooks/useSocket';
import { Movie, ClientToServerEvents, ServerToClientEvents } from '../types';
import { Socket } from 'socket.io-client';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useSocket();

  // For now, hardcode these values. In a real scenario, they would come from room creation or context.
  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';
  const libraryKey = '1'; // Assuming a default movie library for now
  const userId = 'user123'; // Replace with actual user ID
  const username = 'TestUser'; // Replace with actual username

  const { data: movies, isLoading, isError, error } = usePlexMovies({
    plexUrl,
    plexToken,
    libraryKey,
  });

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('joinRoom', { roomId, userId, username });

      socket.on('userJoined', (user) => {
        console.log(`${user.username} joined the room.`);
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
        socket.emit('leaveRoom', { roomId: roomId || '', userId });
        socket.off('userJoined');
        socket.off('userLeft');
        socket.off('movieLiked');
        socket.off('movieDisliked');
      }
    };
  }, [socket, roomId, userId, username]);

  const handleLike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].key;
      socket.emit('likeMovie', { roomId: roomId || '', userId, movieId });
      console.log(`Liked movie: ${movies[currentMovieIndex].title}`);
      setCurrentMovieIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleDislike = () => {
    if (socket && movies && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].key;
      socket.emit('dislikeMovie', { roomId: roomId || '', userId, movieId });
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

  const currentMovie = movies[currentMovieIndex];

  if (!currentMovie) {
    return <div>No more movies to swipe!</div>;
  }

  return (
    <div>
      <h1>Movie Room: {roomId}</h1>
      <div style={{ border: '1px solid black', padding: '20px', margin: '20px', textAlign: 'center' }}>
        <h2>{currentMovie.title} ({currentMovie.year})</h2>
        <img src={`${plexUrl}${currentMovie.posterUrl}?X-Plex-Token=${plexToken}`} alt={currentMovie.title} style={{ maxWidth: '300px', maxHeight: '450px' }} />
        <p>{currentMovie.summary}</p>
        <div>
          <button onClick={handleDislike} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>Dislike</button>
          <button onClick={handleLike} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>Like</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

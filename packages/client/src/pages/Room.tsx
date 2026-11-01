import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '../hooks/useSocket';
import { Movie, ClientToServerEvents, ServerToClientEvents, Room } from '../types'; // Removed SelectedLibrary
import { Socket } from 'socket.io-client';
import TinderCard from 'react-tinder-card'; // Imported TinderCard
import MovieDetailsModal from '../components/MovieDetailsModal'; // Import MovieDetailsModal
import axios from 'axios'; // Import axios
import InviteModal from '../components/InviteModal';
import MatchOverlay from '../components/MatchOverlay';
import { posterSrc } from '../api';

// TinderCard re-attaches its touch listeners whenever these props change identity, which
// resets the in-progress drag; keep them stable across re-renders (see swipe handlers below).
const PREVENT_SWIPE = ['up', 'down'];

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>(); // Changed to roomCode
  const [roomState, setRoomState] = useState<Room | null>(null); // New state for room object
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = useSocket();

  // State for movie details modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';
  const [plexServerId, setPlexServerId] = useState<string | null>(null); // State for Plex server ID

  // Guests arriving from an invite link/QR have no identity yet; the name gate below sets it
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [nameInput, setNameInput] = useState('');

  const [roomNotFound, setRoomNotFound] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [match, setMatch] = useState<Movie | null>(null);
  const [pendingSwipe, setPendingSwipe] = useState<string | null>(null); // direction a release would commit

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
    setPendingSwipe(null);
    setCurrentIndex((prevIndex) => prevIndex + 1); // Move to next movie after swipe
  };

  // Stable wrappers so a re-render mid-drag (a like, someone joining, the LIKE stamp)
  // doesn't make TinderCard drop the gesture and snap the card back
  const swipedRef = useRef(swiped);
  swipedRef.current = swiped;
  const onCardSwipe = useCallback((dir: string) => swipedRef.current(dir), []);
  const onRequirementFulfilled = useCallback((dir: string) => setPendingSwipe(dir), []);
  const onRequirementUnfulfilled = useCallback(() => setPendingSwipe(null), []);

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  // One deck per room, loaded server-side with the host's Plex session, so everyone
  // (including guests without Plex) swipes the same movies in the same order
  const { data: movies, isLoading, isError, error } = useQuery<Movie[], Error>({
    queryKey: ['roomDeck', roomCode],
    queryFn: async () => (await axios.get<Movie[]>(`/api/rooms/${roomCode}/movies`)).data,
    enabled: !!roomState,
    staleTime: Infinity,
  });

  const joinAs = (e: React.FormEvent) => {
    e.preventDefault();
    const id = uuidv4();
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', nameInput.trim());
    setUserId(id);
    setUserName(nameInput.trim());
  };

  useEffect(() => {
    if (socket && roomCode && userId) {
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

      socket.on('roomNotFound', () => setRoomNotFound(true));

      socket.on('match', (movie: Movie) => setMatch(movie));
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
        socket.off('roomNotFound');
        socket.off('match');
      }
    };
  }, [socket, roomCode, userId, userName]);

  // Fetch Plex server ID
  useEffect(() => {
    const fetchPlexServerId = async () => {
      if (plexUrl && plexToken) {
        try {
          const response = await axios.get(`${plexUrl}/identity`, {
            headers: {
              'X-Plex-Token': plexToken,
              'Accept': 'application/xml', // Request XML response
            },
          });
          // Parse XML response to get machineIdentifier
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(response.data as string, 'text/xml');
          const machineIdentifier = xmlDoc.documentElement.getAttribute('machineIdentifier');
          if (machineIdentifier) {
            setPlexServerId(machineIdentifier);
          }
        } catch (error) {
          console.error('Failed to fetch Plex server ID:', error);
        }
      }
    };

    fetchPlexServerId();
  }, [plexUrl, plexToken]); // Re-run when plexUrl or plexToken changes

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

  if (!userId || !userName) {
    return (
      <form onSubmit={joinAs}>
        <h1>Join room {roomCode}</h1>
        <input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder='Your name'
        />
        <button type='submit' disabled={!nameInput.trim()} style={{ marginLeft: '10px' }}>Start swiping</button>
      </form>
    );
  }

  if (roomNotFound) {
    return <div>Room {roomCode} doesn't exist anymore. Ask for a new invite.</div>;
  }

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
    <div className='room'>
      <header className='roomHeader'>
        <span className='roomChip'>Room {roomState.code}</span>
        <span className='people'>{roomState.users.map((user) => user.name).join(', ')}</span>
        <button onClick={() => setIsInviteOpen(true)}>Invite</button>
      </header>

      <div className='cardContainer'>
        {currentMovie && ( // Only render TinderCard if currentMovie exists
          <TinderCard
            className='swipe'
            key={currentMovie.key}
            onSwipe={onCardSwipe}
            preventSwipe={PREVENT_SWIPE}
            // Distance, not release velocity: the default reads only the last touchmove's
            // speed, so a hard swipe that slows as the finger lifts snapped back unregistered
            swipeRequirementType='position'
            swipeThreshold={100}
            onSwipeRequirementFulfilled={onRequirementFulfilled}
            onSwipeRequirementUnfulfilled={onRequirementUnfulfilled}
          >
            <div className='card' style={{ backgroundImage: `url(${posterSrc(roomCode || '', currentMovie.posterUrl)})` }}>
              {pendingSwipe === 'right' && <span className='stamp like'>LIKE</span>}
              {pendingSwipe === 'left' && <span className='stamp nope'>NOPE</span>}
            </div>
          </TinderCard>
        )}
      </div>

      <div className='swipeButtons'>
        <button className='nope' aria-label='Dislike' onClick={() => swipe('left')}>✕</button>
        <button className='like' aria-label='Like' onClick={() => swipe('right')}>♥</button>
      </div>

      {/* Tap for the full details modal; kept short so card + buttons stay on one screen */}
      <div className='movieInfo' onClick={() => handleMovieClick(currentMovie)}>
        <h2>{currentMovie.title}{currentMovie.year ? <span className='year'> ({currentMovie.year})</span> : null}</h2>
        <p className='meta'>
          {[
            currentMovie.duration !== undefined && formatDuration(currentMovie.duration),
            currentMovie.contentRating,
            currentMovie.rating !== undefined && `Critics ${currentMovie.rating}`,
            currentMovie.audienceRating !== undefined && `Audience ${currentMovie.audienceRating}`,
          ].filter(Boolean).join(' · ')}
        </p>
        {currentMovie.summary && <p className='summary'>{currentMovie.summary}</p>}
      </div>

      {roomState.likedMovies.length > 0 && (
        <section className='matches'>
          <h3>Matches ({roomState.likedMovies.length})</h3>
          <div className='matchStrip'>
            {roomState.likedMovies.map((movie) => (
              <button key={movie.key} className='matchItem' onClick={() => handleMovieClick(movie)}>
                <img src={posterSrc(roomCode || '', movie.posterUrl)} alt='' loading='lazy' />
                <span>{movie.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isModalOpen && selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setIsModalOpen(false)}
          plexUrl={plexUrl}
          plexToken={plexToken}
          plexServerId={plexServerId} // Pass plexServerId to modal
          posterSrc={posterSrc(roomCode || '', selectedMovie.posterUrl)}
        />
      )}

      {isInviteOpen && <InviteModal roomCode={roomState.code} onClose={() => setIsInviteOpen(false)} />}

      {match && <MatchOverlay roomCode={roomState.code} movie={match} onClose={() => setMatch(null)} />}
    </div>
  );
};

export default RoomPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '../hooks/useSocket';
import { Movie, Room } from '../types';
import TinderCard from 'react-tinder-card';
import MovieDetailsModal from '../components/MovieDetailsModal';
import axios from 'axios';
import InviteModal from '../components/InviteModal';
import MatchOverlay from '../components/MatchOverlay';
import HalloweenAmbience from '../components/halloween/HalloweenAmbience';
import LottieIcon from '../components/halloween/LottieIcon';
import { posterSrc } from '../api';
import { getResumeIndex, getTally } from '../roomHelpers';

// TinderCard re-attaches its touch listeners whenever these props change identity, which
// resets the in-progress drag; keep them stable across re-renders (see swipe handlers below).
const PREVENT_SWIPE = ['up', 'down'];

type RoomPreview = { code: string; curated: 'halloween' | null; userCount: number };

const RoomPage: React.FC = () => {
  const { roomCode = '' } = useParams<{ roomCode: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const socket = useSocket();
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [nameInput, setNameInput] = useState(localStorage.getItem('userName') || '');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [match, setMatch] = useState<Movie | null>(null);
  const [pendingSwipe, setPendingSwipe] = useState<string | null>(null);
  const [swipeBurst, setSwipeBurst] = useState<{ direction: string; key: number } | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstKey = useRef(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const plexUrl = localStorage.getItem('plexUrl') || '';
  const plexToken = localStorage.getItem('plexToken') || '';
  const [plexServerId, setPlexServerId] = useState<string | null>(null);
  const positionKey = `tindarr:pos:${roomCode}`;
  // A name stored by an earlier Tindarr visit isn't consent to join this lobby under it: the
  // name screen shows (prefilled) the first time this browser opens each room
  const joinedKey = `tindarr:joined:${roomCode}`;
  const [joined, setJoined] = useState(() => !!userId && localStorage.getItem(joinedKey) === userId);
  const [renaming, setRenaming] = useState(false);
  const userNameRef = useRef(userName);
  userNameRef.current = userName;
  useEffect(() => () => { if (burstTimer.current) clearTimeout(burstTimer.current); }, []);

  const preview = useQuery<RoomPreview>({
    queryKey: ['roomPreview', roomCode],
    queryFn: async () => (await axios.get<RoomPreview>(`/api/rooms/${roomCode}`)).data,
    enabled: !!roomCode,
    retry: false,
  });

  const { data: movies, isLoading, isError, error } = useQuery<Movie[], Error>({
    queryKey: ['roomDeck', roomCode],
    queryFn: async () => (await axios.get<Movie[]>(`/api/rooms/${roomCode}/movies`)).data,
    enabled: !!roomState,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (movies) setCurrentIndex(getResumeIndex(movies, localStorage.getItem(positionKey)));
  }, [movies, positionKey]);

  // A boolean, not preview.data: the preview refetches on focus with a new userCount, and
  // re-running this effect would emit leaveRoom, which can hand the others a premature match
  const lobbyFound = !!preview.data;
  useEffect(() => {
    if (!socket || !roomCode || !userId || !joined || !lobbyFound) return;
    // Name via a ref: a rename re-joins (below) rather than re-running this effect, whose
    // cleanup emits leaveRoom and could hand the others a premature match
    const join = () => socket.emit('joinRoom', { roomCode, user: { id: userId, name: userNameRef.current } });
    const update = (room: Room) => { setRoomState(room); setRoomNotFound(false); };
    const notFound = () => setRoomNotFound(true);
    socket.on('connect', join);
    socket.on('userJoined', update);
    socket.on('userLeft', update);
    socket.on('roomUpdated', update);
    socket.on('roomNotFound', notFound);
    socket.on('match', setMatch);
    if (socket.connected) join();
    return () => {
      socket.off('connect', join);
      socket.off('userJoined', update);
      socket.off('userLeft', update);
      socket.off('roomUpdated', update);
      socket.off('roomNotFound', notFound);
      socket.off('match', setMatch);
      socket.emit('leaveRoom', { roomId: roomCode, userId });
    };
  }, [socket, roomCode, userId, joined, lobbyFound]);

  useEffect(() => {
    if (roomState && userId && userName && searchParams.get('invite') === '1') {
      setIsInviteOpen(true);
      setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('invite'); return next; }, { replace: true });
    }
  }, [roomState, userId, userName, searchParams, setSearchParams]);

  // Keep the host's Plex server ID for the existing details link.
  useEffect(() => {
    if (!plexUrl || !plexToken) return;
    axios.get(`${plexUrl}/identity`, { headers: { 'X-Plex-Token': plexToken, Accept: 'application/xml' } })
      .then(response => {
        const xml = new DOMParser().parseFromString(response.data as string, 'text/xml');
        setPlexServerId(xml.documentElement.getAttribute('machineIdentifier'));
      })
      .catch(error => console.error('Failed to fetch Plex server ID:', error));
  }, [plexUrl, plexToken]);

  const joinAs = (event: React.FormEvent) => {
    event.preventDefault();
    const name = nameInput.trim();
    if (!name || !preview.data) return;
    const id = userId || localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem(joinedKey, id);
    setUserId(id);
    setUserName(name);
    setRenaming(false);
    if (joined) socket?.emit('joinRoom', { roomCode, user: { id, name } }); // rename in place
    else setJoined(true);
  };

  const advance = (direction: string) => {
    if (!movies || currentIndex === null || !movies[currentIndex]) return;
    if (halloween && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && (direction === 'left' || direction === 'right')) {
      if (burstTimer.current) clearTimeout(burstTimer.current);
      const key = ++burstKey.current;
      setSwipeBurst({ direction, key });
      burstTimer.current = setTimeout(() => setSwipeBurst(current => current?.key === key ? null : current), direction === 'right' ? 900 : 800);
    }
    if (direction === 'right') socket?.emit('likeMovie', { roomId: roomCode, userId, movie: movies[currentIndex] });
    if (direction === 'left') socket?.emit('dislikeMovie', { roomId: roomCode, userId, movieId: movies[currentIndex].key });
    localStorage.setItem(positionKey, movies[currentIndex + 1]?.key ?? '__done__');
    setPendingSwipe(null);
    setCurrentIndex(currentIndex + 1);
  };
  const swiped = (direction: string) => advance(direction);

  // Stable wrappers so a re-render mid-drag (a like, someone joining, the LIKE stamp)
  // doesn't make TinderCard drop the gesture and snap the card back
  const swipedRef = useRef(swiped);
  swipedRef.current = swiped;
  const onCardSwipe = useCallback((dir: string) => swipedRef.current(dir), []);
  const onRequirementFulfilled = useCallback((dir: string) => setPendingSwipe(dir), []);
  const onRequirementUnfulfilled = useCallback(() => setPendingSwipe(null), []);

  const showDetails = (movie: Movie) => { setSelectedMovie(movie); setIsModalOpen(true); };
  const missing = (preview.isError && !preview.data) || roomNotFound; // a failed background refetch mid-game isn't "missing"
  const halloween = preview.data?.curated === 'halloween' || roomState?.curated === 'halloween';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pumpkin = halloween && !reducedMotion ? <LottieIcon name='jack-o-lantern' /> : halloween ? '🎃' : '🎬';
  const credit = halloween && <small className='emojiCredit'>Animated emoji: Google Noto · CC BY 4.0</small>;

  if (missing) return <main className={`roomGate ${halloween ? 'halloween' : ''}`}><div className='gateCard'><span className='gateIcon'>🎃</span><h1>This lobby isn't open yet</h1><p>Ask the host to open it, then try again.</p><button onClick={() => { setRoomNotFound(false); void preview.refetch(); }} aria-label='Retry opening room'>Retry</button></div></main>;
  if (preview.isLoading) return <main className='roomGate'><p>Looking for the lobby…</p></main>;
  if (!userId || !userName || !joined || renaming) return (
    <main className={`roomGate ${halloween ? 'halloween' : ''}`}>
      {halloween && <HalloweenAmbience />}
      <form className='gateCard' onSubmit={joinAs}>
        <span className='gateIcon' aria-hidden='true'>{pumpkin}</span>
        <h1>{halloween ? 'Halloween Movie Night' : `Join room ${roomCode}`}</h1>
        <p>{renaming ? 'Change the name friends see' : `Pick a name to join · ${preview.data?.userCount ?? 0} here`}</p>
        <label htmlFor='joinName'>Your name</label>
        <input id='joinName' data-testid='name-input' autoComplete='off' autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder='e.g. Sam' />
        <button data-testid='join-button' type='submit' disabled={!nameInput.trim()}>{renaming ? 'Save name' : 'Join the lobby'}</button>
        {renaming && <button type='button' onClick={() => { setNameInput(userName); setRenaming(false); }}>Cancel</button>}
        {credit}
      </form>
    </main>
  );
  if (!roomState || isLoading || currentIndex === null) return <main className='roomGate'><p>Loading movies…</p></main>;
  if (isError) return <main className='roomGate'><p>Error loading movies: {error?.message}</p></main>;

  const currentMovie = movies?.[currentIndex];
  const tally = getTally(movies || [], roomState);
  const done = !currentMovie;
  const formatDuration = (ms?: number) => ms === undefined ? '' : `${Math.floor(ms / 3600000) ? `${Math.floor(ms / 3600000)}h ` : ''}${Math.floor(ms % 3600000 / 60000)}m`;

  return <main className={`room ${halloween ? 'halloween' : ''} ${done ? 'roomDone' : ''}`}>
    {halloween && <HalloweenAmbience />}
    <header className='roomHeader'>
      <div className='roomHeaderTop'><span className='roomChip'>{halloween ? <>{reducedMotion ? '🎃' : <LottieIcon name='jack-o-lantern' className='chipPumpkin' />} Movie Night</> : `Room ${roomState.code}`}</span><button className='inviteButton' aria-label='Invite friends' onClick={() => setIsInviteOpen(true)}>Invite</button></div>
      <div className='people' data-testid='people' aria-label="Who's here">{roomState.users.map(user => <span className='personChip' key={user.id}>{user.name}</span>)}<button className='renameButton' data-testid='rename-button' aria-label='Change your name' onClick={() => { setNameInput(userName); setRenaming(true); }}>Change name</button></div>
      <p className='roomStats'>{roomState.users.length} here · {roomState.likedMovies.length} matches</p>
      {roomState.users.length === 1 && <p className='waitingHint'>Waiting for friends — matches need at least 2</p>}
    </header>

    {currentMovie ? <>
      <div className='cardContainer'>
        {swipeBurst?.direction === 'right' && <span className='swipeLikeBurst' data-testid='swipe-burst' key={swipeBurst.key} aria-hidden='true' />}
        <TinderCard className='swipe' key={currentMovie.key} onSwipe={onCardSwipe} preventSwipe={PREVENT_SWIPE} swipeRequirementType='position' swipeThreshold={100} onSwipeRequirementFulfilled={onRequirementFulfilled} onSwipeRequirementUnfulfilled={onRequirementUnfulfilled}>
        <div className='card' style={{ backgroundImage: `url(${posterSrc(roomCode, currentMovie.posterUrl)})` }}>
          {pendingSwipe === 'right' && <span className='stamp like'>LIKE</span>}{pendingSwipe === 'left' && <span className='stamp nope'>NOPE</span>}
        </div>
        </TinderCard>
        {swipeBurst?.direction === 'right' && <span className='likePumpkin' key={`pumpkin-${swipeBurst.key}`} aria-hidden='true'><LottieIcon name='jack-o-lantern' /></span>}
        {swipeBurst?.direction === 'left' && <span className='swipeNopeBurst' data-testid='swipe-burst' key={swipeBurst.key} aria-hidden='true'>{Array.from({ length: 3 }, (_, i) => <span className='swipeBat' key={i} style={{ '--angle': `${-145 + i * 55}deg`, '--distance': `${85 + i * 18}px` } as React.CSSProperties}><LottieIcon name='bat' /></span>)}</span>}
      </div>
      <div className='swipeButtons'><button className='nope' data-testid='nope-button' aria-label='Nope, next movie' onClick={() => advance('left')}>✕</button><button className='like' data-testid='like-button' aria-label='Like this movie' onClick={() => advance('right')}>♥</button></div>
      <button className='movieInfo' aria-label={`Details for ${currentMovie.title}`} onClick={() => showDetails(currentMovie)}>
        <h2>{currentMovie.title}{currentMovie.year && <span className='year'> ({currentMovie.year})</span>}</h2>
        <span className='meta'>{[formatDuration(currentMovie.duration), currentMovie.contentRating, currentMovie.rating !== undefined && `Critics ${currentMovie.rating}`, currentMovie.audienceRating !== undefined && `Audience ${currentMovie.audienceRating}`].filter(Boolean).join(' · ')}</span>
        {currentMovie.summary && <span className='summary'>{currentMovie.summary}</span>}
      </button>
      {roomState.likedMovies.length > 0 && <section className='matches'><h3>Matches ({roomState.likedMovies.length})</h3><div className='matchStrip'>{roomState.likedMovies.map(movie => <button key={movie.key} className='matchItem' aria-label={`Details for ${movie.title}`} onClick={() => showDetails(movie)}><img src={posterSrc(roomCode, movie.posterUrl)} alt='' loading='lazy' /><span>{movie.title}</span></button>)}</div></section>}
    </> : <section className='deckDone' data-testid='deck-done'>
      <span className='gateIcon' aria-hidden='true'>{pumpkin}</span><h1>You've seen them all</h1><p>Here's what the group liked so far.</p>{credit}
      {tally.length === 0 ? <p>No likes yet. Check back as friends finish swiping.</p> : <div className='tallyList'>{tally.map(({ movie, count, matched }) => <button className={`tallyRow ${matched ? 'tallyMatch' : ''}`} data-testid='tally-row' key={movie.key} aria-label={`Details for ${movie.title}, ${count} of ${roomState.users.length} likes`} onClick={() => showDetails(movie)}><img src={posterSrc(roomCode, movie.posterUrl)} alt='' loading='lazy' /><span className='tallyTitle'>{matched && <strong>Match · </strong>}{movie.title}</span><span className='tallyCount'>{count}/{roomState.users.length} ❤</span></button>)}</div>}
    </section>}

    {isModalOpen && selectedMovie && <MovieDetailsModal movie={selectedMovie} onClose={() => setIsModalOpen(false)} plexUrl={plexUrl} plexToken={plexToken} plexServerId={plexServerId} posterSrc={posterSrc(roomCode, selectedMovie.posterUrl)} />}
    {isInviteOpen && <InviteModal roomCode={roomState.code} halloween={halloween} onClose={() => setIsInviteOpen(false)} />}
    {match && <MatchOverlay roomCode={roomState.code} movie={match} halloween={halloween} onClose={() => setMatch(null)} />}
  </main>;
};

export default RoomPage;

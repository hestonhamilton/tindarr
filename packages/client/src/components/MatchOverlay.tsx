import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Movie, Player } from '../types';
import { posterSrc } from '../api';
import { BatIcon } from './halloween/HalloweenAmbience';

interface MatchOverlayProps {
  roomCode: string;
  movie: Movie;
  onClose: () => void;
  halloween?: boolean;
}

const CONFETTI_COLORS = ['#E5A000', '#ff4d6d', '#4dabf7', '#51cf66', '#ffd43b'];
const HALLOWEEN_COLORS = ['#ff7518', '#a664b7', '#6bd66b', '#fff3e8'];

const MatchOverlay: React.FC<MatchOverlayProps> = ({ roomCode, movie, onClose, halloween = false }) => {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loadPlayers = async () => {
    setPlayers(null);
    try {
      const response = await axios.get<{ serverId: string; players: Player[] }>(`/api/rooms/${roomCode}/players`);
      setPlayers(response.data.players);
      setServerId(response.data.serverId);
    } catch {
      setPlayers([]);
    }
  };

  useEffect(() => {
    navigator.vibrate?.([200, 100, 200]);
    loadPlayers();
  }, [movie.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = async (player: Player) => {
    setStatus(`Starting on ${player.name}…`);
    try {
      await axios.post(`/api/rooms/${roomCode}/play`, { movieKey: movie.key, playerId: player.id });
      setStatus(`Playing on ${player.name}. Enjoy the movie!`);
    } catch {
      setStatus(`${player.name} didn't respond. Is Plex open on it?`);
    }
  };

  return (
    <div className={`overlay match ${halloween ? 'halloweenMatch' : ''}`} data-testid='match-overlay'>
      <div className='confetti' aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} style={{
            left: `${(i * 37) % 100}%`,
            background: (halloween ? HALLOWEEN_COLORS : CONFETTI_COLORS)[i % (halloween ? HALLOWEEN_COLORS : CONFETTI_COLORS).length],
            animationDelay: `${(i % 10) * 0.15}s`,
          }} />
        ))}
      </div>
      <h1>It's a match!</h1>
      {halloween ? <div className='matchPosterWrap'>
        {motion && <><span className='matchGlow' aria-hidden='true' /><span className='matchBats' aria-hidden='true'>{Array.from({ length: 12 }, (_, i) => <span className='matchBat' key={i} style={{ '--angle': `${i * 30}deg`, '--distance': `${90 + (i % 4) * 22}px` } as React.CSSProperties}><BatIcon /></span>)}</span></>}
        {movie.posterUrl && <img className='matchPoster' src={posterSrc(roomCode, movie.posterUrl)} alt={movie.title} />}
      </div> : movie.posterUrl && <img className='matchPoster' src={posterSrc(roomCode, movie.posterUrl)} alt={movie.title} />}
      <h2>{movie.title}{movie.year ? ` (${movie.year})` : ''}</h2>

      <div className='actions'>
        {players === null && <p>Looking for TVs…</p>}
        {players?.map((player) => (
          <button key={player.id} className='play' aria-label={`Play on ${player.name}`} onClick={() => play(player)}>▶ Play on {player.name}</button>
        ))}
        {players?.length === 0 && (
          <p>No TVs ready for remote play. Open Plex on the TV, then <button aria-label='Look for TVs again' onClick={loadPlayers}>look again</button></p>
        )}
      </div>
      {/* Catch-all for any device not listed above: Plex's own cast/player picker takes over */}
      {serverId && (
        <a
          className='openInPlex'
          href={`https://app.plex.tv/desktop/#!/server/${serverId}/details?key=${encodeURIComponent(`/library/metadata/${movie.key}`)}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          Open in Plex
        </a>
      )}
      {status && <p>{status}</p>}
      <button aria-label='Keep swiping' onClick={onClose}>Keep swiping</button>
    </div>
  );
};

export default MatchOverlay;

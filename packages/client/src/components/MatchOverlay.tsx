import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Movie, Player } from '../types';
import { posterSrc } from '../api';

interface MatchOverlayProps {
  roomCode: string;
  movie: Movie;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#E5A000', '#ff4d6d', '#4dabf7', '#51cf66', '#ffd43b'];

const MatchOverlay: React.FC<MatchOverlayProps> = ({ roomCode, movie, onClose }) => {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);

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
    <div className='overlay match'>
      <div className='confetti' aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 10) * 0.15}s`,
          }} />
        ))}
      </div>
      <h1>It's a match!</h1>
      {movie.posterUrl && <img className='matchPoster' src={posterSrc(roomCode, movie.posterUrl)} alt={movie.title} />}
      <h2>{movie.title}{movie.year ? ` (${movie.year})` : ''}</h2>

      <div className='actions'>
        {players === null && <p>Looking for TVs…</p>}
        {players?.map((player) => (
          <button key={player.id} className='play' onClick={() => play(player)}>▶ Play on {player.name}</button>
        ))}
        {players?.length === 0 && (
          <p>No TVs ready for remote play. Open Plex on the TV, then <button onClick={loadPlayers}>look again</button></p>
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
      <button onClick={onClose}>Keep swiping</button>
    </div>
  );
};

export default MatchOverlay;

import React from 'react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie;
  onClose: () => void;
  plexUrl: string;
  plexToken: string;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ movie, onClose, plexUrl, plexToken }) => {
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#363a42', // Changed to a dark gray, slightly lighter than the app's background
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        color: '#fff', // Text color remains white
      }} onClick={(e) => e.stopPropagation()}> {/* Prevent click from closing modal */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
        }}>X</button>
        <h2>{movie.title} ({movie.year})</h2>
        {movie.tagline && <p><i>"{movie.tagline}"</i></p>}
        <p>{movie.summary}</p>
        {movie.duration !== undefined && <p>Duration: {formatDuration(movie.duration)}</p>}
        {movie.rating !== undefined && <p>Critic Score: {movie.rating} (IMDb Icon Placeholder)</p>}
        {movie.audienceRating !== undefined && <p>Audience Score: {movie.audienceRating} (Rotten Tomatoes Icon Placeholder)</p>}
        {movie.posterUrl && (
          <img
            src={`${plexUrl}${movie.posterUrl}?X-Plex-Token=${plexToken}`}
            alt={movie.title}
            style={{ maxWidth: '100%', height: 'auto', marginTop: '15px', borderRadius: '5px' }}
          />
        )}
      </div>
    </div>
  );
};

export default MovieDetailsModal;

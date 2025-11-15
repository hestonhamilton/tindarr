import React from 'react';
import { useParams } from 'react-router-dom';

const MatchPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  // In a real scenario, matched movies would be passed as state or fetched from an API
  const matchedMovies: string[] = []; // Placeholder for matched movies

  return (
    <div>
      <h1>Matches for Room: {roomId}</h1>
      {matchedMovies.length > 0 ? (
        <ul>
          {matchedMovies.map((movieTitle, index) => (
            <li key={index}>{movieTitle}</li>
          ))}
        </ul>
      ) : (
        <p>No matches yet. Keep swiping!</p>
      )}
    </div>
  );
};

export default MatchPage;

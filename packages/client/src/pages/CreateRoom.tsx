import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlexLibraries } from '../hooks/usePlexLibraries';
import { useMovieCount } from '../hooks/useMovieCount';
import { Library } from '../types';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: libraries, isLoading: isLoadingLibraries, isError: isErrorLibraries, error: errorLibraries } = usePlexLibraries();
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [genre, setGenre] = useState<string>('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [contentRating, setContentRating] = useState<string>('');

  const { data: movieCount, isLoading: isLoadingMovieCount, isError: isErrorMovieCount, error: errorMovieCount } = useMovieCount({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    libraryKeys: selectedLibraries,
    genre: genre || undefined,
    yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
    yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
    contentRating: contentRating || undefined,
  });

  const handleLibraryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedLibraries((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((libraryId) => libraryId !== value)
    );
  };

  const handleCreateRoom = () => {
    // Store selected library keys in localStorage
    localStorage.setItem('selectedLibraryKeys', JSON.stringify(selectedLibraries));

    // In a real scenario, this would make an API call to create a room and get a real roomId
    const placeholderRoomId = 'test-room-123';
    navigate(`/room/${placeholderRoomId}`);
  };

  if (isLoadingLibraries) {
    return <div>Loading libraries...</div>;
  }

  if (isErrorLibraries) {
    return <div>Error loading libraries: {errorLibraries?.message}</div>;
  }

  return (
    <div>
      <h1>Create New Room</h1>
      <h2>Select Libraries</h2>
      {libraries?.map((library: Library) => (
        <div key={library.key}>
          <input
            type="checkbox"
            id={library.key}
            value={library.key}
            checked={selectedLibraries.includes(library.key)}
            onChange={handleLibraryChange}
          />
          <label htmlFor={library.key}>{library.title}</label>
        </div>
      ))}

      <h2>Filters</h2>
      <div>
        <label htmlFor="genre">Genre:</label>
        <input
          type="text"
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="yearMin">Year Min:</label>
        <input
          type="number"
          id="yearMin"
          value={yearMin}
          onChange={(e) => setYearMin(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="yearMax">Year Max:</label>
        <input
          type="number"
          id="yearMax"
          value={yearMax}
          onChange={(e) => setYearMax(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="contentRating">Content Rating:</label>
        <input
          type="text"
          id="contentRating"
          value={contentRating}
          onChange={(e) => setContentRating(e.target.value)}
        />
      </div>

      <h2>Movie Count Preview</h2>
      {isLoadingMovieCount && <div>Loading movie count...</div>}
      {isErrorMovieCount && <div>Error loading movie count: {errorMovieCount?.message}</div>}
      {movieCount !== undefined && <div>{movieCount} movies match your criteria.</div>}

      <button onClick={handleCreateRoom} disabled={selectedLibraries.length === 0 || movieCount === 0}>
        Create Room
      </button>
    </div>
  );
};

export default CreateRoomPage;



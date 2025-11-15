import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlexLibraries } from '../hooks/usePlexLibraries';
import { useMovieCount } from '../hooks/useMovieCount';
import { usePlexGenres } from '../hooks/usePlexGenres'; // Import usePlexGenres
import { Library } from '../types';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: libraries, isLoading: isLoadingLibraries, isError: isErrorLibraries, error: errorLibraries } = usePlexLibraries();
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]); // New state for selected genres
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [contentRating, setContentRating] = useState<string>('');
  const [showAllGenres, setShowAllGenres] = useState(false); // New state for showing all genres

  // Fetch genres based on selected libraries
  const { data: genres, isLoading: isLoadingGenres, isError: isErrorGenres, error: errorGenres } = usePlexGenres({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    libraryKeys: selectedLibraries,
  });

  const { data: movieCount, isLoading: isLoadingMovieCount, isError: isErrorMovieCount, error: errorMovieCount } = useMovieCount({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    libraryKeys: selectedLibraries,
    genre: selectedGenres.join(',') || undefined, // Pass selected genres as a comma-separated string
    yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
    yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
    contentRating: contentRating || undefined,
  });

  const handleLibraryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedLibraries((prevSelected) => {
      const newSelected = checked
        ? [...prevSelected, value]
        : prevSelected.filter((libraryId) => libraryId !== value);
      // Clear selected genres when libraries change
      setSelectedGenres([]);
      return newSelected;
    });
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedGenres((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((genreName) => genreName !== value)
    );
  };

  const handleCreateRoom = () => {
    // Store selected library keys and genres in localStorage
    localStorage.setItem('selectedLibraryKeys', JSON.stringify(selectedLibraries));
    localStorage.setItem('selectedGenres', JSON.stringify(selectedGenres)); // Store selected genres

    // In a real scenario, this would make an API call to create a room and get a real roomId
    const placeholderRoomId = 'test-room-123';
    navigate(`/room/${placeholderRoomId}`);
  };

  const displayedGenres = genres; // Always render all genres
  const genreContainerMaxHeight = showAllGenres ? 'none' : '150px'; // Dynamic maxHeight

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
        <h3>Genres</h3>
        {selectedLibraries.length === 0 ? (
          <p>Select libraries to see available genres.</p>
        ) : (
          <>
            {isLoadingGenres && <div>Loading genres...</div>}
            {isErrorGenres && <div>Error loading genres: {errorGenres?.message}</div>}
            <div style={{ maxHeight: genreContainerMaxHeight, overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}> {/* Dynamic maxHeight */}
              {displayedGenres?.map((genreName) => ( // Always map all genres
                <div key={genreName} style={{ marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id={`genre-${genreName}`}
                    value={genreName}
                    checked={selectedGenres.includes(genreName)}
                    onChange={handleGenreChange}
                  />
                  <label htmlFor={`genre-${genreName}`}>{genreName}</label>
                </div>
              ))}
            </div>
            {genres && genres.length > 0 && ( // Only show button if there are genres
              <button onClick={() => setShowAllGenres(!showAllGenres)} style={{ marginTop: '10px' }}>
                {showAllGenres ? 'Show Less' : 'Show More'}
              </button>
            )}
          </>
        )}
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
      {movieCount !== undefined && <div>{movieCount} items match your criteria.</div>}

      <button onClick={handleCreateRoom} disabled={selectedLibraries.length === 0 || movieCount === 0}>
        Create Room
      </button>
    </div>
  );
};

export default CreateRoomPage;



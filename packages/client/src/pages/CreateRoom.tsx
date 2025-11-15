import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlexLibraries } from '../hooks/usePlexLibraries';
import { useMovieCount } from '../hooks/useMovieCount';
import { usePlexGenres } from '../hooks/usePlexGenres';
import { usePlexYearRange } from '../hooks/usePlexYearRange';
import { usePlexContentRatings } from '../hooks/usePlexContentRatings';
import { Library, SelectedLibrary } from '../types';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: libraries, isLoading: isLoadingLibraries, isError: isErrorLibraries, error: errorLibraries } = usePlexLibraries();
  const [selectedLibraries, setSelectedLibraries] = useState<SelectedLibrary[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [selectedContentRatings, setSelectedContentRatings] = useState<string[]>([]); // New state for content ratings
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllContentRatings, setShowAllContentRatings] = useState(false); // New state for show/hide content ratings

  // Fetch genres based on selected libraries
  const { data: genres, isLoading: isLoadingGenres, isError: isErrorGenres, error: errorGenres } = usePlexGenres({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    libraryKeys: selectedLibraries.map(lib => lib.key),
  });

  // Fetch content ratings based on selected libraries
  const { data: contentRatings, isLoading: isLoadingContentRatings, isError: isErrorContentRatings, error: errorContentRatings } = usePlexContentRatings({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    selectedLibraries: selectedLibraries,
  });

  // Fetch movie count based on selected libraries and filters
  const { data: movieCount, isLoading: isLoadingMovieCount, isError: isErrorMovieCount, error: errorMovieCount } = useMovieCount({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    selectedLibraries: selectedLibraries,
    genre: selectedGenres.join(',') || undefined,
    yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
    yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
    contentRating: selectedContentRatings.join(',') || undefined, // Use selectedContentRatings
  });

  // Fetch year range for selected libraries
  const { data: yearRange } = usePlexYearRange({
    plexUrl: localStorage.getItem('plexUrl') || '',
    plexToken: localStorage.getItem('plexToken') || '',
    selectedLibraries: selectedLibraries,
  });

  // Effect to update yearMin/yearMax when yearRange changes, only if fields are empty
  useEffect(() => {
    if (yearRange && yearRange.minYear !== null && yearRange.maxYear !== null) {
      if (!yearMin) {
        setYearMin(yearRange.minYear.toString());
      }
      if (!yearMax) {
        setYearMax(yearRange.maxYear.toString());
      }
    }
  }, [yearRange, yearMin, yearMax]);

  const handleLibraryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const library = libraries?.find(lib => lib.key === value);

    if (!library) return;

    setSelectedLibraries((prevSelected) => {
      const newSelected = checked
        ? [...prevSelected, { key: library.key, type: library.type }]
        : prevSelected.filter((lib) => lib.key !== value);
      setSelectedGenres([]);
      setSelectedContentRatings([]); // Clear content ratings when libraries change
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

  const handleContentRatingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedContentRatings((prevSelected) =>
      checked
        ? [...prevSelected, value]
        : prevSelected.filter((rating) => rating !== value)
    );
  };

  const handleYearMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setYearMin(newMin);
    if (newMin && yearMax && parseInt(newMin, 10) > parseInt(yearMax, 10)) {
      setYearMax(newMin);
    }
  };

  const handleYearMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setYearMax(newMax);
    if (newMax && yearMin && parseInt(newMax, 10) < parseInt(yearMin, 10)) {
      setYearMin(newMax);
    }
  };

  const handleCreateRoom = () => {
    localStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));
    localStorage.setItem('selectedGenres', JSON.stringify(selectedGenres));
    localStorage.setItem('selectedContentRatings', JSON.stringify(selectedContentRatings)); // Save content ratings

    const placeholderRoomId = 'test-room-123';
    navigate(`/room/${placeholderRoomId}`);
  };

  const genreContainerMaxHeight = showAllGenres ? 'none' : '150px';
  const contentRatingContainerMaxHeight = showAllContentRatings ? 'none' : '150px'; // New for content ratings

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
            checked={selectedLibraries.some(lib => lib.key === library.key)}
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
            <div style={{ maxHeight: genreContainerMaxHeight, overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
              {genres?.map((genreName: string) => (
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
            {genres && genres.length > 0 && (
              <button onClick={() => setShowAllGenres(!showAllGenres)} style={{ marginTop: '10px' }}>
                {showAllGenres ? 'Show Less' : 'Show More'}
              </button>
            )}
          </>
        )}
      </div>

      {/* New Content Rating Section */}
      <div>
        <h3>Content Ratings</h3>
        {selectedLibraries.length === 0 ? (
          <p>Select libraries to see available content ratings.</p>
        ) : (
          <>
            {isLoadingContentRatings && <div>Loading content ratings...</div>}
            {isErrorContentRatings && <div>Error loading content ratings: {errorContentRatings?.message}</div>}
            <div style={{ maxHeight: contentRatingContainerMaxHeight, overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
              {contentRatings?.map((ratingName: string) => (
                <div key={ratingName} style={{ marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    id={`content-rating-${ratingName}`}
                    value={ratingName}
                    checked={selectedContentRatings.includes(ratingName)}
                    onChange={handleContentRatingChange}
                  />
                  <label htmlFor={`content-rating-${ratingName}`}>{ratingName}</label>
                </div>
              ))}
            </div>
            {contentRatings && contentRatings.length > 0 && (
              <button onClick={() => setShowAllContentRatings(!showAllContentRatings)} style={{ marginTop: '10px' }}>
                {showAllContentRatings ? 'Show Less' : 'Show More'}
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
          onChange={handleYearMinChange}
        />
      </div>
      <div>
        <label htmlFor="yearMax">Year Max:</label>
        <input
          type="number"
          id="yearMax"
          value={yearMax}
          onChange={handleYearMaxChange}
        />
      </div>
      {/* Removed old contentRating input field */}


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




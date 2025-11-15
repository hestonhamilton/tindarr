import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlexLibraries } from '../hooks/usePlexLibraries';
import { useMovieCount } from '../hooks/useMovieCount';
import { usePlexGenres } from '../hooks/usePlexGenres';
import { usePlexYearRange } from '../hooks/usePlexYearRange';
import { usePlexContentRatings } from '../hooks/usePlexContentRatings';
import { Library, SelectedLibrary } from '../types';
import { useSocket } from '../hooks/useSocket'; // Import useSocket
import { v4 as uuidv4 } from 'uuid';

// Define sorting options
const SORT_OPTIONS = [
  { label: 'Alphabetical (A-Z)', value: 'title:asc' },
  { label: 'Release Date (Newest First)', value: 'originallyAvailableAt:desc' },
  { label: 'Release Date (Oldest First)', value: 'originallyAvailableAt:asc' },
  { label: 'Critic Score (Highest First)', value: 'rating:desc' },
  { label: 'Critic Score (Lowest First)', value: 'rating:asc' },
  { label: 'Audience Score (Highest First)', value: 'audienceRating:desc' }, // New
  { label: 'Audience Score (Lowest First)', value: 'audienceRating:asc' },  // New
  { label: 'Duration (Shortest First)', value: 'duration:asc' },           // New
  { label: 'Duration (Longest First)', value: 'duration:desc' },            // New
  { label: 'Random', value: 'random' },
];

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: libraries, isLoading: isLoadingLibraries, isError: isErrorLibraries, error: errorLibraries } = usePlexLibraries();
  const [userName, setUserName] = useState<string>(''); // New state for user name
  const [roomCodeInput, setRoomCodeInput] = useState<string>(''); // New state for room code input
  const [selectedLibraries, setSelectedLibraries] = useState<SelectedLibrary[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [durationMin, setDurationMin] = useState<string>(''); // New state
  const [durationMax, setDurationMax] = useState<string>(''); // New state
  const [selectedContentRatings, setSelectedContentRatings] = useState<string[]>([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllContentRatings, setShowAllContentRatings] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>(SORT_OPTIONS[0].value); // New state for sort order
  const socket = useSocket(); // Establish socket connection

  // Effect to listen for roomCreated event
  useEffect(() => {
    if (socket) {
      socket.on('roomCreated', (room) => {
        navigate(`/room/${room.code}`);
      });
    }
    return () => {
      if (socket) {
        socket.off('roomCreated');
      }
    };
  }, [socket, navigate]);

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
    contentRating: selectedContentRatings.join(',') || undefined,
    durationMin: durationMin ? parseInt(durationMin, 10) * 60 * 1000 : undefined, // Convert minutes to milliseconds
    durationMax: durationMax ? parseInt(durationMax, 10) * 60 * 1000 : undefined, // Convert minutes to milliseconds
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
      setSelectedContentRatings([]);
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

  const handleDurationMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setDurationMin(newMin);
    if (newMin && durationMax && parseInt(newMin, 10) > parseInt(durationMax, 10)) {
      setDurationMax(newMin);
    }
  };

  const handleDurationMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setDurationMax(newMax);
    if (newMax && durationMin && parseInt(newMax, 10) < parseInt(durationMin, 10)) {
      setDurationMin(newMax);
    }
  };

  const handleCreateRoom = () => {
    const userId = uuidv4(); // Generate UUID for userId
    localStorage.setItem('userId', userId); // Store userId
    localStorage.setItem('userName', userName); // Store userName

    if (socket && userName) { // Ensure userName is provided
      socket.emit('createRoom', {
        user: { id: userId, name: userName },
        selectedLibraries: selectedLibraries,
        selectedGenres: selectedGenres,
        yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
        yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
        durationMin: durationMin ? parseInt(durationMin, 10) * 60 * 1000 : undefined, // Convert minutes to milliseconds
        durationMax: durationMax ? parseInt(durationMax, 10) * 60 * 1000 : undefined, // Convert minutes to milliseconds
        selectedContentRatings: selectedContentRatings,
        sortOrder: sortOrder,
      });
    } else {
      alert('Please enter your name to create a room.');
    }
  };

  const handleJoinRoom = () => {
    if (!userName || !roomCodeInput) {
      alert('Please enter your name and the room code.');
      return;
    }
    const userId = uuidv4(); // Generate UUID for userId
    localStorage.setItem('userId', userId); // Store userId
    localStorage.setItem('userName', userName); // Store userName
    navigate(`/room/${roomCodeInput}`);
  };

  const genreContainerMaxHeight = showAllGenres ? 'none' : '150px';
  const contentRatingContainerMaxHeight = showAllContentRatings ? 'none' : '150px';

  if (isLoadingLibraries) {
    return <div>Loading libraries...</div>;
  }

  if (isErrorLibraries) {
    return <div>Error loading libraries: {errorLibraries?.message}</div>;
  }

  return (
    <div>
      <h1>Create New Room</h1>
      <div>
        <label htmlFor="userName">Your Name:</label>
        <input
          type="text"
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
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

      {/* Content Rating Section */}
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

      {/* Duration Filter Section */}
      <div>
        <h3>Duration (minutes)</h3>
        <div>
          <label htmlFor="durationMin">Min:</label>
          <input
            type="number"
            id="durationMin"
            value={durationMin}
            onChange={handleDurationMinChange}
            step="1"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="durationMax">Max:</label>
          <input
            type="number"
            id="durationMax"
            value={durationMax}
            onChange={handleDurationMaxChange}
            step="1"
            min="0"
          />
        </div>
      </div>

      {/* New Sorting Options Section */}
      <div>
        <h3>Sort Order</h3>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <h2>Movie Count Preview</h2>
      {isLoadingMovieCount && <div>Loading movie count...</div>}
      {isErrorMovieCount && <div>Error loading movie count: {errorMovieCount?.message}</div>}
      {movieCount !== undefined && <div>{movieCount} items match your criteria.</div>}

      <button onClick={handleCreateRoom} disabled={selectedLibraries.length === 0 || movieCount === 0}>
        Create Room
      </button>

      <hr style={{ margin: '20px 0' }} />

      <h2>Join an Existing Room</h2>
      <div>
        <label htmlFor="roomCodeInput">Room Code:</label>
        <input
          type="text"
          id="roomCodeInput"
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} // Convert to uppercase
          placeholder="Enter room code"
          maxLength={6} // Assuming 6-character codes
        />
      </div>
      <button onClick={handleJoinRoom} disabled={!userName || !roomCodeInput}>Join Room</button>
    </div>
  );
};

export default CreateRoomPage;



